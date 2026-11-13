import { Router } from 'express'
import {
  clearRefreshCookie,
  hashPassword,
  newRefreshToken,
  placeholderHash,
  readRefreshCookie,
  refreshTokenHash,
  requireAuth,
  setRefreshCookie,
  signAccessToken,
  verifyPassword,
} from '../auth.js'
import { config } from '../config.js'
import { query, queryOne } from '../db.js'
import { ApiError, asyncHandler, stringParam } from '../http.js'
import { isMailReady } from '../mailer.js'
import { assertNotBlocked, clientIp, limitByIp, recordFailure, reset } from '../rate-limit.js'
import {
  createResetToken,
  resetTokenHash,
  sendPasswordChangedEmail,
  sendResetEmail,
} from '../password-reset.js'

const router = Router()

function toPublicUser(row) {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    lastLoginAt: row.last_login_at ?? null,
  }
}

async function issueSession(req, res, user) {
  const token = newRefreshToken()
  const expiresAt = new Date(Date.now() + config.auth.refreshTtlDays * 24 * 60 * 60 * 1000)
  const userAgent = (req.get('user-agent') ?? '').slice(0, 255) || null
  const ip = (req.ip ?? '').slice(0, 45) || null

  await query(
    `INSERT INTO admin_refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES (?, ?, ?, ?, ?)`,
    [user.id, refreshTokenHash(token), expiresAt, userAgent, ip],
  )
  setRefreshCookie(res, token)

  return {
    user: toPublicUser(user),
    accessToken: signAccessToken(user),
    tokenType: 'Bearer',
  }
}

// Inicio de sesión: como mucho 20 intentos cada 15 min y 60 por hora por IP;
// además, 5 contraseñas erradas seguidas para el mismo correo desde la misma
// IP bloquean ese par 15 minutos (y 15 fallos por correo desde cualquier IP).
const LOGIN_WINDOW = 15 * 60 * 1000
const LOCK_MESSAGE = 'Demasiados intentos fallidos. Espera 15 minutos o usa «¿Olvidaste tu contraseña?» (llega por correo).'

router.post(
  '/auth/login',
  limitByIp('login', [
    { windowMs: LOGIN_WINDOW, max: 20 },
    { windowMs: 60 * 60 * 1000, max: 60 },
  ]),
  asyncHandler(async (req, res) => {
    const email = stringParam(req.body?.email, { max: 190 })?.toLowerCase()
    const password =
      typeof req.body?.password === 'string' && req.body.password.length > 0
        ? req.body.password.slice(0, 256)
        : null

    if (!email || !password) {
      throw new ApiError(400, 'VALIDATION', 'Correo y contraseña son obligatorios')
    }

    const pairKey = `${clientIp(req)}|${email}`
    assertNotBlocked('login-fail', pairKey, { max: 5, message: LOCK_MESSAGE })
    assertNotBlocked('login-fail-email', email, { max: 15, message: LOCK_MESSAGE })

    const user = await queryOne(
      `SELECT id, name, email, password_hash, role, is_active, last_login_at
       FROM admin_users
       WHERE email = ? AND deleted_at IS NULL`,
      [email],
    )

    const hash = user?.password_hash ?? (await placeholderHash())
    const valid = await verifyPassword(password, hash)

    if (!user || !user.is_active || !valid) {
      recordFailure('login-fail', pairKey, { windowMs: LOGIN_WINDOW })
      recordFailure('login-fail-email', email, { windowMs: LOGIN_WINDOW })
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos')
    }

    reset('login-fail', pairKey)
    // Una sola sesión por cuenta: la versión sube y los refresh tokens
    // anteriores se revocan antes de emitir el nuevo.
    await query(
      'UPDATE admin_users SET last_login_at = NOW(), session_version = session_version + 1 WHERE id = ?',
      [user.id],
    )
    await query(
      'UPDATE admin_refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
      [user.id],
    )
    const session = await queryOne('SELECT session_version FROM admin_users WHERE id = ?', [user.id])
    res.json({
      data: await issueSession(req, res, { ...user, session_version: session.session_version }),
    })
  }),
)

