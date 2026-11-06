// Carga el contenido editorial del sitio desde database/seed-content.sql:
// establecimientos, experiencias, curiosidades, información práctica,
// textos de página y el índice de búsqueda.
// Es re-ejecutable: reemplaza el contenido sin tocar cuentas ni medios.
// Uso: npm run seed:content
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import { config } from '../src/config.js'

const file = fileURLToPath(new URL('../database/seed-content.sql', import.meta.url))
const sql = await readFile(file, 'utf8')

const connection = await mysql.createConnection({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  charset: 'utf8mb4',
  multipleStatements: true,
})

try {
  await connection.query(sql)

  const [[summary]] = await connection.query(`
    SELECT
      (SELECT COUNT(*) FROM establishments WHERE deleted_at IS NULL) AS establishments,
      (SELECT COUNT(*) FROM establishments WHERE is_published = 1) AS published_establishments,
      (SELECT COUNT(*) FROM experiences) AS experiences,
      (SELECT COUNT(*) FROM experience_tips) AS experience_tips,
      (SELECT COUNT(*) FROM curiosities) AS curiosities,
      (SELECT COUNT(*) FROM curiosity_blocks) AS curiosity_blocks,
      (SELECT COUNT(*) FROM opening_hours) AS opening_hours,
      (SELECT COUNT(*) FROM access_routes) AS access_routes,
      (SELECT COUNT(*) FROM useful_contacts) AS contacts,
      (SELECT COUNT(*) FROM site_settings) AS settings,
      (SELECT COUNT(*) FROM search_documents) AS search_documents
  `)

  console.log('Contenido cargado:')
  console.log(`  establecimientos: ${summary.establishments} (${summary.published_establishments} publicados)`)
  console.log(`  experiencias: ${summary.experiences} · consejos: ${summary.experience_tips}`)
  console.log(`  curiosidades: ${summary.curiosities} · bloques: ${summary.curiosity_blocks}`)
  console.log(`  horarios: ${summary.opening_hours} · rutas de acceso: ${summary.access_routes}`)
  console.log(`  contactos: ${summary.contacts} · ajustes del sitio: ${summary.settings}`)
  console.log(`  documentos de búsqueda: ${summary.search_documents}`)

  const expected = {
    establishments: 19,
    published_establishments: 18,
    experiences: 3,
    curiosities: 4,
    curiosity_blocks: 20,
    opening_hours: 72,
  }
  const mismatches = Object.entries(expected).filter(
    ([key, value]) => Number(summary[key]) !== value,
  )

  if (mismatches.length > 0) {
    console.error(
      `\nConteos inesperados: ${mismatches
        .map(([key, value]) => `${key}=${summary[key]} (esperado ${value})`)
        .join(', ')}`,
    )
    process.exitCode = 1
  }
} catch (error) {
  console.error('No se pudo cargar el contenido:', error.message)
  process.exitCode = 1
} finally {
  await connection.end()
}
