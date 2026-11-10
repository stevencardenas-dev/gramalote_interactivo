// Panel: experiencias de «Qué hacer» (/admin/experiencias).
import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../auth.js'
import { config } from '../config.js'
import { withTransaction, query, queryOne } from '../db.js'
import { ApiError, asyncHandler } from '../http.js'
import { MAP_ICONS } from '../map-icons.js'
import { assertQuota, ensureDir, mediaRoot, removeImageFiles, storeImage } from '../media.js'
import { toNumber } from '../serializers.js'

const router = Router()

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160)
}

function text(value, field, { max = 500, required = false } = {}) {
  if (value === null || value === undefined || value === '') {
    if (required) throw new ApiError(400, 'VALIDATION', `${field} es obligatorio`)
    return null
  }
  if (typeof value !== 'string') throw new ApiError(400, 'VALIDATION', `${field} debe ser texto`)
  const trimmed = value.trim()
  if (required && !trimmed) throw new ApiError(400, 'VALIDATION', `${field} es obligatorio`)
  return trimmed ? trimmed.slice(0, max) : null
}

function coordinate(value, field, limit) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || Math.abs(parsed) > limit) {
    throw new ApiError(400, 'VALIDATION', `${field} no es válida`)
  }
  return parsed
}

function id(value) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) throw new ApiError(400, 'VALIDATION', 'id no válido')
  return parsed
}

function onlyAdmin(req, _res, next) {
  if (req.admin?.role !== 'admin') {
    next(new ApiError(403, 'FORBIDDEN', 'Tu cuenta no tiene permiso para esta acción'))
    return
  }
  next()
}

async function audit(connection, req, action, entityId, changes) {
  await connection.query(
    `INSERT INTO audit_log (admin_user_id, action, entity_type, entity_id, changes, ip_address)
     VALUES (?, ?, 'experience', ?, ?, ?)`,
    [
      req.admin?.id ?? null,
      action,
      entityId,
      changes ? JSON.stringify(changes) : null,
      (req.ip ?? '').slice(0, 45) || null,
    ],
  )
}

async function loadExperience(experienceId) {
  const row = await queryOne(
    `SELECT x.*, c.slug AS category_slug
     FROM experiences x
     LEFT JOIN experience_categories c ON c.id = x.category_id
     WHERE x.id = ? AND x.deleted_at IS NULL`,
    [experienceId],
  )
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'Experiencia no encontrada')

  const [tips, images] = await Promise.all([
    query(
      'SELECT id, icon, title, description FROM experience_tips WHERE experience_id = ? ORDER BY sort_order, id',
      [experienceId],
    ),
    query(
      `SELECT i.id AS image_id, i.role, i.sort_order, m.id AS media_id, m.public_url, m.alt_text
       FROM experience_images i JOIN media m ON m.id = i.media_id
       WHERE i.experience_id = ?
       ORDER BY FIELD(i.role, 'cover', 'gallery'), i.sort_order, i.id`,
      [experienceId],
    ),
  ])

  return {
    id: toNumber(row.id),
    slug: row.slug,
    title: row.title,
    category: row.category_slug ?? '',
    summary: row.summary ?? '',
    cardText: row.card_text ?? '',
    meta: row.meta_text ?? '',
    description: row.description ?? '',
    hours: row.hours_text ?? '',
    address: row.address ?? '',
    access: row.access_text ?? '',
    difficulty: row.difficulty_text ?? '',
    price: row.price_text ?? '',
    phone: row.phone ?? '',
    latitude: row.latitude === null ? '' : String(Number(row.latitude)),
    longitude: row.longitude === null ? '' : String(Number(row.longitude)),
    mapsUrl: row.maps_url ?? '',
    mapIcon: row.map_icon ?? '',
    openDaily: Boolean(row.open_daily),
    published: Boolean(row.is_published),
    sortOrder: Number(row.sort_order),
    tips: tips.map((tip) => ({
      icon: tip.icon ?? 'info',
      title: tip.title,
      text: tip.description ?? '',
    })),
    images: images.map((image) => ({
      imageId: toNumber(image.image_id),
      mediaId: toNumber(image.media_id),
      role: image.role,
      url: image.public_url,
      alt: image.alt_text ?? '',
    })),
  }
}

