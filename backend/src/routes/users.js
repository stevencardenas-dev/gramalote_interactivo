import { Router } from 'express'
import { randomBytes } from 'node:crypto'
import { clearRefreshCookie, hashPassword, requireAuth, verifyPassword } from '../auth.js'
import { query, queryOne } from '../db.js'
import { ApiError, asyncHandler, stringParam } from '../http.js'
import { isMailReady } from '../mailer.js'
import { createResetToken, sendEmailChangedNotice, sendResetEmail } from '../password-reset.js'

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

// «Más nuevo» = id mayor (las cuentas se numeran por orden de creación).
router.get(
  '/admin/users',
  requireAuth,
  requireAdminRole,
  asyncHandler(async (_req, res) => {
    const rows = await query(
      `SELECT id, name, email, role, is_active, last_login_at, created_at
       FROM admin_users
       WHERE deleted_at IS NULL
       ORDER BY is_active DESC, name`,
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
    // La invitación solo viaja por correo; el enlace nunca se muestra en el panel.
    const mailed = await mailResetLink(row, reset, 'invite')
    res.status(201).json({ data: { user: userRow(row), ...mailed } })
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
      await query('UPDATE admin_users SET session_version = session_version + 1 WHERE id = ?', [id])
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

// El enlace para crear una contraseña nueva solo se envía por correo; el
// panel nunca lo muestra.
router.post(
  '/admin/users/:id/send-reset',
  requireAuth,
  requireAdminRole,
  asyncHandler(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10)
    const target = await queryOne(
      'SELECT id, name, email FROM admin_users WHERE id = ? AND deleted_at IS NULL',
      [id],
    )
    if (!target) throw new ApiError(404, 'NOT_FOUND', 'Usuario no encontrado')
    if (!(await isMailReady())) {
      throw new ApiError(503, 'MAIL_OFF', 'El correo saliente no está configurado (Panel › Correo)')
    }

    const reset = await createResetToken(id, { createdBy: req.admin.id, hours: 24 })
    const mailed = await mailResetLink(target, reset, 'admin')
    if (!mailed.mailed) {
      throw new ApiError(502, 'MAIL_FAILED', `No se pudo enviar el correo: ${mailed.mailError}`)
    }
    await query(
      `INSERT INTO audit_log (admin_user_id, action, entity_type, entity_id, ip_address)
       VALUES (?, 'password_reset_link', 'admin_user', ?, ?)`,
      [req.admin.id, id, clientIp(req)],
    )
    res.status(201).json({ data: { mailed: true } })
  }),
)

// Cambiar el correo: cada quien el suyo (con su contraseña actual); un
// administrador, el de las cuentas más nuevas que la suya.
router.patch(
  '/admin/users/:id/email',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10)
    const self = id === req.admin.id
    if (!self && req.admin.role !== 'admin') {
      throw new ApiError(403, 'FORBIDDEN', 'Solo puedes cambiar tu propio correo')
    }
    if (!self && id < req.admin.id) {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Solo puedes cambiar el correo de cuentas más nuevas que la tuya',
      )
    }
    const target = await queryOne(
      'SELECT id, name, email, password_hash FROM admin_users WHERE id = ? AND deleted_at IS NULL',
      [id],
    )
    if (!target) throw new ApiError(404, 'NOT_FOUND', 'Usuario no encontrado')

    const email = stringParam(req.body?.email, { max: 190 })?.toLowerCase()
    if (!email || !EMAIL.test(email)) throw new ApiError(400, 'VALIDATION', 'Escribe un correo válido')
    if (email === target.email) {
      throw new ApiError(400, 'VALIDATION', 'Ese ya es el correo de la cuenta')
    }
    if (self) {
      const password = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : ''
      if (!(await verifyPassword(password, target.password_hash))) {
        throw new ApiError(400, 'INVALID_CREDENTIALS', 'La contraseña actual no es correcta')
      }
    }
    const taken = await queryOne('SELECT id FROM admin_users WHERE email = ? AND id <> ?', [email, id])
    if (taken) throw new ApiError(409, 'DUPLICATE', 'Ya existe una cuenta con ese correo')

    await query('UPDATE admin_users SET email = ? WHERE id = ?', [email, id])
    // Las sesiones ajenas se cierran: la persona entra de nuevo con el correo nuevo.
    if (!self) {
      await query(
        'UPDATE admin_refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
        [id],
      )
      await query('UPDATE admin_users SET session_version = session_version + 1 WHERE id = ?', [id])
    }
    await query(
      `INSERT INTO audit_log (admin_user_id, action, entity_type, entity_id, changes, ip_address)
       VALUES (?, 'update_email', 'admin_user', ?, ?, ?)`,
      [req.admin.id, id, JSON.stringify({ from: target.email, to: email }), clientIp(req)],
    )
    sendEmailChangedNotice(target, email)
    const row = await queryOne(
      'SELECT id, name, email, role, is_active, last_login_at, created_at FROM admin_users WHERE id = ?',
      [id],
    )
    res.json({ data: userRow(row) })
  }),
)

// Eliminar: solo administradores, y solo cuentas más nuevas que la suya o la
// propia (siempre que quede otro administrador activo). Una cuenta más
// antigua tiene que eliminarse a sí misma.
router.delete(
  '/admin/users/:id',
  requireAuth,
  requireAdminRole,
  asyncHandler(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10)
    const self = id === req.admin.id
    if (!self && id < req.admin.id) {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Solo puedes eliminar cuentas más nuevas que la tuya; una cuenta más antigua debe eliminarse a sí misma',
      )
    }
    const target = await queryOne(
      'SELECT id, name, email, role, is_active FROM admin_users WHERE id = ? AND deleted_at IS NULL',
      [id],
    )
    if (!target) throw new ApiError(404, 'NOT_FOUND', 'Usuario no encontrado')

    if (target.role === 'admin' && Boolean(target.is_active) && (await activeAdmins()) <= 1) {
      throw new ApiError(400, 'VALIDATION', 'Debe quedar al menos un administrador activo')
    }

    // Baja lógica: conserva el historial (audit_log) y libera el correo.
    await query(
      `UPDATE admin_users
       SET deleted_at = NOW(), is_active = 0, email = CONCAT('eliminada-', id, '@cuenta.invalid')
       WHERE id = ?`,
      [id],
    )
    await query(
      'UPDATE admin_refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
      [id],
    )
    await query('UPDATE admin_users SET session_version = session_version + 1 WHERE id = ?', [id])
    await query(
      'UPDATE admin_password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
      [id],
    )
    await query(
      `INSERT INTO audit_log (admin_user_id, action, entity_type, entity_id, changes, ip_address)
       VALUES (?, 'delete', 'admin_user', ?, ?, ?)`,
      [req.admin.id, id, JSON.stringify({ email: target.email, role: target.role }), clientIp(req)],
    )
    if (self) clearRefreshCookie(res)
    res.status(204).end()
  }),
)

export default router
