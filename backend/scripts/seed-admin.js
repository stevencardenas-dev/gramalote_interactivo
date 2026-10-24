// Crea la cuenta de administración a partir de backend/.env:
//   ADMIN_EMAIL, ADMIN_PASSWORD y ADMIN_NAME (opcional).
// Si la cuenta ya existe, rota su contraseña y la reactiva. Nunca imprime la contraseña.
// Uso: npm run seed:admin
import { hashPassword } from '../src/auth.js'
import { closePool, query, queryOne } from '../src/db.js'

const email = (process.env.ADMIN_EMAIL ?? '').trim()
const password = process.env.ADMIN_PASSWORD ?? ''
const name = (process.env.ADMIN_NAME ?? 'Administrador').trim()

if (!email || !password) {
  console.error('Define ADMIN_EMAIL y ADMIN_PASSWORD en backend/.env para crear la cuenta admin.')
  process.exit(1)
}

if (password.length < 8) {
  console.error('ADMIN_PASSWORD debe tener al menos 8 caracteres.')
  process.exit(1)
}

const passwordHash = await hashPassword(password)
const existing = await queryOne('SELECT id FROM admin_users WHERE email = ?', [email])

if (existing) {
  await query(
    `UPDATE admin_users
     SET password_hash = ?, name = ?, role = 'admin', is_active = 1, deleted_at = NULL
     WHERE id = ?`,
    [passwordHash, name, existing.id],
  )
  console.log(`Cuenta existente actualizada: ${email} (rol admin, contraseña rotada).`)
} else {
  await query(
    `INSERT INTO admin_users (name, email, password_hash, role, is_active)
     VALUES (?, ?, ?, 'admin', 1)`,
    [name, email, passwordHash],
  )
  console.log(`Cuenta admin creada: ${email} (rol admin).`)
}

await closePool()
