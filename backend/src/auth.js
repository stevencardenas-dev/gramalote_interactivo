import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from './config.js'
import { ApiError } from './http.js'

const ROUNDS = 12
const REFRESH_PATH = '/api/auth'

let placeholder = null

export function hashPassword(plain) {
  return bcrypt.hash(plain, ROUNDS)
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash)
}

// Se compara contra este hash cuando el correo no existe, para que la
// respuesta tarde lo mismo y no se revele qué cuentas hay.
export async function placeholderHash() {
  placeholder ??= await bcrypt.hash(randomBytes(16).toString('hex'), ROUNDS)
  return placeholder
}

export function signAccessToken(admin) {
  return jwt.sign(
    { sub: String(admin.id), role: admin.role, name: admin.name, email: admin.email },
    config.auth.jwtSecret,
    { expiresIn: config.auth.accessTtl },
  )
}

export function requireAuth(req, _res, next) {
  const header = req.get('authorization') ?? ''
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    next(new ApiError(401, 'UNAUTHORIZED', 'Se requiere iniciar sesión'))
    return
  }

  let payload
  try {
    payload = jwt.verify(token, config.auth.jwtSecret)
  } catch {
    next(new ApiError(401, 'INVALID_TOKEN', 'La sesión expiró; vuelve a iniciar sesión'))
    return
  }

  req.admin = {
    id: Number(payload.sub),
    role: payload.role,
    name: payload.name,
    email: payload.email,
  }
  next()
}

export function newRefreshToken() {
  return randomBytes(32).toString('hex')
}

export function refreshTokenHash(token) {
  return createHash('sha256').update(token).digest('hex')
}

export function readRefreshCookie(req) {
  const header = req.headers.cookie
  if (!header) return null
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index === -1) continue
    if (part.slice(0, index).trim() !== config.auth.cookieName) continue
    try {
      return decodeURIComponent(part.slice(index + 1).trim())
    } catch {
      return null
    }
  }
  return null
}

export function setRefreshCookie(res, token) {
  res.cookie(config.auth.cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: res.req.secure,
    path: REFRESH_PATH,
    maxAge: config.auth.refreshTtlDays * 24 * 60 * 60 * 1000,
  })
}

export function clearRefreshCookie(res) {
  res.clearCookie(config.auth.cookieName, { path: REFRESH_PATH })
}
