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

router.post(
  '/auth/login',
  asyncHandler(async (req, res) => {
    const email = stringParam(req.body?.email, { max: 190 })
    const password =
      typeof req.body?.password === 'string' && req.body.password.length > 0
        ? req.body.password.slice(0, 256)
        : null

    if (!email || !password) {
      throw new ApiError(400, 'VALIDATION', 'Correo y contraseña son obligatorios')
    }

    const user = await queryOne(
      `SELECT id, name, email, password_hash, role, is_active, last_login_at
       FROM admin_users
       WHERE email = ? AND deleted_at IS NULL`,
      [email],
    )

    const hash = user?.password_hash ?? (await placeholderHash())
    const valid = await verifyPassword(password, hash)

    if (!user || !user.is_active || !valid) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos')
    }

    await query('UPDATE admin_users SET last_login_at = NOW() WHERE id = ?', [user.id])
    res.json({ data: await issueSession(req, res, user) })
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
              u.name, u.email, u.role, u.is_active, u.last_login_at
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

// Límite sencillo en memoria para no inundar el aviso de "olvidé mi clave".
const forgotHits = new Map()
function tooManyForgot(key) {
  const now = Date.now()
  const recent = (forgotHits.get(key) ?? []).filter((time) => now - time < 15 * 60 * 1000)
  recent.push(now)
  forgotHits.set(key, recent)
  if (forgotHits.size > 500) forgotHits.clear()
  return recent.length > 5
}

// Con correo configurado (Panel › Correo) se envía el enlace directamente. Sin
// correo, la solicitud queda registrada y un administrador ve el aviso en
// Usuarios para generar el enlace. La respuesta no revela qué correos existen.
router.post(
  '/auth/forgot',
  asyncHandler(async (req, res) => {
    const email = stringParam(req.body?.email, { max: 190 })?.toLowerCase()
    const ip = (req.ip ?? '').slice(0, 45) || null
    const mailOn = await isMailReady()
    if (email && !tooManyForgot(`${ip}|${email}`)) {
      const user = await queryOne(
        'SELECT id, name, email FROM admin_users WHERE email = ? AND is_active = 1 AND deleted_at IS NULL',
        [email],
      )
      if (user) {
        await query(
          `INSERT INTO audit_log (admin_user_id, action, entity_type, entity_id, ip_address)
           VALUES (NULL, 'password_reset_requested', 'admin_user', ?, ?)`,
          [user.id, ip],
        )
        if (mailOn) {
          // Sin await: responder igual de rápido exista o no la cuenta. Un fallo
          // queda en el registro de correos del panel y en el aviso de Usuarios.
          createResetToken(user.id, { hours: 1 })
            .then((reset) => sendResetEmail(user, reset, 'forgot'))
            .catch((failure) => console.error('[mail] restablecer contraseña:', failure.message))
        }
      }
    }
    res.json({
      data: {
        message: mailOn
          ? 'Si el correo pertenece a una cuenta activa, te enviamos un enlace para crear una contraseña nueva. Vence en 1 hora; revisa también la carpeta de spam.'
          : 'Si el correo pertenece a una cuenta activa, un administrador recibió el aviso y te enviará un enlace para crear una contraseña nueva.',
      },
    })
  }),
)

router.post(
  '/auth/reset',
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
  asyncHandler(async (req, res) => {
    const current = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : ''
    const next = typeof req.body?.newPassword === 'string' ? req.body.newPassword : ''
    if (next.length < 8 || next.length > 256) {
      throw new ApiError(400, 'VALIDATION', 'La contraseña nueva debe tener entre 8 y 256 caracteres')
    }
    const user = await queryOne(
      'SELECT id, password_hash FROM admin_users WHERE id = ? AND is_active = 1 AND deleted_at IS NULL',
      [req.admin.id],
    )
    if (!user || !(await verifyPassword(current, user.password_hash))) {
      throw new ApiError(400, 'INVALID_CREDENTIALS', 'La contraseña actual no es correcta')
    }
    await query('UPDATE admin_users SET password_hash = ? WHERE id = ?', [
      await hashPassword(next),
      user.id,
    ])
    sendPasswordChangedEmail(user.id)
    res.status(204).end()
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