router.post(
  '/auth/refresh',
  asyncHandler(async (req, res) => {
    const token = readRefreshCookie(req)
    if (!token) {
      throw new ApiError(401, 'UNAUTHORIZED', 'No hay sesión activa')
    }

    const row = await queryOne(
      `SELECT t.id, t.user_id, t.expires_at, t.revoked_at,
              u.name, u.email, u.role, u.is_active, u.last_login_at, u.session_version
       FROM admin_refresh_tokens t
       JOIN admin_users u ON u.id = t.user_id
       WHERE t.token_hash = ? AND u.deleted_at IS NULL`,
      [refreshTokenHash(token)],
    )

    const expired = row ? new Date(row.expires_at).getTime() <= Date.now() : true

    if (!row || row.revoked_at || expired || !row.is_active) {
      clearRefreshCookie(res)
      if (row?.revoked_at) {
        // Reutilización de un token ya canjeado: se revocan el resto.
        await query(
          'UPDATE admin_refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
          [row.user_id],
        )
      }
      throw new ApiError(401, 'INVALID_SESSION', 'La sesión expiró; vuelve a iniciar sesión')
    }

    await query('UPDATE admin_refresh_tokens SET revoked_at = NOW() WHERE id = ?', [row.id])
    const user = {
      id: Number(row.user_id),
      name: row.name,
      email: row.email,
      role: row.role,
      last_login_at: row.last_login_at,
      session_version: row.session_version,
    }
    res.json({ data: await issueSession(req, res, user) })
  }),
)

router.post(
  '/auth/logout',
  asyncHandler(async (req, res) => {
    const token = readRefreshCookie(req)
    if (token) {
      await query(
        'UPDATE admin_refresh_tokens SET revoked_at = COALESCE(revoked_at, NOW()) WHERE token_hash = ?',
        [refreshTokenHash(token)],
      )
    }
    clearRefreshCookie(res)
    res.status(204).end()
  }),
)

// Recuperar la contraseña solo funciona por correo: se envía un enlace de un
// solo uso y la respuesta no revela qué correos existen.
// Olvidé mi contraseña: 5 por IP cada 15 min y 20 por día (cada una puede
// mandar un correo). Por correo, 3 por hora: las de más se ignoran en silencio.
const forgotPerEmail = new Map()
function tooManyForgot(email) {
  const now = Date.now()
  const recent = (forgotPerEmail.get(email) ?? []).filter((time) => now - time < 60 * 60 * 1000)
  recent.push(now)
  forgotPerEmail.set(email, recent)
  if (forgotPerEmail.size > 1000) forgotPerEmail.clear()
  return recent.length > 3
}

router.post(
  '/auth/forgot',
  limitByIp('forgot', [
    { windowMs: 15 * 60 * 1000, max: 5 },
    { windowMs: 24 * 60 * 60 * 1000, max: 20 },
  ]),
  asyncHandler(async (req, res) => {
    const email = stringParam(req.body?.email, { max: 190 })?.toLowerCase()
    if (!(await isMailReady())) {
      throw new ApiError(
        503,
        'MAIL_OFF',
        'La recuperación por correo no está disponible por ahora. Intenta más tarde.',
      )
    }
    if (email && !tooManyForgot(email)) {
      const user = await queryOne(
        'SELECT id, name, email FROM admin_users WHERE email = ? AND is_active = 1 AND deleted_at IS NULL',
        [email],
      )
      if (user) {
        // Sin await: responder igual de rápido exista o no la cuenta. Un fallo
        // queda en el registro de correos del panel.
        createResetToken(user.id, { hours: 1 })
          .then((reset) => sendResetEmail(user, reset, 'forgot'))
          .catch((failure) => console.error('[mail] restablecer contraseña:', failure.message))
      }
    }
    res.json({
      data: {
        message:
          'Si el correo pertenece a una cuenta activa, te enviamos un enlace para crear una contraseña nueva. Vence en 1 hora; revisa también la carpeta de spam.',
      },
    })
  }),
)

