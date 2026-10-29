// Aplica los .sql de database/migrations en orden y registra cuáles ya corrieron.
// Uso: npm run db:migrate
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import { config } from '../src/config.js'

const MIGRATIONS_DIR = fileURLToPath(
  new URL('../database/migrations/', import.meta.url),
)

async function main() {
  const files = (await readdir(MIGRATIONS_DIR))
    .filter((file) => file.endsWith('.sql'))
    .sort()

  if (files.length === 0) {
    console.log('No hay migraciones en database/migrations/.')
    return
  }

  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    multipleStatements: true,
  })

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name       VARCHAR(180) NOT NULL,
        checksum   CHAR(64) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (name)
      ) ENGINE=InnoDB
    `)

    const [appliedRows] = await connection.query(
      'SELECT name, checksum FROM schema_migrations',
    )
    const applied = new Map(appliedRows.map((row) => [row.name, row.checksum]))

    let executed = 0
    for (const file of files) {
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8')
      const checksum = createHash('sha256').update(sql).digest('hex')
      const previous = applied.get(file)

      if (previous === checksum) {
        console.log(`= ${file} (ya aplicada)`)
        continue
      }
      if (previous && previous !== checksum) {
        throw new Error(
          `${file} cambió después de aplicarse. Crea una migración nueva en lugar de editar una ya ejecutada.`,
        )
      }

      console.log(`> ${file}`)
      await connection.query(sql)
      await connection.query(
        'INSERT INTO schema_migrations (name, checksum) VALUES (?, ?)',
        [file, checksum],
      )
      executed += 1
    }

    console.log(
      executed === 0
        ? 'Base de datos al día.'
        : `Listo: ${executed} migración(es) aplicada(s).`,
    )
  } finally {
    await connection.end()
  }
}

main().catch((error) => {
  console.error(`Error aplicando migraciones: ${error.message}`)
  process.exitCode = 1
})
