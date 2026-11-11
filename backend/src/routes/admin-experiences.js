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

const SCHEDULE_MODES = ['always', 'days', 'days-close', 'multi', 'per-day']
const DAY_KEYS = ['1', '2', '3', '4', '5', '6', '7']
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

function scheduleTime(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string' || !TIME_PATTERN.test(value)) {
    throw new ApiError(400, 'VALIDATION', 'Las horas del horario deben ir en formato HH:MM')
  }
  return value
}

// El panel manda siempre el mismo valor canónico (modo + mapa de días con sus
// turnos): un día ausente está cerrado y una lista vacía significa «abre sin
// hora fija». Se guarda tal cual y `open_daily` se deriva de ahí.
function scheduleFrom(value) {
  if (!value || typeof value !== 'object') return null
  const mode = SCHEDULE_MODES.includes(value.mode) ? value.mode : 'always'
  const source = value.days && typeof value.days === 'object' ? value.days : {}
  const days = {}
  for (const day of DAY_KEYS) {
    if (!Array.isArray(source[day])) continue
    days[day] = source[day]
      .slice(0, 3)
      .map((range) => ({
        opensAt: scheduleTime(range?.opensAt),
        closesAt: scheduleTime(range?.closesAt),
      }))
      .filter((range) => range.opensAt || range.closesAt)
  }
  return { mode, days }
}

function parseSchedule(raw) {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
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

  const [tips, images, auditEntries] = await Promise.all([
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
    // Historial de la ficha (pestaña propia en el panel).
    query(
      `SELECT a.id, a.action, a.created_at, u.name AS user_name
       FROM audit_log a LEFT JOIN admin_users u ON u.id = a.admin_user_id
       WHERE a.entity_type = 'experience' AND a.entity_id = ?
       ORDER BY a.id DESC LIMIT 50`,
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
    schedule: parseSchedule(row.schedule_json),
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
    audit: auditEntries.map((entry) => ({
      id: toNumber(entry.id),
      action: entry.action,
      userName: entry.user_name ?? null,
      createdAt: entry.created_at,
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
      `SELECT x.id, x.slug, x.title, x.is_published, x.latitude, x.sort_order, x.updated_at,
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
        updatedAt: row.updated_at,
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
  if (!slug) throw new ApiError(400, 'VALIDATION', 'La categoría es obligatoria')
  const [rows] = await connection.query('SELECT id FROM experience_categories WHERE slug = ?', [slug])
  if (!rows[0]) throw new ApiError(400, 'VALIDATION', 'La categoría no existe')
  return rows[0].id
}

function fieldsFrom(body) {
  const schedule = scheduleFrom(body.schedule)
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
    summary: text(body.summary, 'Resumen', { max: 320, required: true }),
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
    schedule_json: schedule ? JSON.stringify(schedule) : null,
    // Con horario manda el horario: abre todos los días si están los siete.
    // Sin horario (fichas viejas) se respeta la casilla de siempre.
    open_daily: schedule
      ? DAY_KEYS.every((day) => day in schedule.days)
        ? 1
        : 0
      : body.openDaily
        ? 1
        : 0,
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

// Publicar exige una portada con texto alternativo, igual que en las fichas de
// establecimientos: sin ella el listado y el mapa salen con el hueco de imagen.
async function assertCoverText(experienceId) {
  const cover = await queryOne(
    `SELECT i.id FROM experience_images i JOIN media m ON m.id = i.media_id
     WHERE i.experience_id = ? AND i.role = 'cover'
       AND COALESCE(NULLIF(i.alt_override, ''), NULLIF(m.alt_text, '')) IS NOT NULL
     LIMIT 1`,
    [experienceId],
  )
  if (!cover) {
    throw new ApiError(
      409,
      'MISSING_COVER',
      'Para publicar, la experiencia necesita una portada con texto alternativo',
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
    // Una experiencia nueva nace siempre sin publicar: para verla en el sitio
    // hay que darle portada con texto alternativo y publicarla desde el editor.
    fields.is_published = 0
    fields.published_at = null
    const newId = await withTransaction(async (connection) => {
      fields.category_id = await categoryId(connection, req.body.category)
      const columns = Object.keys(fields)
      const [result] = await connection
        .query(
          `INSERT INTO experiences (${columns.join(', ')})
           VALUES (${columns.map(() => '?').join(', ')})`,
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
    const current = await loadExperience(experienceId)
    const fields = fieldsFrom(req.body ?? {})
    // Solo se comprueba al pasar de borrador a publicada: una ficha que ya
    // estaba publicada se puede seguir guardando sin portada.
    if (!current.published && fields.is_published) {
      await assertCoverText(experienceId)
    }
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

    // Primero la base y después el disco: si algo falla en medio, nunca queda un
    // archivo borrado que la ficha siga mostrando.
    const storagePath = await withTransaction(async (connection) => {
      await connection.query('DELETE FROM experience_images WHERE id = ?', [imageId])

      const [usageRows] = await connection.query(
        `SELECT (SELECT COUNT(*) FROM experience_images WHERE media_id = ?) +
                (SELECT COUNT(*) FROM establishment_images WHERE media_id = ?) AS total`,
        [image.media_id, image.media_id],
      )
      // Si otra ficha la sigue usando, se quita solo de esta.
      if (Number(usageRows[0]?.total ?? 0) > 0) return null

      try {
        await connection.query('DELETE FROM media WHERE id = ?', [image.media_id])
      } catch (error) {
        // La referencia la protege otra tabla: se conserva el registro y el archivo.
        if (error?.code === 'ER_ROW_IS_REFERENCED_2') return null
        throw error
      }

      // Las fotos del diseño viven dentro de la imagen del frontend, no en
      // /opt/gramalote/media: ahí solo se borra el registro.
      return image.storage_disk === 'local' ? image.storage_path : null
    })

    if (storagePath) await removeImageFiles(storagePath)

    res.json({ data: await loadExperience(experienceId) })
  }),
)

export default router
