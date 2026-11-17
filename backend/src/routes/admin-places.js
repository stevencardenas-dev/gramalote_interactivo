import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../auth.js'
import { config } from '../config.js'
import { withTransaction, query, queryOne } from '../db.js'
import { ApiError, asyncHandler, booleanParam } from '../http.js'
import { MAP_ICONS } from '../map-icons.js'
import { assertQuota, ensureDir, mediaRoot, removeImageFiles, storeImage } from '../media.js'
import { toNumber } from '../serializers.js'

// Panel › Lugares › Patrimonio y Extras: ficha editable de cada bien (datos,
// textos, visita, ubicación, fotos con su uso y su época) con historial de
// cambios, igual que las fichas de establecimientos. Una sola implementación
// para los dos tipos de lugar; lo que cambia está en KINDS.

const router = Router()

const STATUSES = ['Visitable', 'Con restricciones', 'Solo memoria']
const ZONE_KEYS = ['caldereros', 'gramalote-viejo', 'nuevo-gramalote']

// type: text | long | url | lat | lng | bool | int | icon | enum
const HERITAGE_FIELDS = [
  { key: 'name', col: 'name', label: 'Nombre', type: 'text', max: 180, required: true },
  { key: 'category', col: 'category', label: 'Subcategoría del mapa', type: 'text', max: 80, required: true },
  { key: 'fichaCategory', col: 'ficha_category', label: 'Categoría en la ficha', type: 'text', max: 80 },
  { key: 'status', col: 'status', label: 'Estado', type: 'enum', options: STATUSES, required: true },
  { key: 'zone', col: 'zone', label: 'Zona (texto del mapa)', type: 'text', max: 120 },
  { key: 'zoneKey', col: 'zone_key', label: 'Zona de la ficha', type: 'enum', options: ZONE_KEYS },
  { key: 'zoneTag', col: 'zone_tag', label: 'Etiqueta de zona', type: 'text', max: 120 },
  { key: 'historicalPeriod', col: 'historical_period', label: 'Época', type: 'text', max: 120 },
  { key: 'subtitle', col: 'subtitle', label: 'Subtítulo', type: 'text', max: 200 },
  { key: 'intro', col: 'intro', label: 'Frase introductoria', type: 'text', max: 600 },
  { key: 'summary', col: 'summary', label: 'Resumen', type: 'text', max: 320 },
  { key: 'description', col: 'description', label: 'Descripción histórica', type: 'long', max: 12000 },
  { key: 'visitLocation', col: 'visit_location', label: 'Ubicación (visita)', type: 'text', max: 500 },
  { key: 'visitAccess', col: 'visit_access', label: 'Acceso', type: 'text', max: 300 },
  { key: 'visitRecommendation', col: 'visit_recommendation', label: 'Recomendación', type: 'text', max: 1000 },
  { key: 'hoursText', col: 'hours_text', label: 'Horario de visita', type: 'text', max: 255 },
  { key: 'address', col: 'address', label: 'Dirección', type: 'text', max: 255 },
  { key: 'sources', col: 'sources', label: 'Fuentes consultadas', type: 'long', max: 4000 },
  { key: 'latitude', col: 'latitude', label: 'Latitud', type: 'lat', required: true },
  { key: 'longitude', col: 'longitude', label: 'Longitud', type: 'lng', required: true },
  { key: 'coordsApprox', col: 'coords_approx', label: 'Ubicación aproximada', type: 'bool' },
  { key: 'mapsUrl', col: 'maps_url', label: 'Enlace de Google Maps', type: 'url', max: 500 },
  { key: 'mapIcon', col: 'map_icon', label: 'Icono del mapa', type: 'icon', fallback: 'monumento' },
  { key: 'matrixRef', col: 'matrix_ref', label: 'Referencia de la matriz', type: 'text', max: 16, unique: true },
  { key: 'slug', col: 'slug', label: 'Enlace (slug)', type: 'slug', max: 160, unique: true },
  { key: 'sortOrder', col: 'sort_order', label: 'Orden', type: 'int' },
  { key: 'published', col: 'is_published', label: 'Publicada (ficha de Historia)', type: 'bool' },
  { key: 'showOnMap', col: 'show_on_map', label: 'Se ve en el mapa', type: 'bool' },
]

