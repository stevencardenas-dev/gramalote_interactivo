import dotenv from 'dotenv'
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

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  host: process.env.API_HOST ?? '127.0.0.1',
  port: integer(process.env.API_PORT, 4000),
  corsOrigins: list(
    process.env.CORS_ORIGIN,
    'http://localhost:5173,http://localhost:4173',
  ),
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
