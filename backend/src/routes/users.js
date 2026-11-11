import { Router } from 'express'
import { randomBytes } from 'node:crypto'
import { hashPassword, requireAuth } from '../auth.js'
import { query, queryOne } from '../db.js'
import { ApiError, asyncHandler, stringParam } from '../http.js'
import { isMailReady } from '../mailer.js'
import { createResetToken, sendResetEmail } from '../password-reset.js'

const router = Router()
const ROLES = new Set(['admin', 'editor'])
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function requireAdminRole(req, _res, next) {
  if (req.admin?.role !== 'admin') {
    next(new ApiError(403, 'FORBIDDEN', 'Solo un administrador gestiona usuarios'))
    return
  }
  next()
}

function userRow(row) {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: Boolean(row.is_active),
    lastLoginAt: row.last_login_at ?? null,
    createdAt: row.created_at ?? null,
    resetRequestedAt: row.reset_requested_at ?? null,
  }
}

function clientIp(req) {
  return (req.ip ?? '').slice(0, 45) || null
}

// { mailed: true } si salió el correo; { mailed: false, mailError } si no.
async function mailResetLink(user, reset, reason) {
  if (!(await isMailReady())) return { mailed: false, mailError: 'El correo saliente no está configurado' }
  try {
    await sendResetEmail(user, reset, reason)
    return { mailed: true }
  } catch (failure) {
    return { mailed: false, mailError: failure.message }
  }
}

async function activeAdmins() {
  const row = await queryOne(
    `SELECT COUNT(*) AS total FROM admin_users
     WHERE role = 'admin' AND is_active = 1 AND deleted_at IS NULL`,
  )
  return Number(row.total)
}

router.get(
  '/admin/users',
  requireAuth,
  requireAdminRole,
  asyncHandler(async (_req, res) => {
    // resetRequestedAt: el usuario pidió restablecer y aún no se le generó enlace.
    const rows = await query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.last_login_at, u.created_at,
              (SELECT MAX(a.created_at) FROM audit_log a
               WHERE a.action = 'password_reset_requested' AND a.entity_type = 'admin_user'
                 AND a.entity_id = u.id
                 AND a.created_at > COALESCE(
                   (SELECT MAX(r.created_at) FROM admin_password_resets r WHERE r.user_id = u.id),
                   '1970-01-01')) AS reset_requested_at
       FROM admin_users u
       WHERE u.deleted_at IS NULL
       ORDER BY u.is_active DESC, u.name`,
    )
    res.json({ data: rows.map(userRow) })
  }),
)

router.post(
  '/admin/users',
  requireAuth,
  requireAdminRole,
  asyncHandler(async (req, res) => {
    const name = stringParam(req.body?.name, { max: 160 })
    const email = stringParam(req.body?.email, { max: 190 })?.toLowerCase()
    const role = req.body?.role ?? 'editor'
    if (!name) throw new ApiError(400, 'VALIDATION', 'El nombre es obligatorio')
    if (!email || !EMAIL.test(email)) {
      throw new ApiError(400, 'VALIDATION', 'Escribe un correo válido')
    }
    if (!ROLES.has(role)) throw new ApiError(400, 'VALIDATION', 'Rol no válido')

    const existing = await queryOne('SELECT id FROM admin_users WHERE email = ?', [email])
    if (existing) throw new ApiError(409, 'DUPLICATE', 'Ya existe una cuenta con ese correo')

    // Contraseña aleatoria inutilizable: la persona la define con el enlace.
    const hash = await hashPassword(randomBytes(24).toString('hex'))
    const result = await query(
      `INSERT INTO admin_users (name, email, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, 1)`,
      [name, email, hash, role],
    )
    const id = Number(result.insertId)
    const reset = await createResetToken(id, { createdBy: req.admin.id, hours: 72 })
    await query(
      `INSERT INTO audit_log (admin_user_id, action, entity_type, entity_id, changes, ip_address)
       VALUES (?, 'create', 'admin_user', ?, ?, ?)`,
      [req.admin.id, id, JSON.stringify({ email, role }), clientIp(req)],
    )
    const row = await queryOne(
      'SELECT id, name, email, role, is_active, last_login_at, created_at FROM admin_users WHERE id = ?',
      [id],
    )
    // Con correo configurado, la invitación llega sola; el enlace se devuelve
    // igual por si el correo no llega.
    const mailed = await mailResetLink(row, reset, 'invite')
    res.status(201).json({ data: { user: userRow(row), reset: { ...reset, ...mailed } } })
  }),
)

router.patch(
  '/admin/users/:id',
  requireAuth,
  requireAdminRole,
  asyncHandler(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10)
    const target = await queryOne(
      `SELECT id, name, email, role, is_active FROM admin_users
       WHERE id = ? AND deleted_at IS NULL`,
      [id],
    )
    if (!target) throw new ApiError(404, 'NOT_FOUND', 'Usuario no encontrado')

    const name =
      req.body?.name === undefined ? target.name : stringParam(req.body.name, { max: 160 })
    const role = req.body?.role ?? target.role
    const isActive =
      req.body?.isActive === undefined ? Boolean(target.is_active) : Boolean(req.body.isActive)
    if (!name) throw new ApiError(400, 'VALIDATION', 'El nombre es obligatorio')
    if (!ROLES.has(role)) throw new ApiError(400, 'VALIDATION', 'Rol no válido')

    const losesAdmin =
      target.role === 'admin' && Boolean(target.is_active) && (role !== 'admin' || !isActive)
    if (losesAdmin) {
      if (Number(target.id) === req.admin.id) {
        throw new ApiError(400, 'VALIDATION', 'No puedes quitarte tu propio acceso de administrador')
      }
      if ((await activeAdmins()) <= 1) {
        throw new ApiError(400, 'VALIDATION', 'Debe quedar al menos un administrador activo')
      }
    }

    await query('UPDATE admin_users SET name = ?, role = ?, is_active = ? WHERE id = ?', [
      name,
      role,
      isActive ? 1 : 0,
      id,
    ])
    if (!isActive || role !== target.role) {
      // Cierra las sesiones abiertas: el rol viaja dentro del access token.
      await query(
        'UPDATE admin_refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
        [id],
      )
    }
    await query(
      `INSERT INTO audit_log (admin_user_id, action, entity_type, entity_id, changes, ip_address)
       VALUES (?, 'update', 'admin_user', ?, ?, ?)`,
      [req.admin.id, id, JSON.stringify({ role, isActive }), clientIp(req)],
    )
    const row = await queryOne(
      'SELECT id, name, email, role, is_active, last_login_at, created_at FROM admin_users WHERE id = ?',
      [id],
    )
    res.json({ data: userRow(row) })
  }),
)

router.post(
  '/admin/users/:id/reset-link',
  requireAuth,
  requireAdminRole,
  asyncHandler(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10)
    const target = await queryOne(
      'SELECT id, name, email FROM admin_users WHERE id = ? AND deleted_at IS NULL',
      [id],
    )
    if (!target) throw new ApiError(404, 'NOT_FOUND', 'Usuario no encontrado')

    const reset = await createResetToken(id, { createdBy: req.admin.id, hours: 24 })
    await query(
      `INSERT INTO audit_log (admin_user_id, action, entity_type, entity_id, ip_address)
       VALUES (?, 'password_reset_link', 'admin_user', ?, ?)`,
      [req.admin.id, id, clientIp(req)],
    )
    // send: true → además de mostrarlo, se envía al correo de la cuenta.
    const mailed = req.body?.send ? await mailResetLink(target, reset, 'admin') : {}
    res.status(201).json({ data: { ...reset, ...mailed } })
  }),
)

export default router
