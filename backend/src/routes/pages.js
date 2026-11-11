// Páginas editables (/admin/paginas): Inicio, Qué hacer y las de Dónde ir.
//
// Cada página guarda un JSON en site_settings («page:<clave>»). El panel lo
// escribe tal cual; al servirlo al público se limpia: las fotos de /media que
// ya no existen se quitan (el sitio vuelve a la del diseño) y cada enlace a una
// ficha se resuelve a su ruta y dice si sigue publicada, para que una
// experiencia o un establecimiento despublicado no deje tarjetas rotas.
import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../auth.js'
import { config } from '../config.js'
import { query, queryOne, withTransaction } from '../db.js'
import { ApiError, asyncHandler } from '../http.js'
import { assertQuota, ensureDir, mediaRoot, storeImage } from '../media.js'
import { parseJson, toNumber } from '../serializers.js'

const router = Router()

export const PAGE_KEYS = ['inicio', 'que-hacer', 'donde-ir', 'donde-comer', 'donde-dormir', 'donde-comprar', 'redes']
const settingKey = (page) => `page:${page}`
const MAX_JSON_BYTES = 64 * 1024
const INTERNAL_PATH = /^\/[a-z0-9\-/?=&]*$/i

function pageFrom(params) {
  const page = String(params.page ?? '')
  if (!PAGE_KEYS.includes(page)) throw new ApiError(404, 'NOT_FOUND', 'Página no encontrada')
  return page
}

// Recorre el JSON y llama a `visit` con cada objeto (y su clave en el padre).
function walk(value, visit, key = null) {
  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, visit, key))
    return
  }
  if (!value || typeof value !== 'object') return
  visit(value, key)
  for (const [childKey, child] of Object.entries(value)) walk(child, visit, childKey)
}

function collectMediaUrls(value, urls = new Set()) {
  if (typeof value === 'string') {
    if (value.startsWith(`${config.media.publicBase}/`)) urls.add(value)
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectMediaUrls(item, urls))
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectMediaUrls(item, urls))
  }
  return urls
}

function dropMissing(value, existing) {
  if (typeof value === 'string') {
    return value.startsWith(`${config.media.publicBase}/`) && !existing.has(value) ? null : value
  }
  if (Array.isArray(value)) return value.map((item) => dropMissing(item, existing))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, dropMissing(item, existing)]))
  }
  return value
}

async function publishedSlugs(table, slugs) {
  if (slugs.size === 0) return new Set()
  const rows = await query(
    `SELECT slug FROM ${table} WHERE is_published = 1 AND deleted_at IS NULL AND slug IN (?)`,
    [[...slugs]],
  )
  return new Set(rows.map((row) => row.slug))
}

// Versión pública: sin fotos borradas y con los enlaces resueltos.
async function forPublic(raw) {
  if (!raw || typeof raw !== 'object') return null

  const urls = collectMediaUrls(raw)
  const existing = urls.size
    ? new Set(
        (await query('SELECT public_url FROM media WHERE public_url IN (?)', [[...urls]])).map(
          (row) => row.public_url,
        ),
      )
    : new Set()
  const value = dropMissing(raw, existing)

  const wanted = { experience: new Set(), establishment: new Set() }
  walk(value, (object, key) => {
    if (key === 'link' && wanted[object.kind] && typeof object.slug === 'string') wanted[object.kind].add(object.slug)
  })
  const [experiences, establishments] = await Promise.all([
    publishedSlugs('experiences', wanted.experience),
    publishedSlugs('establishments', wanted.establishment),
  ])

  walk(value, (object, key) => {
    if (key !== 'link') return
    if (object.kind === 'experience') {
      object.to = `/que-hacer/${object.slug}`
      object.available = experiences.has(object.slug)
    } else if (object.kind === 'establishment') {
      object.to = `/establecimiento/${object.slug}`
      object.available = establishments.has(object.slug)
    } else {
      const path = typeof object.path === 'string' && INTERNAL_PATH.test(object.path) ? object.path : null
      object.to = path
      object.available = Boolean(path)
    }
  })
  return value
}

async function readPage(page) {
  const row = await queryOne('SELECT setting_value, updated_at FROM site_settings WHERE setting_key = ?', [
    settingKey(page),
  ])
  return row ? { value: parseJson(row.setting_value, null), updatedAt: row.updated_at } : null
}

router.get(
  '/pages/:page',
  asyncHandler(async (req, res) => {
    const page = pageFrom(req.params)
    const stored = await readPage(page)
    res.set('Cache-Control', 'no-store')
    res.json({ data: await forPublic(stored?.value ?? null) })
  }),
)