const EXTRA_FIELDS = [
  { key: 'name', col: 'name', label: 'Nombre', type: 'text', max: 180, required: true },
  { key: 'category', col: 'category', label: 'Categoría', type: 'text', max: 80, required: true },
  { key: 'zone', col: 'zone', label: 'Zona o referencia', type: 'text', max: 120 },
  { key: 'summary', col: 'summary', label: 'Resumen', type: 'text', max: 320 },
  { key: 'description', col: 'description', label: 'Descripción', type: 'long', max: 8000 },
  { key: 'locationDetail', col: 'location_detail', label: 'Cómo ubicarlo', type: 'text', max: 180 },
  { key: 'address', col: 'address', label: 'Dirección', type: 'text', max: 255 },
  { key: 'hoursText', col: 'hours_text', label: 'Horario', type: 'text', max: 255 },
  { key: 'phone', col: 'phone', label: 'Teléfono', type: 'text', max: 40 },
  { key: 'whatsapp', col: 'whatsapp', label: 'WhatsApp', type: 'text', max: 40 },
  { key: 'email', col: 'email', label: 'Correo', type: 'text', max: 190 },
  { key: 'website', col: 'website', label: 'Sitio web', type: 'url', max: 500 },
  { key: 'latitude', col: 'latitude', label: 'Latitud', type: 'lat', required: true },
  { key: 'longitude', col: 'longitude', label: 'Longitud', type: 'lng', required: true },
  { key: 'mapsUrl', col: 'maps_url', label: 'Enlace de Google Maps', type: 'url', max: 500 },
  { key: 'mapIcon', col: 'map_icon', label: 'Icono del mapa', type: 'icon', fallback: 'parque' },
  { key: 'matrixRef', col: 'matrix_ref', label: 'Referencia de la matriz', type: 'text', max: 16, unique: true },
  { key: 'slug', col: 'slug', label: 'Enlace (slug)', type: 'slug', max: 160, unique: true },
  { key: 'sortOrder', col: 'sort_order', label: 'Orden', type: 'int' },
  { key: 'published', col: 'is_published', label: 'Se ve en el mapa', type: 'bool' },
]

const KINDS = {
  heritage: {
    path: '/admin/heritage',
    table: 'heritage_sites',
    images: 'heritage_images',
    fk: 'heritage_id',
    entity: 'heritage',
    notFound: 'Lugar de patrimonio no encontrado',
    fields: HERITAGE_FIELDS,
    roles: ['cover', 'historic', 'current', 'gallery', 'detail'],
  },
  extras: {
    path: '/admin/extras',
    table: 'map_extras',
    images: 'extra_images',
    fk: 'extra_id',
    entity: 'extra',
    notFound: 'Extra no encontrado',
    fields: EXTRA_FIELDS,
    roles: ['cover', 'current', 'gallery', 'detail'],
  },
}

const ROLE_LABELS = {
  cover: 'portada',
  historic: 'histórica',
  current: 'actual',
  gallery: 'galería',
  detail: 'detalle',
}

function slugify(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160)
}

function bool(value) {
  return typeof value === 'boolean' ? value : booleanParam(value)
}