router.get(
  '/admin/experiences/meta',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const categories = await query(
      'SELECT slug, name FROM experience_categories ORDER BY sort_order, name',
    )
    res.json({ data: { categories, mapIcons: MAP_ICONS } })
  }),
)

router.get(
  '/admin/experiences',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const rows = await query(
      `SELECT x.id, x.slug, x.title, x.is_published, x.latitude, x.sort_order,
              c.name AS category_name,
              (SELECT m.public_url FROM experience_images i JOIN media m ON m.id = i.media_id
                WHERE i.experience_id = x.id ORDER BY FIELD(i.role, 'cover', 'gallery'), i.sort_order LIMIT 1) AS cover_url
       FROM experiences x
       LEFT JOIN experience_categories c ON c.id = x.category_id
       WHERE x.deleted_at IS NULL
       ORDER BY x.sort_order, x.title`,
    )
    res.json({
      data: rows.map((row) => ({
        id: toNumber(row.id),
        slug: row.slug,
        title: row.title,
        category: row.category_name ?? null,
        published: Boolean(row.is_published),
        onMap: row.latitude !== null,
        cover: row.cover_url ?? null,
      })),
    })
  }),
)

router.get(
  '/admin/experiences/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ data: await loadExperience(id(req.params.id)) })
  }),
)

async function categoryId(connection, slug) {
  if (!slug) return null
  const [rows] = await connection.query('SELECT id FROM experience_categories WHERE slug = ?', [slug])
  if (!rows[0]) throw new ApiError(400, 'VALIDATION', 'La categoría no existe')
  return rows[0].id
}

function fieldsFrom(body) {
  const icon = text(body.mapIcon, 'Icono del mapa', { max: 40 })
  if (icon && !MAP_ICONS.includes(icon)) throw new ApiError(400, 'VALIDATION', 'El icono del mapa no existe')
  const mapsUrl = text(body.mapsUrl, 'Enlace de Google Maps', { max: 500 })
  if (mapsUrl && !/^https?:\/\//i.test(mapsUrl)) {
    throw new ApiError(400, 'VALIDATION', 'El enlace de Google Maps debe empezar con http:// o https://')
  }
  const latitude = coordinate(body.latitude, 'La latitud', 90)
  const longitude = coordinate(body.longitude, 'La longitud', 180)
  if ((latitude === null) !== (longitude === null)) {
    throw new ApiError(400, 'VALIDATION', 'Escribe latitud y longitud, o deja ambas vacías')
  }
  const title = text(body.title, 'Título', { max: 180, required: true })
  return {
    title,
    slug: slugify(text(body.slug, 'Slug', { max: 160 }) ?? title),
    summary: text(body.summary, 'Resumen', { max: 320 }) ?? '',
    card_text: text(body.cardText, 'Texto de la tarjeta', { max: 600 }),
    meta_text: text(body.meta, 'Datos de la tarjeta', { max: 255 }),
    description: text(body.description, 'Descripción', { max: 20000 }) ?? '',
    hours_text: text(body.hours, 'Horario', { max: 255 }),
    address: text(body.address, 'Ubicación', { max: 255 }),
    access_text: text(body.access, 'Cómo llegar', { max: 255 }),
    difficulty_text: text(body.difficulty, 'Dificultad', { max: 80 }),
    price_text: text(body.price, 'Tarifa', { max: 120 }),
    phone: text(body.phone, 'Teléfono', { max: 40 }),
    latitude,
    longitude,
    maps_url: mapsUrl,
    map_icon: icon,
    open_daily: body.openDaily ? 1 : 0,
    is_published: body.published === false ? 0 : 1,
    sort_order: Number.parseInt(body.sortOrder, 10) || 0,
  }
}