// Fotos que el panel ofrece en el selector: las galerías de cada ficha (con su
// estado de publicación) y las subidas solo para páginas. Las fichas salen en
// el mismo orden que usa el sitio cuando la página no tiene uno guardado.
async function imageSources() {
  const [experiences, experienceImages, establishments, establishmentImages, uploads] = await Promise.all([
    query(
      `SELECT x.id, x.slug, x.title, x.is_published, x.sort_order
       FROM experiences x WHERE x.deleted_at IS NULL
       ORDER BY x.is_featured DESC, x.sort_order, x.title`,
    ),
    query(
      `SELECT i.experience_id AS owner_id, i.role, m.public_url, m.alt_text
       FROM experience_images i JOIN media m ON m.id = i.media_id
       WHERE m.public_url IS NOT NULL
       ORDER BY i.experience_id, FIELD(i.role, 'cover', 'gallery'), i.sort_order, i.id`,
    ),
    query(
      `SELECT e.id, e.slug, e.name, e.is_published, c.slug AS category
       FROM establishments e JOIN establishment_categories c ON c.id = e.category_id
       WHERE e.deleted_at IS NULL
       ORDER BY c.sort_order, e.is_featured DESC, e.sort_order, e.name`,
    ),
    query(
      `SELECT i.establishment_id AS owner_id, i.role, m.public_url,
              COALESCE(i.alt_override, m.alt_text) AS alt_text
       FROM establishment_images i JOIN media m ON m.id = i.media_id
       WHERE m.public_url IS NOT NULL
       ORDER BY i.establishment_id, FIELD(i.role, 'cover', 'hero', 'logo', 'gallery'), i.sort_order, i.id`,
    ),
    query(
      `SELECT m.id, m.public_url, m.alt_text
       FROM page_images p JOIN media m ON m.id = p.media_id
       ORDER BY p.created_at DESC`,
    ),
  ])

  const group = (rows) => {
    const map = new Map()
    for (const row of rows) {
      const list = map.get(Number(row.owner_id)) ?? []
      if (!list.some((image) => image.url === row.public_url)) {
        list.push({ url: row.public_url, alt: row.alt_text ?? '', role: row.role })
      }
      map.set(Number(row.owner_id), list)
    }
    return map
  }
  const byExperience = group(experienceImages)
  const byEstablishment = group(establishmentImages)

  return {
    experiences: experiences.map((row) => ({
      id: toNumber(row.id),
      slug: row.slug,
      title: row.title,
      published: Boolean(row.is_published),
      sortOrder: toNumber(row.sort_order) ?? 0,
      images: byExperience.get(Number(row.id)) ?? [],
    })),
    establishments: establishments.map((row) => ({
      id: toNumber(row.id),
      slug: row.slug,
      name: row.name,
      category: row.category,
      published: Boolean(row.is_published),
      images: byEstablishment.get(Number(row.id)) ?? [],
    })),
    uploads: uploads.map((row) => ({ id: toNumber(row.id), url: row.public_url, alt: row.alt_text ?? '' })),
  }
}

router.get(
  '/admin/pages',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const rows = await query(
      `SELECT setting_key, setting_value, updated_at FROM site_settings WHERE setting_key IN (?)`,
      [PAGE_KEYS.map(settingKey)],
    )
    const pages = Object.fromEntries(PAGE_KEYS.map((page) => [page, null]))
    for (const row of rows) {
      pages[row.setting_key.slice('page:'.length)] = {
        value: parseJson(row.setting_value, null),
        updatedAt: row.updated_at,
      }
    }
    res.json({ data: { pages, sources: await imageSources() } })
  }),
)

router.put(
  '/admin/pages/:page',
  requireAuth,
  asyncHandler(async (req, res) => {
    const page = pageFrom(req.params)
    const value = req.body?.value
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new ApiError(400, 'VALIDATION', 'El contenido de la página no es válido')
    }
    const json = JSON.stringify(value)
    if (Buffer.byteLength(json) > MAX_JSON_BYTES) {
      throw new ApiError(400, 'VALIDATION', 'El contenido de la página es demasiado grande')
    }

    await withTransaction(async (connection) => {
      await connection.query(
        `INSERT INTO site_settings (setting_key, setting_value, description)
         VALUES (?, CAST(? AS JSON), ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [settingKey(page), json, `Contenido editable de la página ${page}`],
      )
      await connection.query(
        `INSERT INTO audit_log (admin_user_id, action, entity_type, entity_id, changes, ip_address)
         VALUES (?, 'update', 'page', NULL, ?, ?)`,
        [req.admin?.id ?? null, JSON.stringify({ page }), (req.ip ?? '').slice(0, 45) || null],
      )
    })

    res.json({ data: await readPage(page) })
  }),
)

// Restablece el diseño original de una página (borra lo guardado).
router.delete(
  '/admin/pages/:page',
  requireAuth,
  asyncHandler(async (req, res) => {
    const page = pageFrom(req.params)
    await query('DELETE FROM site_settings WHERE setting_key = ?', [settingKey(page)])
    res.status(204).end()
  }),
)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.media.maxUploadMb * 1024 * 1024, files: 1 },
})

router.post(
  '/admin/pages/media',
  requireAuth,
  (req, res, next) =>
    upload.single('file')(req, res, (error) =>
      next(error ? new ApiError(400, 'UPLOAD_ERROR', 'No se pudo recibir la imagen (¿supera el tamaño máximo?)') : undefined),
    ),
  asyncHandler(async (req, res) => {
    if (!req.file?.buffer) throw new ApiError(400, 'VALIDATION', 'Falta el archivo de la imagen')
    await assertQuota(req.file.size)
    await ensureDir(mediaRoot())
    const stored = await storeImage(req.file.buffer, { folder: 'pages', role: 'gallery' })
    const alt = typeof req.body?.altText === 'string' ? req.body.altText.trim().slice(0, 255) || null : null

    const mediaId = await withTransaction(async (connection) => {
      const [result] = await connection.query(
        `INSERT INTO media (storage_disk, storage_path, public_url, mime_type, width_px, height_px,
                            alt_text, source, checksum_sha256)
         VALUES ('local', ?, ?, ?, ?, ?, ?, 'upload', ?)`,
        [stored.storagePath, stored.publicUrl, stored.mimeType, stored.width, stored.height, alt, stored.checksum],
      )
      await connection.query('INSERT INTO page_images (media_id) VALUES (?)', [result.insertId])
      return result.insertId
    })

    res.status(201).json({ data: { id: toNumber(mediaId), url: stored.publicUrl, alt: alt ?? '' } })
  }),
)

export default router
