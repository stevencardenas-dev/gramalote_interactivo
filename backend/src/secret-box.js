// Cifrado simétrico (AES-256-GCM) para secretos que viven en la base: la
// contraseña de aplicación de Gmail y el secreto del formulario de Google.
// La llave sale de MAIL_SECRET_KEY o, si no existe, de JWT_SECRET; si esa
// variable cambia, basta con volver a escribir la contraseña en el panel.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { config } from './config.js'

function key() {
  const base = (process.env.MAIL_SECRET_KEY ?? '').trim() || config.auth.jwtSecret
  return createHash('sha256').update(`gramalote-secret-box:${base}`).digest()
}

export function seal(plain) {
  if (plain === null || plain === undefined || plain === '') return null
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const body = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()])
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), body.toString('base64')].join(':')
}

// null si no hay valor o si no se puede descifrar (llave distinta).
export function open(sealed) {
  if (!sealed) return null
  try {
    const [version, iv, tag, body] = String(sealed).split(':')
    if (version !== 'v1') return null
    const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'))
    decipher.setAuthTag(Buffer.from(tag, 'base64'))
    return Buffer.concat([decipher.update(Buffer.from(body, 'base64')), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}