async function saveTips(connection, experienceId, tips) {
  if (!Array.isArray(tips)) return
  await connection.query('DELETE FROM experience_tips WHERE experience_id = ?', [experienceId])
  let order = 0
  for (const tip of tips.slice(0, 12)) {
    const title = text(tip?.title, 'Título del consejo', { max: 160 })
    if (!title) continue
    order += 1
    await connection.query(
      'INSERT INTO experience_tips (experience_id, icon, title, description, sort_order) VALUES (?, ?, ?, ?, ?)',
      [experienceId, text(tip.icon, 'Icono', { max: 40 }) ?? 'info', title, text(tip.text, 'Consejo', { max: 800 }), order],
    )
  }
}

function duplicateSlug(error) {
  if (error?.code === 'ER_DUP_ENTRY') throw new ApiError(409, 'SLUG_TAKEN', 'Ya existe una experiencia con ese slug')
  throw error
}

router.post(
  '/admin/experiences',
  requireAuth,
  asyncHandler(async (req, res) => {
    const fields = fieldsFrom(req.body ?? {})
    const newId = await withTransaction(async (connection) => {
      fields.category_id = await categoryId(connection, req.body.category)
      const columns = Object.keys(fields)
      const [result] = await connection
        .query(
          `INSERT INTO experiences (${columns.join(', ')}, published_at)
           VALUES (${columns.map(() => '?').join(', ')}, NOW())`,
          Object.values(fields),
        )
        .catch(duplicateSlug)
      await saveTips(connection, result.insertId, req.body.tips)
      await audit(connection, req, 'create', result.insertId, { title: fields.title })
      return result.insertId
    })
    res.status(201).json({ data: await loadExperience(newId) })
  }),
)

router.put(
  '/admin/experiences/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const experienceId = id(req.params.id)
    await loadExperience(experienceId)
    const fields = fieldsFrom(req.body ?? {})
    await withTransaction(async (connection) => {
      fields.category_id = await categoryId(connection, req.body.category)
      await connection
        .query(
          `UPDATE experiences SET ${Object.keys(fields).map((key) => `${key} = ?`).join(', ')} WHERE id = ?`,
          [...Object.values(fields), experienceId],
        )
        .catch(duplicateSlug)
      await saveTips(connection, experienceId, req.body.tips)
      await audit(connection, req, 'update', experienceId, { title: fields.title })
    })
    res.json({ data: await loadExperience(experienceId) })
  }),
)

router.delete(
  '/admin/experiences/:id',
  requireAuth,
  onlyAdmin,
  asyncHandler(async (req, res) => {
    const experienceId = id(req.params.id)
    await withTransaction(async (connection) => {
      await connection.query(
        `UPDATE experiences SET deleted_at = NOW(), slug = CONCAT(slug, '-borrada-', id) WHERE id = ? AND deleted_at IS NULL`,
        [experienceId],
      )
      await audit(connection, req, 'delete', experienceId, null)
    })
    res.status(204).end()
  }),
)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.media.maxUploadMb * 1024 * 1024, files: 1 },
})

