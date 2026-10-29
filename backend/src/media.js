// Almacenamiento de imágenes en el disco local (volumen de la EC2).
// Sin S3 ni CDN: cualquier servidor con Docker y esta carpeta sirve igual.
import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readdir, stat, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { config } from './config.js'
import { ApiError } from './http.js'

// La t3.micro tiene 913 MB: una sola imagen a la vez y sin caché de sharp.
sharp.concurrency(1)
sharp.cache(false)

const FORMATS = new Set(['jpeg', 'png', 'webp'])
export const IMAGE_ROLES = new Set(['cover', 'gallery', 'logo'])

export function mediaRoot() {
  return path.resolve(config.media.root)
}

export function publicUrlFor(storagePath) {
  const base = config.media.publicBase.replace(/\/$/, '')
  return `${base}/${storagePath.split(path.sep).join('/')}`
}

export function absolutePath(storagePath) {
  const target = path.resolve(mediaRoot(), storagePath)
  if (!target.startsWith(`${mediaRoot()}${path.sep}`)) {
    throw new ApiError(400, 'INVALID_PATH', 'Ruta de archivo inválida')
  }
  return target
}

// `folder` solo admite segmentos simples: evita rutas arbitrarias.
export function safeFolder(folder) {
  const segments = String(folder)
    .split('/')
    .filter(Boolean)
  if (segments.length === 0 || segments.some((part) => !/^[a-z0-9_-]+$/i.test(part))) {
    throw new ApiError(400, 'INVALID_FOLDER', 'Carpeta de medios inválida')
  }
  // Siempre con "/": la ruta se guarda en MySQL y debe funcionar en Linux y Windows.
  return segments.join('/')
}

export async function ensureDir(dir) {
  await mkdir(dir, { recursive: true })
}

export async function usageBytes() {
  const root = mediaRoot()
  let total = 0
  let files = 0

  async function walk(dir) {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
      } else if (entry.isFile()) {
        total += (await stat(full)).size
        files += 1
      }
    }
  }

  await walk(root)
  return { bytes: total, files }
}

export async function assertQuota(incomingBytes = 0) {
  const { bytes } = await usageBytes()
  const quota = config.media.quotaMb * 1024 * 1024
  if (quota > 0 && bytes + incomingBytes > quota * 0.95) {
    throw new ApiError(
      507,
      'MEDIA_QUOTA',
      'El disco de imágenes está lleno; borra fotos que no se usen o amplía la cuota',
    )
  }
  return { usedBytes: bytes, quotaBytes: quota }
}

// Re-codifica a WebP, corrige orientación y descarta EXIF (incluida la geolocalización).
export async function storeImage(buffer, { folder, role = 'gallery' }) {
  if (!IMAGE_ROLES.has(role)) {
    throw new ApiError(400, 'INVALID_ROLE', 'Rol de imagen inválido')
  }

  let metadata
  try {
    metadata = await sharp(buffer, { limitInputPixels: 40_000_000 }).metadata()
  } catch {
    throw new ApiError(415, 'INVALID_IMAGE', 'El archivo no es una imagen válida')
  }

  if (!FORMATS.has(metadata.format)) {
    throw new ApiError(415, 'INVALID_IMAGE', 'Solo se aceptan JPEG, PNG o WebP')
  }
  if ((metadata.width ?? 0) < 200 || (metadata.height ?? 0) < 200) {
    throw new ApiError(400, 'IMAGE_TOO_SMALL', 'La imagen debe medir al menos 200×200 px')
  }

  const uuid = randomUUID()
  const directory = path.join(mediaRoot(), safeFolder(folder))
  await ensureDir(directory)

  const targets = [...new Set(
    config.media.variants.map((width) => Math.min(width, metadata.width)),
  )].sort((a, b) => a - b)
  const largest = targets.at(-1) ?? metadata.width

  const written = []
  let main = null

  for (const width of targets) {
    const suffix = width === largest ? '' : `-${width}`
    const filename = `${uuid}-${role}${suffix}.webp`
    const storagePath = `${safeFolder(folder)}/${filename}`
    const output = await sharp(buffer)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()
    const info = await sharp(output).metadata()

    await writeFile(absolutePath(storagePath), output)
    const variant = {
      width: info.width ?? width,
      height: info.height ?? null,
      bytes: output.length,
      storagePath,
      publicUrl: publicUrlFor(storagePath),
    }
    written.push(variant)
    if (width === largest) main = { ...variant, buffer: output }
  }

  return {
    storagePath: main.storagePath,
    publicUrl: main.publicUrl,
    mimeType: 'image/webp',
    width: main.width,
    height: main.height,
    bytes: main.bytes,
    checksum: createHash('sha256').update(main.buffer).digest('hex'),
    variants: written.map(({ buffer: _buffer, ...variant }) => variant),
  }
}

// Borra la imagen principal y todas sus variantes (mismo UUID de origen).
export async function removeImageFiles(storagePath) {
  let absolute
  try {
    absolute = absolutePath(storagePath)
  } catch {
    return
  }

  const directory = path.dirname(absolute)
  const uuid = path.basename(absolute).slice(0, 36)

  let entries
  try {
    entries = await readdir(directory)
  } catch {
    return
  }

  await Promise.all(
    entries
      .filter((name) => name.startsWith(uuid))
      .map((name) => unlink(path.join(directory, name)).catch(() => {})),
  )
}
