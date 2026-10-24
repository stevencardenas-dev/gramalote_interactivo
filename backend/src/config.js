import dotenv from 'dotenv'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) })

function integer(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function list(value, fallback) {
  const items = (value ?? fallback)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return items.length > 0 ? items : fallback.split(',')
}

function jwtSecret(env) {
  const secret = (process.env.JWT_SECRET ?? '').trim()
  if (secret) return secret
  if (env === 'production') {
    throw new Error(
      'JWT_SECRET es obligatorio en producción (genera uno con: openssl rand -hex 32)',
    )
  }
  console.warn(
    '[auth] JWT_SECRET no definido: se usa un secreto efímero y las sesiones caducan al reiniciar la API.',
  )
  return randomBytes(32).toString('hex')
}

const env = process.env.NODE_ENV ?? 'development'

export const config = {
  env,
  host: process.env.API_HOST ?? '127.0.0.1',
  port: integer(process.env.API_PORT, 4000),
  corsOrigins: list(
    process.env.CORS_ORIGIN,
    'http://localhost:5173,http://localhost:4173',
  ),
  auth: {
    jwtSecret: jwtSecret(env),
    accessTtl: process.env.AUTH_ACCESS_TTL ?? '30m',
    refreshTtlDays: integer(process.env.AUTH_REFRESH_TTL_DAYS, 7),
    cookieName: process.env.AUTH_COOKIE_NAME ?? 'gramalote_refresh',
    trustProxy: ['1', 'true', 'yes'].includes(
      (process.env.TRUST_PROXY ?? '').toLowerCase(),
    ),
  },
  db: {
    host: process.env.MYSQL_HOST ?? '127.0.0.1',
    port: integer(process.env.MYSQL_PORT, 3307),
    user: process.env.MYSQL_USER ?? 'gramalote',
    password: process.env.MYSQL_PASSWORD ?? '',
    database: process.env.MYSQL_DATABASE ?? 'gramalote',
    waitForConnections: true,
    connectionLimit: integer(process.env.DB_POOL_SIZE, 10),
    queueLimit: 0,
    charset: 'utf8mb4',
    dateStrings: true,
    decimalNumbers: true,
    namedPlaceholders: true,
  },
}