router.post(
  '/admin/experiences/:id/images',
  requireAuth,
  (req, res, next) =>
    upload.single('file')(req, res, (error) =>
      next(error ? new ApiError(400, 'UPLOAD_ERROR', 'No se pudo recibir la imagen (¿supera el tamaño máximo?)') : undefined),
    ),
  asyncHandler(async (req, res) => {
    const experienceId = id(req.params.id)
    await loadExperience(experienceId)
    if (!req.file?.buffer) throw new ApiError(400, 'VALIDATION', 'Falta el archivo de la imagen')
    const role = req.body.role === 'cover' ? 'cover' : 'gallery'

    await assertQuota(req.file.size)
    await ensureDir(mediaRoot())
    const stored = await storeImage(req.file.buffer, { folder: `experiences/${experienceId}`, role })

    await withTransaction(async (connection) => {
      const [result] = await connection.query(
        `INSERT INTO media (storage_disk, storage_path, public_url, mime_type, width_px, height_px,
                            alt_text, source, checksum_sha256)
         VALUES ('local', ?, ?, ?, ?, ?, ?, 'upload', ?)`,
        [
          stored.storagePath,
          stored.publicUrl,
          stored.mimeType,
          stored.width,
          stored.height,
          text(req.body.altText, 'Texto alternativo', { max: 255 }),
          stored.checksum,
        ],
      )
      if (role === 'cover') {
        await connection.query(
          `UPDATE experience_images SET role = 'gallery' WHERE experience_id = ? AND role = 'cover'`,
          [experienceId],
        )
      }
      const [sortRows] = await connection.query(
        'SELECT COALESCE(MAX(sort_order), 0) AS m FROM experience_images WHERE experience_id = ?',
        [experienceId],
      )
      await connection.query(
        'INSERT INTO experience_images (experience_id, media_id, role, sort_order) VALUES (?, ?, ?, ?)',
        [experienceId, result.insertId, role, Number(sortRows[0].m) + 1],
      )
      await audit(connection, req, 'upload_media', experienceId, { mediaId: result.insertId, role })
    })

    res.status(201).json({ data: await loadExperience(experienceId) })
  }),
)

router.patch(
  '/admin/experiences/:id/images/:imageId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const experienceId = id(req.params.id)
    const imageId = id(req.params.imageId)
    const image = await queryOne(
      'SELECT media_id FROM experience_images WHERE id = ? AND experience_id = ?',
      [imageId, experienceId],
    )
    if (!image) throw new ApiError(404, 'NOT_FOUND', 'Imagen no encontrada')

    await withTransaction(async (connection) => {
      if (req.body?.role === 'cover') {
        await connection.query(
          `UPDATE experience_images SET role = 'gallery' WHERE experience_id = ? AND role = 'cover'`,
          [experienceId],
        )
        await connection.query(`UPDATE experience_images SET role = 'cover' WHERE id = ?`, [imageId])
      }
      if (req.body && 'altText' in req.body) {
        await connection.query('UPDATE media SET alt_text = ? WHERE id = ?', [
          text(req.body.altText, 'Texto alternativo', { max: 255 }),
          image.media_id,
        ])
      }
    })
    res.json({ data: await loadExperience(experienceId) })
  }),
)

router.delete(
  '/admin/experiences/:id/images/:imageId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const experienceId = id(req.params.id)
    const imageId = id(req.params.imageId)
    const image = await queryOne(
      `SELECT i.media_id, m.storage_disk, m.storage_path
       FROM experience_images i JOIN media m ON m.id = i.media_id
       WHERE i.id = ? AND i.experience_id = ?`,
      [imageId, experienceId],
    )
    if (!image) throw new ApiError(404, 'NOT_FOUND', 'Imagen no encontrada')

    await query('DELETE FROM experience_images WHERE id = ?', [imageId])
    // Las fotos subidas solo se borran del disco si nadie más las usa.
    if (image.storage_disk === 'local') {
      const usage = await queryOne(
        `SELECT (SELECT COUNT(*) FROM experience_images WHERE media_id = ?) +
                (SELECT COUNT(*) FROM establishment_images WHERE media_id = ?) AS total`,
        [image.media_id, image.media_id],
      )
      if (Number(usage?.total ?? 0) === 0) {
        await query('DELETE FROM media WHERE id = ?', [image.media_id])
        await removeImageFiles(image.storage_path)
      }
    }
    res.json({ data: await loadExperience(experienceId) })
  }),
)

export default router