router.post(
  '/auth/reset',
  limitByIp('reset', [{ windowMs: 15 * 60 * 1000, max: 20 }]),
  asyncHandler(async (req, res) => {
    const token = stringParam(req.body?.token, { max: 128 })
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    if (!token) throw new ApiError(400, 'VALIDATION', 'Falta el enlace de restablecimiento')
    if (password.length < 8 || password.length > 256) {
      throw new ApiError(400, 'VALIDATION', 'La contraseña debe tener entre 8 y 256 caracteres')
    }

    const reset = await queryOne(
      `SELECT r.id, r.user_id, r.expires_at, r.used_at, u.is_active
       FROM admin_password_resets r
       JOIN admin_users u ON u.id = r.user_id AND u.deleted_at IS NULL
       WHERE r.token_hash = ?`,
      [resetTokenHash(token)],
    )
    if (
      !reset ||
      reset.used_at ||
      !reset.is_active ||
      new Date(reset.expires_at).getTime() <= Date.now()
    ) {
      throw new ApiError(400, 'INVALID_RESET', 'El enlace no es válido o ya venció; pide uno nuevo')
    }

    await query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [
      await hashPassword(password),
      reset.user_id,
    ])
    await query('UPDATE admin_password_resets SET used_at = NOW() WHERE id = ?', [reset.id])
    await query(
      'UPDATE admin_refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
      [reset.user_id],
    )
    // La contraseña cambió: cualquier access token que ande por ahí deja de valer.
    await query('UPDATE admin_users SET session_version = session_version + 1 WHERE id = ?', [
      reset.user_id,
    ])
    await query(
      `INSERT INTO audit_log (admin_user_id, action, entity_type, entity_id, ip_address)
       VALUES (?, 'password_reset', 'admin_user', ?, ?)`,
      [reset.user_id, reset.user_id, (req.ip ?? '').slice(0, 45) || null],
    )
    sendPasswordChangedEmail(reset.user_id)
    res.status(204).end()
  }),
)

router.post(
  '/auth/change-password',
  requireAuth,
  limitByIp('change-password', [{ windowMs: 15 * 60 * 1000, max: 10 }]),
  asyncHandler(async (req, res) => {
    const current = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : ''
    const next = typeof req.body?.newPassword === 'string' ? req.body.newPassword : ''
    if (next.length < 8 || next.length > 256) {
      throw new ApiError(400, 'VALIDATION', 'La contraseña nueva debe tener entre 8 y 256 caracteres')
    }
    const user = await queryOne(
      'SELECT id, name, email, role, password_hash FROM admin_users WHERE id = ? AND is_active = 1 AND deleted_at IS NULL',
      [req.admin.id],
    )
    if (!user || !(await verifyPassword(current, user.password_hash))) {
      throw new ApiError(400, 'INVALID_CREDENTIALS', 'La contraseña actual no es correcta')
    }
    await query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [
      await hashPassword(next),
      user.id,
    ])
    // Cambiar la contraseña cierra las demás sesiones, pero deja abierta esta:
    // se revocan los refresh tokens y se emite uno nuevo con la versión al día.
    await query(
      'UPDATE admin_refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
      [user.id],
    )
    await query('UPDATE admin_users SET session_version = session_version + 1 WHERE id = ?', [
      user.id,
    ])
    const fresh = await queryOne('SELECT session_version FROM admin_users WHERE id = ?', [user.id])
    sendPasswordChangedEmail(user.id)
    res.json({
      data: await issueSession(req, res, { ...user, session_version: fresh.session_version }),
    })
  }),
)

router.get(
  '/auth/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await queryOne(
      `SELECT id, name, email, role, last_login_at
       FROM admin_users
       WHERE id = ? AND is_active = 1 AND deleted_at IS NULL`,
      [req.admin.id],
    )
    if (!user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'La cuenta ya no está activa')
    }
    res.json({ data: toPublicUser(user) })
  }),
)

export default router