function parseField(spec, value) {
  const empty = value === null || value === undefined || value === ''
  switch (spec.type) {
    case 'text':
    case 'long':
    case 'url':
    case 'slug': {
      if (empty) {
        if (spec.required) throw new ApiError(400, 'VALIDATION', `${spec.label} es obligatorio`)
        return null
      }
      if (typeof value !== 'string') throw new ApiError(400, 'VALIDATION', `${spec.label} debe ser texto`)
      const trimmed = value.trim()
      if (!trimmed) {
        if (spec.required) throw new ApiError(400, 'VALIDATION', `${spec.label} es obligatorio`)
        return null
      }
      if (spec.type === 'url' && !/^https?:\/\//i.test(trimmed)) {
        throw new ApiError(400, 'VALIDATION', `${spec.label} debe empezar con http:// o https://`)
      }
      if (spec.type === 'slug') {
        const slug = slugify(trimmed)
        if (!slug) throw new ApiError(400, 'VALIDATION', 'El slug no es válido')
        return slug
      }
      return trimmed.slice(0, spec.max ?? 500)
    }
    case 'lat':
    case 'lng': {
      const max = spec.type === 'lat' ? 90 : 180
      const parsed = Number(value)
      if (empty || !Number.isFinite(parsed) || Math.abs(parsed) > max) {
        throw new ApiError(400, 'VALIDATION', `${spec.label} no es una coordenada válida`)
      }
      return parsed
    }
    case 'bool': {
      const parsed = bool(value)
      if (parsed === null || parsed === undefined) throw new ApiError(400, 'VALIDATION', `${spec.label}: indica sí o no`)
      return parsed ? 1 : 0
    }
    case 'int':
      return Number.parseInt(value, 10) || 0
    case 'icon': {
      if (empty) return spec.fallback
      if (!MAP_ICONS.includes(value)) throw new ApiError(400, 'VALIDATION', 'El icono del mapa no existe')
      return value
    }
    case 'enum': {
      if (empty) {
        if (spec.required) throw new ApiError(400, 'VALIDATION', `${spec.label} es obligatorio`)
        return null
      }
      if (!spec.options.includes(value)) throw new ApiError(400, 'VALIDATION', `${spec.label} no es válido`)
      return value
    }
    default:
      return value
  }
}

function fromRow(spec, row) {
  const raw = row[spec.col]
  if (spec.type === 'bool') return Boolean(raw)
  if (spec.type === 'lat' || spec.type === 'lng') return toNumber(raw)
  if (spec.type === 'int') return toNumber(raw) ?? 0
  return raw ?? null
}

function serialize(kind, row) {
  const data = { id: toNumber(row.id), updatedAt: row.updated_at }
  for (const spec of kind.fields) data[spec.key] = fromRow(spec, row)
  return data
}

function numId(value) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) throw new ApiError(400, 'VALIDATION', 'id no válido')
  return parsed
}

