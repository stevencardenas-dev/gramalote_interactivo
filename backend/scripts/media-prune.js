// Limpieza de imágenes huérfanas. Por defecto solo informa (dry-run).
// Uso:
//   npm run media:prune            # informe
//   node scripts/media-prune.js --apply
import { readdir, stat, unlink } from 'node:fs/promises'
import path from 'node:path'
import { closePool, query } from '../src/db.js'
import { mediaRoot, removeImageFiles } from '../src/media.js'

const apply = process.argv.includes('--apply')

async function walk(dir, files = []) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return files
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) await walk(full, files)
    else if (entry.isFile()) files.push(full)
  }
  return files
}

async function main() {
  const referenced = await query(`
    SELECT media_id FROM establishment_images
    UNION SELECT media_id FROM establishment_products WHERE media_id IS NOT NULL
    UNION SELECT media_id FROM experience_images
    UNION SELECT media_id FROM curiosity_block_media
    UNION SELECT media_id FROM history_images
  `)
  const referencedIds = new Set(referenced.map((row) => Number(row.media_id)))

  const media = await query('SELECT id, storage_path FROM media ORDER BY id')
  const orphans = media.filter((row) => !referencedIds.has(Number(row.id)))

  const knownPrefixes = new Set(
    media.map((row) => path.basename(row.storage_path).slice(0, 36)),
  )
  const files = await walk(mediaRoot())
  const unknown = []
  for (const file of files) {
    if (!file.endsWith('.webp')) continue
    if (file.includes(`${path.sep}tmp${path.sep}`)) {
      unknown.push(file)
      continue
    }
    if (!knownPrefixes.has(path.basename(file).slice(0, 36))) unknown.push(file)
  }

  console.log(`Modo: ${apply ? 'APLICAR' : 'simulación (usa --apply para borrar)'}`)
  console.log(`Registros de media: ${media.length} · referenciados: ${referencedIds.size}`)
  console.log(`Media sin usar: ${orphans.length}`)
  console.log(`Archivos sin registro: ${unknown.length}`)

  let bytes = 0
  for (const file of unknown) {
    try {
      bytes += (await stat(file)).size
    } catch {
      // Archivo desaparecido entre el listado y la medición.
    }
  }
  console.log(`Espacio recuperable aproximado: ${(bytes / 1024 / 1024).toFixed(1)} MB`)

  if (!apply) return

  for (const row of orphans) {
    await removeImageFiles(row.storage_path)
    await query('DELETE FROM media WHERE id = ?', [row.id])
  }
  for (const file of unknown) {
    await unlink(file).catch(() => {})
  }
  console.log('Limpieza aplicada.')
}

main()
  .catch((error) => {
    console.error(`Error: ${error.message}`)
    process.exitCode = 1
  })
  .finally(() => closePool())
