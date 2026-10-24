import { Router } from 'express'
import {
  clearRefreshCookie,
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
