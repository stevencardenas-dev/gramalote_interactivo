import { createHash, randomBytes } from 'node:crypto'
import { query } from './db.js'

export function resetTokenHash(token) {
  return createHash('sha256').update(token).digest('hex')
}

// Crea un enlace de un solo uso. Devuelve el token original: es la única vez
// que existe en claro; en la base solo queda su hash.
export async function createResetToken(userId, { createdBy = null, hours = 1 } = {}) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)
  // Un solo enlace vigente por usuario.
  await query(
    'UPDATE admin_password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
    [userId],
  )
  await query(
    `INSERT INTO admin_password_resets (user_id, token_hash, expires_at, created_by)
     VALUES (?, ?, ?, ?)`,
    [userId, resetTokenHash(token), expiresAt, createdBy],
  )
  return { token, path: `/restablecer?token=${token}`, expiresAt: expiresAt.toISOString() }
}
