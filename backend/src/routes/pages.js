// Páginas editables (/admin/paginas): Inicio, Qué hacer, las de Dónde ir, las
// redes sociales y el carrusel de eventos de Inicio.
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
import { assertFresh } from '../concurrency.js'
import { query, queryOne, withTransaction } from '../db.js'
import { ApiError, asyncHandler, stringParam } from '../http.js'
import { assertQuota, ensureDir, mediaRoot, storeImage } from '../media.js'
import { parseJson, toNumber } from '../serializers.js'

const router = Router()

export const PAGE_KEYS = ['inicio', 'que-hacer', 'donde-ir', 'donde-comer', 'donde-dormir', 'donde-comprar', 'redes', 'carrusel', 'buscador']
const settingKey = (page) => `page:${page}`
const MAX_JSON_BYTES = 64 * 1024
const PHOTOS_PER_PAGE = 24
const INTERNAL_PATH = /^\/[a-z0-9\-/?=&]*$/i
const WEB_URL = /^https?:\/\/[^\s"'<>]+\.[^\s"'<>]+$/i

// Enlace de WhatsApp a partir de un número (10 dígitos = Colombia, se antepone 57).
function whatsappUrl(phone, message) {
  let digits = String(phone ?? '').replace(/\D/g, '')
  if (digits.length === 10) digits = `57${digits}`
  if (digits.length < 11 || digits.length > 15) return null
  const text = typeof message === 'string' ? message.trim().slice(0, 300) : ''
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

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
    } else if (object.kind === 'url') {
      const url = typeof object.url === 'string' && WEB_URL.test(object.url.trim()) ? object.url.trim() : null
      object.to = url
      object.external = true
      object.available = Boolean(url)
    } else if (object.kind === 'whatsapp') {
      const url = whatsappUrl(object.phone, object.message)
      object.to = url
      object.external = true
      object.available = Boolean(url)
    } else if (object.kind === 'none') {
      object.to = null
      object.available = false
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

// Fichas que el panel ofrece en el selector de fotos: solo sus datos y la
// portada, sin la galería completa (que se pide aparte y paginada, porque
// cargarla entera era lo que hacía lento el selector). Las fichas salen en el
// mismo orden que usa el sitio cuando la página no tiene uno guardado.
async function imageSources() {
  const [experiences, establishments, uploads] = await Promise.all([
    query(
      `SELECT x.id, x.slug, x.title, x.is_published, x.sort_order,
              (SELECT m.public_url
               FROM experience_images i JOIN media m ON m.id = i.media_id
               WHERE i.experience_id = x.id AND m.public_url IS NOT NULL
               ORDER BY FIELD(i.role, 'cover', 'gallery'), i.sort_order, i.id LIMIT 1) AS cover_url,
              (SELECT COUNT(*)
               FROM experience_images i JOIN media m ON m.id = i.media_id
               WHERE i.experience_id = x.id AND m.public_url IS NOT NULL) AS image_count
       FROM experiences x WHERE x.deleted_at IS NULL
       ORDER BY x.is_featured DESC, x.sort_order, x.title`,
    ),
    query(
      `SELECT e.id, e.slug, e.name, e.is_published, c.slug AS category,
              (SELECT m.public_url
               FROM establishment_images i JOIN media m ON m.id = i.media_id
               WHERE i.establishment_id = e.id AND m.public_url IS NOT NULL
               ORDER BY FIELD(i.role, 'cover', 'hero', 'logo', 'gallery'), i.sort_order, i.id LIMIT 1) AS cover_url,
              (SELECT COUNT(*)
               FROM establishment_images i JOIN media m ON m.id = i.media_id
               WHERE i.establishment_id = e.id AND m.public_url IS NOT NULL) AS image_count
       FROM establishments e JOIN establishment_categories c ON c.id = e.category_id
       WHERE e.deleted_at IS NULL
       ORDER BY c.sort_order, e.is_featured DESC, e.sort_order, e.name`,
    ),
    queryOne(
      `SELECT COUNT(*) AS total FROM page_images p JOIN media m ON m.id = p.media_id
       WHERE m.public_url IS NOT NULL`,
    ),
  ])

  return {
    experiences: experiences.map((row) => ({
      id: toNumber(row.id),
      slug: row.slug,
      title: row.title,
      published: Boolean(row.is_published),
      sortOrder: toNumber(row.sort_order) ?? 0,
      cover: row.cover_url ?? null,
      imageCount: toNumber(row.image_count) ?? 0,
    })),
    establishments: establishments.map((row) => ({
      id: toNumber(row.id),
      slug: row.slug,
      name: row.name,
      category: row.category,
      published: Boolean(row.is_published),
      cover: row.cover_url ?? null,
      imageCount: toNumber(row.image_count) ?? 0,
    })),
    uploadCount: toNumber(uploads?.total) ?? 0,
  }
}

// Fotos de un solo lugar (o de las subidas de páginas), paginadas. Es lo que el
// selector pide al elegir el tipo y el lugar, en vez de traer todo de golpe.
router.get(
  '/admin/pages/images',
  requireAuth,
  asyncHandler(async (req, res) => {
    const kind = stringParam(req.query.kind, { max: 20 })
    const slug = stringParam(req.query.slug, { max: 160 })
    const rawPage = Number.parseInt(req.query.page ?? '', 10)
    const rawPerPage = Number.parseInt(req.query.perPage ?? '', 10)
    const perPage = Number.isFinite(rawPerPage) ? Math.min(Math.max(rawPerPage, 1), 60) : PHOTOS_PER_PAGE
    let page = Number.isFinite(rawPage) ? Math.max(rawPage, 1) : 1

    let total = 0
    let images = []

    if (kind === 'upload') {
      const countRow = await queryOne(
        `SELECT COUNT(*) AS total FROM page_images p JOIN media m ON m.id = p.media_id
         WHERE m.public_url IS NOT NULL`,
      )
      total = toNumber(countRow?.total) ?? 0
      page = Math.min(page, Math.max(1, Math.ceil(total / perPage)))
      images = await query(
        `SELECT m.public_url, m.alt_text
         FROM page_images p JOIN media m ON m.id = p.media_id
         WHERE m.public_url IS NOT NULL
         ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
        [perPage, (page - 1) * perPage],
      )
    } else if (kind === 'experience' || kind === 'establishment') {
      if (!slug) throw new ApiError(400, 'VALIDATION', 'Falta la ficha de la que pedir las fotos')
      const table = kind === 'experience' ? 'experiences' : 'establishments'
      const owner = await queryOne(`SELECT id FROM ${table} WHERE slug = ? AND deleted_at IS NULL`, [slug])
      if (!owner) throw new ApiError(404, 'NOT_FOUND', 'Ficha no encontrada')
      const id = toNumber(owner.id)
      const imageTable = kind === 'experience' ? 'experience_images' : 'establishment_images'
      const ownerColumn = kind === 'experience' ? 'experience_id' : 'establishment_id'
      const roleOrder = kind === 'experience' ? "'cover', 'gallery'" : "'cover', 'hero', 'logo', 'gallery'"
      const altColumn = kind === 'experience' ? 'm.alt_text' : 'COALESCE(i.alt_override, m.alt_text)'
      const countRow = await queryOne(
        `SELECT COUNT(DISTINCT m.public_url) AS total FROM ${imageTable} i JOIN media m ON m.id = i.media_id
         WHERE i.${ownerColumn} = ? AND m.public_url IS NOT NULL`,
        [id],
      )
      total = toNumber(countRow?.total) ?? 0
      page = Math.min(page, Math.max(1, Math.ceil(total / perPage)))
      // Una misma foto puede estar enlazada dos veces: se muestra una sola.
      images = await query(
        `SELECT m.public_url, MIN(${altColumn}) AS alt_text
         FROM ${imageTable} i JOIN media m ON m.id = i.media_id
         WHERE i.${ownerColumn} = ? AND m.public_url IS NOT NULL
         GROUP BY m.public_url
         ORDER BY MIN(FIELD(i.role, ${roleOrder})), MIN(i.sort_order), MIN(i.id)
         LIMIT ? OFFSET ?`,
        [id, perPage, (page - 1) * perPage],
      )
    } else {
      throw new ApiError(400, 'VALIDATION', 'Tipo de foto no válido')
    }

    const totalPages = Math.max(1, Math.ceil(total / perPage))
    if (page > totalPages) page = totalPages
    res.json({
      data: {
        images: images.map((row) => ({ url: row.public_url, alt: row.alt_text ?? '' })),
        total,
        page,
        perPage,
        totalPages,
      },
    })
  }),
)

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
      const [current] = await connection.query('SELECT updated_at FROM site_settings WHERE setting_key = ? FOR UPDATE', [settingKey(page)])
      assertFresh(req.body?.updatedAt, current[0]?.updated_at)
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
    // Los banners del carrusel ocupan todo el ancho: se guarda también una copia de 2560 px.
    const banner = req.query?.purpose === 'banner'
    const stored = await storeImage(req.file.buffer, {
      folder: 'pages',
      role: 'gallery',
      extraWidths: banner ? [2560] : [],
    })
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