function parseChanges(value) {
  if (!value) return null
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

async function audit(connection, req, kind, action, entityId, changes) {
  await connection.query(
    `INSERT INTO audit_log (admin_user_id, action, entity_type, entity_id, changes, ip_address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      req.admin?.id ?? null,
      action,
      kind.entity,
      entityId,
      changes ? JSON.stringify(changes) : null,
      (req.ip ?? '').slice(0, 45) || null,
    ],
  )
}

async function findRow(kind, id) {
  const row = await queryOne(`SELECT * FROM ${kind.table} WHERE id = ?`, [id])
  if (!row) throw new ApiError(404, 'NOT_FOUND', kind.notFound)
  return row
}

async function loadImages(kind, id) {
  const rows = await query(
    `SELECT i.id, i.media_id, i.role, ${kind.entity === 'heritage' ? 'i.era_label' : 'NULL AS era_label'},
            i.sort_order, m.public_url, m.mime_type, m.width_px, m.height_px,
            m.alt_text, m.caption, m.credit, m.storage_disk
     FROM ${kind.images} i JOIN media m ON m.id = i.media_id
     WHERE i.${kind.fk} = ?
     ORDER BY FIELD(i.role, 'cover', 'historic', 'current', 'gallery', 'detail'), i.sort_order, i.id`,
    [id],
  )
  return rows.map((row) => ({
    id: toNumber(row.id),
    mediaId: toNumber(row.media_id),
    role: row.role,
    eraLabel: row.era_label ?? null,
    sortOrder: toNumber(row.sort_order) ?? 0,
    url: row.public_url,
    width: toNumber(row.width_px),
    height: toNumber(row.height_px),
    altText: row.alt_text ?? '',
    caption: row.caption ?? '',
    credit: row.credit ?? '',
    editable: row.storage_disk === 'local' || row.storage_disk === 'public',
  }))
}

async function loadAudit(kind, id) {
  const rows = await query(
    `SELECT a.id, a.action, a.entity_type, a.entity_id, a.changes, a.created_at, u.name AS user_name
     FROM audit_log a LEFT JOIN admin_users u ON u.id = a.admin_user_id
     WHERE a.entity_type = ? AND a.entity_id = ?
     ORDER BY a.id DESC LIMIT 60`,
    [kind.entity, id],
  )
  return rows.map((entry) => ({
    id: toNumber(entry.id),
    action: entry.action,
    entityType: entry.entity_type,
    entityId: toNumber(entry.entity_id),
    changes: parseChanges(entry.changes),
    userName: entry.user_name ?? null,
    createdAt: entry.created_at,
  }))
}

async function loadDetail(kind, id) {
  const row = await findRow(kind, id)
  const [images, history] = await Promise.all([loadImages(kind, id), loadAudit(kind, id)])
  return { ...serialize(kind, row), images, audit: history, imageRoles: kind.roles }
}

async function assertUnique(kind, spec, value, currentId) {
  if (!spec.unique || value === null) return
  const clash = await queryOne(
    `SELECT id FROM ${kind.table} WHERE ${spec.col} = ? AND id <> ?`,
    [value, currentId],
  )
  if (clash) {
    throw new ApiError(
      409,
      'DUPLICATE',
      spec.key === 'slug' ? 'Ese enlace (slug) ya está en uso' : `Ya existe un lugar con ese valor en «${spec.label}»`,
    )
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.media.maxUploadMb * 1024 * 1024, files: 1 },
})

function receiveImage(req, res, next) {
  upload.single('file')(req, res, (error) =>
    next(
      error
        ? new ApiError(400, 'UPLOAD_ERROR', 'No se pudo recibir la imagen (¿supera el tamaño máximo?)')
        : undefined,
    ),
  )
}

function shortText(value, field, max) {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') throw new ApiError(400, 'VALIDATION', `${field} debe ser texto`)
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

function pickRole(kind, value) {
  return kind.roles.includes(value) ? value : 'gallery'
}

for (const kind of Object.values(KINDS)) {
  // Detalle completo: campos, fotos y historial.
  router.get(
    `${kind.path}/:id`,
    requireAuth,
    asyncHandler(async (req, res) => {
      res.json({ data: await loadDetail(kind, numId(req.params.id)) })
    }),
  )

  // Guardado: solo se escriben y se registran los campos que de verdad cambiaron.
  router.patch(
    `${kind.path}/:id`,
    requireAuth,
    asyncHandler(async (req, res) => {
      const id = numId(req.params.id)
      const current = await findRow(kind, id)
      const body = req.body ?? {}

      const changes = {}
      const sets = []
      const values = []
      for (const spec of kind.fields) {
        if (!(spec.key in body)) continue
        const next = parseField(spec, body[spec.key])
        await assertUnique(kind, spec, next, id)
        const before = current[spec.col]
        const same =
          spec.type === 'bool'
            ? Boolean(before) === Boolean(next)
            : spec.type === 'lat' || spec.type === 'lng'
              ? Number(before) === Number(next)
              : String(before ?? '') === String(next ?? '')
        if (same) continue
        changes[spec.col] = {
          from: spec.type === 'bool' ? Boolean(before) : (before ?? null),
          to: spec.type === 'bool' ? Boolean(next) : (next ?? null),
        }
        sets.push(`${spec.col} = ?`)
        values.push(next)
      }

      if (sets.length > 0) {
        await withTransaction(async (connection) => {
          await connection.query(`UPDATE ${kind.table} SET ${sets.join(', ')} WHERE id = ?`, [...values, id])
          await audit(connection, req, kind, 'update', id, changes)
        })
      }

      res.json({ data: await loadDetail(kind, id) })
    }),
  )

  // Subir una foto nueva con su uso (portada, histórica, actual, galería, detalle).
  router.post(
    `${kind.path}/:id/images`,
    requireAuth,
    receiveImage,
    asyncHandler(async (req, res) => {
      const id = numId(req.params.id)
      await findRow(kind, id)
      if (!req.file?.buffer) throw new ApiError(400, 'VALIDATION', 'Falta el archivo de la imagen')

      const role = pickRole(kind, req.body?.role)
      const eraLabel = kind.entity === 'heritage' ? shortText(req.body?.eraLabel, 'Época', 60) : null
      await assertQuota(req.file.size)
      await ensureDir(mediaRoot())
      const stored = await storeImage(req.file.buffer, { folder: `${kind.entity}/${id}`, role: role === 'cover' ? 'cover' : 'gallery' })

      await withTransaction(async (connection) => {
        const [result] = await connection.query(
          `INSERT INTO media
             (storage_disk, storage_path, public_url, mime_type, width_px, height_px,
              alt_text, caption, credit, source, checksum_sha256)
           VALUES ('local', ?, ?, ?, ?, ?, ?, ?, ?, 'upload', ?)`,
          [
            stored.storagePath,
            stored.publicUrl,
            stored.mimeType,
            stored.width,
            stored.height,
            shortText(req.body?.altText, 'Texto alternativo', 255),
            shortText(req.body?.caption, 'Pie de foto', 500),
            shortText(req.body?.credit, 'Crédito', 255),
            stored.checksum,
          ],
        )
        if (role === 'cover') {
          await connection.query(
            `UPDATE ${kind.images} SET role = 'gallery' WHERE ${kind.fk} = ? AND role = 'cover'`,
            [id],
          )
        }
        const [sortRows] = await connection.query(
          `SELECT COALESCE(MAX(sort_order), 0) AS m FROM ${kind.images} WHERE ${kind.fk} = ?`,
          [id],
        )
        const columns = kind.entity === 'heritage' ? `${kind.fk}, media_id, role, era_label, sort_order` : `${kind.fk}, media_id, role, sort_order`
        const params =
          kind.entity === 'heritage'
            ? [id, result.insertId, role, eraLabel, Number(sortRows[0].m) + 10]
            : [id, result.insertId, role, Number(sortRows[0].m) + 10]
        await connection.query(
          `INSERT INTO ${kind.images} (${columns}) VALUES (${params.map(() => '?').join(', ')})`,
          params,
        )
        await audit(connection, req, kind, 'upload_media', id, {
          note: `Subió una foto como ${ROLE_LABELS[role]}${eraLabel ? ` (${eraLabel})` : ''}.`,
          mediaId: result.insertId,
          role,
        })
      })

      res.status(201).json({ data: await loadDetail(kind, id) })
    }),
  )

  // Cambiar el uso, la época, el texto alternativo, el pie o el crédito de una foto.
  router.patch(
    `${kind.path}/:id/images/:imageId`,
    requireAuth,
    asyncHandler(async (req, res) => {
      const id = numId(req.params.id)
      const imageId = numId(req.params.imageId)
      const image = await queryOne(
        `SELECT i.id, i.media_id, i.role, ${kind.entity === 'heritage' ? 'i.era_label' : 'NULL AS era_label'},
                m.alt_text, m.caption, m.credit
         FROM ${kind.images} i JOIN media m ON m.id = i.media_id
         WHERE i.id = ? AND i.${kind.fk} = ?`,
        [imageId, id],
      )
      if (!image) throw new ApiError(404, 'NOT_FOUND', 'Imagen no encontrada')
      const body = req.body ?? {}

      const notes = []
      await withTransaction(async (connection) => {
        if ('role' in body && kind.roles.includes(body.role) && body.role !== image.role) {
          if (body.role === 'cover') {
            await connection.query(
              `UPDATE ${kind.images} SET role = 'gallery' WHERE ${kind.fk} = ? AND role = 'cover' AND id <> ?`,
              [id, imageId],
            )
          }
          await connection.query(`UPDATE ${kind.images} SET role = ? WHERE id = ?`, [body.role, imageId])
          notes.push(`uso: ${ROLE_LABELS[image.role]} → ${ROLE_LABELS[body.role]}`)
        }
        if (kind.entity === 'heritage' && 'eraLabel' in body) {
          const era = shortText(body.eraLabel, 'Época', 60)
          if ((era ?? '') !== (image.era_label ?? '')) {
            await connection.query(`UPDATE ${kind.images} SET era_label = ? WHERE id = ?`, [era, imageId])
            notes.push(`época: ${image.era_label ?? 'sin época'} → ${era ?? 'sin época'}`)
          }
        }
        for (const [key, column, label, max] of [
          ['altText', 'alt_text', 'texto alternativo', 255],
          ['caption', 'caption', 'pie de foto', 500],
          ['credit', 'credit', 'crédito', 255],
        ]) {
          if (!(key in body)) continue
          const next = shortText(body[key], label, max)
          if ((next ?? '') !== (image[column] ?? '')) {
            await connection.query(`UPDATE media SET ${column} = ? WHERE id = ?`, [next, image.media_id])
            notes.push(label)
          }
        }
        if (notes.length > 0) {
          await audit(connection, req, kind, 'update_media', id, { note: `Cambió en una foto: ${notes.join('; ')}.` })
        }
      })

      res.json({ data: await loadDetail(kind, id) })
    }),
  )

  // Orden de las fotos: lista de ids de imagen en el orden deseado.
  router.put(
    `${kind.path}/:id/images/order`,
    requireAuth,
    asyncHandler(async (req, res) => {
      const id = numId(req.params.id)
      await findRow(kind, id)
      const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((value) => numId(value)) : null
      if (!ids) throw new ApiError(400, 'VALIDATION', 'Falta el orden de las fotos')
      const current = await loadImages(kind, id)
      const before = current.map((image) => image.id).join(',')
      await withTransaction(async (connection) => {
        for (const [index, imageId] of ids.entries()) {
          await connection.query(
            `UPDATE ${kind.images} SET sort_order = ? WHERE id = ? AND ${kind.fk} = ?`,
            [(index + 1) * 10, imageId, id],
          )
        }
        if (ids.join(',') !== before) await audit(connection, req, kind, 'reorder_media', id, { note: 'Reordenó las fotos.' })
      })
      res.json({ data: await loadDetail(kind, id) })
    }),
  )

  router.delete(
    `${kind.path}/:id/images/:imageId`,
    requireAuth,
    asyncHandler(async (req, res) => {
      const id = numId(req.params.id)
      const imageId = numId(req.params.imageId)
      const image = await queryOne(
        `SELECT i.media_id, i.role, m.storage_disk, m.storage_path
         FROM ${kind.images} i JOIN media m ON m.id = i.media_id
         WHERE i.id = ? AND i.${kind.fk} = ?`,
        [imageId, id],
      )
      if (!image) throw new ApiError(404, 'NOT_FOUND', 'Imagen no encontrada')

      const storagePath = await withTransaction(async (connection) => {
        await connection.query(`DELETE FROM ${kind.images} WHERE id = ?`, [imageId])
        await audit(connection, req, kind, 'delete_media', id, {
          note: `Quitó una foto (${ROLE_LABELS[image.role] ?? image.role}).`,
        })

        const [usage] = await connection.query(
          `SELECT (SELECT COUNT(*) FROM heritage_images WHERE media_id = ?) +
                  (SELECT COUNT(*) FROM extra_images WHERE media_id = ?) +
                  (SELECT COUNT(*) FROM experience_images WHERE media_id = ?) +
                  (SELECT COUNT(*) FROM establishment_images WHERE media_id = ?) AS total`,
          [image.media_id, image.media_id, image.media_id, image.media_id],
        )
        // Si otra ficha la sigue usando, solo se quita de esta.
        if (Number(usage[0]?.total ?? 0) > 0) return null
        // Las fotos que viven con el sitio (disco «public») no se borran del inventario.
        if (image.storage_disk !== 'local') return null
        try {
          await connection.query('DELETE FROM media WHERE id = ?', [image.media_id])
        } catch (error) {
          if (error?.code === 'ER_ROW_IS_REFERENCED_2') return null
          throw error
        }
        return image.storage_path
      })

      if (storagePath) await removeImageFiles(storagePath)
      res.json({ data: await loadDetail(kind, id) })
    }),
  )
}

export default router
