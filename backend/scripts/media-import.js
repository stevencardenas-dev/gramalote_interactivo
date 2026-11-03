// Sube las fotos de las fichas (entrega de Drive) al disco de medios y las
// registra en MySQL: portada, encabezado, galería y foto de cada plato o producto.
// Uso:
//   npm run media:import            # importa lo que falte
//   node scripts/media-import.js --dry-run
//
// Es idempotente y solo toca cada ficha una vez: si ya tiene fotos (subidas
// desde el panel o de una importación anterior) se deja como está, para no
// pisar lo que haya cambiado un administrador.
import { readFile } from 'node:fs/promises'
import { closePool, query, withTransaction } from '../src/db.js'
import { ensureDir, mediaRoot, removeImageFiles, storeImage } from '../src/media.js'

const SEED_DIR = new URL('../database/media-seed/', import.meta.url)
const dryRun = process.argv.includes('--dry-run')

const sourceRef = (file) => `seed:establecimientos/${file}`

async function loadManifest() {
  const raw = await readFile(new URL('establecimientos.json', SEED_DIR), 'utf8')
  return JSON.parse(raw)
}

// Lista de fotos de una ficha con su rol y el texto alternativo.
function photosFor(name, entry) {
  const photos = []
  // `alt` y `credit` son opcionales (fotos de stock: crédito y licencia).
  const alt = entry.alt ?? name
  const credit = entry.credit ?? null
  if (entry.cover) photos.push({ file: entry.cover, role: 'cover', alt, credit })
  if (entry.hero) photos.push({ file: entry.hero, role: 'hero', alt, credit })
  for (const file of entry.gallery ?? []) {
    photos.push({ file, role: 'gallery', alt: name })
  }
  for (const feature of entry.features ?? []) {
    photos.push({ file: feature.photo, role: 'gallery', alt: `${feature.title} en ${name}` })
  }
  for (const product of entry.products ?? []) {
    photos.push({ file: product.photo, role: 'gallery', alt: `${product.name} de ${name}` })
  }
  // Un mismo archivo puede repetirse (p. ej. la portada como plato): se queda
  // con el primer rol para no duplicarlo en la galería.
  const seen = new Set()
  return photos.filter((photo) => {
    if (seen.has(photo.file)) return false
    seen.add(photo.file)
    return true
  })
}

const normalize = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

