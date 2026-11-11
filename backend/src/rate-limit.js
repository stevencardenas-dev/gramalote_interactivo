// Límite de peticiones por IP (y por otras claves, como IP + correo) en memoria.
//
// Basta con una sola instancia de la API: los contadores viven en este proceso
// y se pierden al reiniciar (aceptable: el objetivo es frenar ataques de fuerza
// bruta y spam, no llevar cuentas exactas). Si algún día hay varias réplicas,
// hay que moverlos a la base o a Redis.
//
// La IP sale de req.ip, que solo es la del visitante si Express confía en el
// número correcto de proxies (TRUST_PROXY_HOPS: CloudFront + nginx = 2).
import { ApiError } from './http.js'

const buckets = new Map()

// Ventana fija: { count, resetAt } por «nombre|clave».
function bucket(id, windowMs) {
  const now = Date.now()
  let entry = buckets.get(id)
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs }
    buckets.set(id, entry)
  }
  return entry
}

// Limpieza periódica para que el mapa no crezca sin límite.
setInterval(() => {
  const now = Date.now()
  for (const [id, entry] of buckets) if (entry.resetAt <= now) buckets.delete(id)
}, 60_000).unref()

export function clientIp(req) {
  return (req.ip ?? '').replace(/^::ffff:/, '').slice(0, 45) || 'sin-ip'
}

function tooMany(retryMs, message) {
  const error = new ApiError(429, 'TOO_MANY_REQUESTS', message)
  error.retryAfter = Math.max(1, Math.ceil(retryMs / 1000))
  return error
}

function waitText(ms) {
  const minutes = Math.ceil(ms / 60_000)
  return minutes <= 1 ? 'un minuto' : minutes < 60 ? `${minutes} minutos` : `${Math.ceil(minutes / 60)} horas`
}

// Cuenta un intento y lanza 429 si se pasa del máximo.
export function consume(name, key, { windowMs, max, message }) {
  const entry = bucket(`${name}|${key}`, windowMs)
  entry.count += 1
  if (entry.count > max) {
    const retry = entry.resetAt - Date.now()
    throw tooMany(retry, message ?? `Demasiados intentos. Espera ${waitText(retry)} e inténtalo de nuevo.`)
  }
}

// Solo comprueba (sin contar): para bloquear tras N fallos.
export function assertNotBlocked(name, key, { max, message }) {
  const entry = buckets.get(`${name}|${key}`)
  if (entry && entry.resetAt > Date.now() && entry.count >= max) {
    const retry = entry.resetAt - Date.now()
    throw tooMany(retry, message ?? `Demasiados intentos. Espera ${waitText(retry)} e inténtalo de nuevo.`)
  }
}

// Suma un fallo sin lanzar.
export function recordFailure(name, key, { windowMs }) {
  bucket(`${name}|${key}`, windowMs).count += 1
}

export function reset(name, key) {
  buckets.delete(`${name}|${key}`)
}

// Middleware: varios límites por IP a la vez, p. ej. por hora y por día.
export function limitByIp(name, rules) {
  return (req, _res, next) => {
    try {
      const ip = clientIp(req)
      rules.forEach((rule, index) => consume(`${name}#${index}`, ip, rule))
      next()
    } catch (error) {
      next(error)
    }
  }
}