async function importEstablishment(establishment, entry) {
  const photos = photosFor(establishment.name, entry)
  const stored = new Map()

  // Primero los archivos (fuera de la transacción: sharp tarda y no bloquea MySQL).
  for (const photo of photos) {
    const buffer = await readFile(new URL(`establecimientos/${photo.file}`, SEED_DIR))
    stored.set(
      photo.file,
      await storeImage(buffer, { folder: `establishments/${establishment.id}`, role: photo.role }),
    )
  }

  try {
    await withTransaction(async (connection) => {
      const mediaIds = new Map()
      for (const [file, image] of stored) {
        const photo = photos.find((item) => item.file === file)
        const alt = photo?.alt ?? establishment.name
        const [result] = await connection.query(
          `INSERT INTO media
             (storage_disk, storage_path, public_url, mime_type, width_px, height_px,
              alt_text, credit, source, source_ref, checksum_sha256)
           VALUES ('local', ?, ?, ?, ?, ?, ?, ?, 'drive', ?, ?)`,
          [
            image.storagePath,
            image.publicUrl,
            image.mimeType,
            image.width,
            image.height,
            alt.slice(0, 255),
            photo?.credit ?? null,
            sourceRef(file),
            image.checksum,
          ],
        )
        mediaIds.set(file, result.insertId)
      }

      for (const [index, photo] of photos.entries()) {
        await connection.query(
          `INSERT IGNORE INTO establishment_images (establishment_id, media_id, role, sort_order)
           VALUES (?, ?, ?, ?)`,
          [establishment.id, mediaIds.get(photo.file), photo.role, (index + 1) * 10],
        )
      }

      // Platos: si la ficha ya tiene tarjetas se les pone foto por título;
      // si no tiene ninguna se crean las del diseño.
      if (entry.features?.length) {
        const [existing] = await connection.query(
          'SELECT id, title FROM establishment_features WHERE establishment_id = ?',
          [establishment.id],
        )
        if (existing.length === 0) {
          for (const [index, feature] of entry.features.entries()) {
            await connection.query(
              `INSERT INTO establishment_features
                 (establishment_id, title, description, media_id, sort_order)
               VALUES (?, ?, ?, ?, ?)`,
              [
                establishment.id,
                feature.title,
                feature.description ?? null,
                mediaIds.get(feature.photo),
                (index + 1) * 10,
              ],
            )
          }
        } else {
          for (const feature of entry.features) {
            const match = existing.find((row) => normalize(row.title) === normalize(feature.title))
            if (!match) continue
            await connection.query(
              'UPDATE establishment_features SET media_id = ? WHERE id = ? AND media_id IS NULL',
              [mediaIds.get(feature.photo), match.id],
            )
          }
        }
      }

      // Productos: igual que los platos, emparejados por nombre.
      if (entry.products?.length) {
        const [existing] = await connection.query(
          'SELECT id, name FROM establishment_products WHERE establishment_id = ?',
          [establishment.id],
        )
        if (existing.length === 0) {
          for (const [index, product] of entry.products.entries()) {
            await connection.query(
              `INSERT INTO establishment_products
                 (establishment_id, name, media_id, sort_order, is_active)
               VALUES (?, ?, ?, ?, 1)`,
              [establishment.id, product.name, mediaIds.get(product.photo), (index + 1) * 10],
            )
          }
        } else {
          for (const product of entry.products) {
            const match = existing.find((row) => normalize(row.name) === normalize(product.name))
            if (!match) continue
            await connection.query(
              'UPDATE establishment_products SET media_id = ? WHERE id = ? AND media_id IS NULL',
              [mediaIds.get(product.photo), match.id],
            )
          }
        }
      }

      await connection.query(
        `INSERT INTO audit_log (admin_user_id, action, entity_type, entity_id, changes)
         VALUES (NULL, 'import_media', 'establishment', ?, ?)`,
        [establishment.id, JSON.stringify({ files: [...stored.keys()] })],
      )
    })
  } catch (error) {
    // Sin registro en MySQL los archivos quedarían huérfanos.
    await Promise.all([...stored.values()].map((image) => removeImageFiles(image.storagePath)))
    throw error
  }

  return stored.size
}

async function main() {
  const manifest = await loadManifest()
  await ensureDir(mediaRoot())

  const establishments = await query(
    `SELECT e.id, e.slug, e.name,
            (SELECT COUNT(*) FROM establishment_images i WHERE i.establishment_id = e.id) AS images
     FROM establishments e
     WHERE e.deleted_at IS NULL`,
  )
  const bySlug = new Map(establishments.map((row) => [row.slug, row]))
  const imported = new Set(
    (await query(`SELECT source_ref FROM media WHERE source = 'drive' AND source_ref LIKE 'seed:%'`))
      .map((row) => row.source_ref),
  )

  console.log(`Medios en ${mediaRoot()}${dryRun ? ' (simulación)' : ''}`)
  let files = 0
  let done = 0
  for (const [slug, entry] of Object.entries(manifest)) {
    const establishment = bySlug.get(slug)
    if (!establishment) {
      console.log(`- ${slug}: no existe en la base, se omite`)
      continue
    }
    if (Number(establishment.images) > 0) {
      console.log(`= ${slug}: ya tiene fotos`)
      continue
    }
    if (entry.cover && imported.has(sourceRef(entry.cover))) {
      // Importada antes y luego vaciada desde el panel: se respeta.
      console.log(`= ${slug}: ya se importó antes`)
      continue
    }
    if (dryRun) {
      console.log(`+ ${slug}: ${photosFor(establishment.name, entry).length} fotos`)
      continue
    }
    const count = await importEstablishment(establishment, entry)
    files += count
    done += 1
    console.log(`+ ${slug}: ${count} fotos`)
  }
  console.log(`Fichas importadas: ${done} · fotos: ${files}`)
}

main()
  .catch((error) => {
    console.error(error.message ?? error)
    process.exitCode = 1
  })
  .finally(() => closePool())
