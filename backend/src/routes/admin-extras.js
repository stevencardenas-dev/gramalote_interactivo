import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { query, queryOne } from '../db.js'
import { ApiError, asyncHandler, booleanParam } from '../http.js'
import { parseCoordinate } from '../coordinates.js'
import { MAP_ICONS } from '../map-icons.js'
import { toNumber } from '../serializers.js'

// Panel › Lugares › Extras: puntos complementarios del mapa (la Matriz los
// marca «sin ficha»). No tienen ficha pública: toda su información se ve en la
// tarjeta del mapa, así que aquí solo se editan los datos que esa tarjeta usa.

const router = Router()

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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
  return trimmed.slice(0, max)
}

function mapsUrl(value) {
  const url = text(value, 'Enlace de Google Maps', { max: 500 })
  if (url !== null && !/^https?:\/\//i.test(url)) {
    throw new ApiError(400, 'VALIDATION', 'El enlace de Google Maps debe empezar con http:// o https://')
  }
  return url
}

function mapIcon(value) {
  const icon = text(value, 'Icono del mapa', { max: 40 })
  if (icon && !MAP_ICONS.includes(icon)) {
    throw new ApiError(400, 'VALIDATION', 'El icono del mapa no existe')
  }
  return icon ?? 'parque'
}

// El panel manda booleanos; los formularios, '1'/'0'.
function bool(value) {
  return typeof value === 'boolean' ? value : booleanParam(value)
}

function serialize(row) {
  return {
    id: toNumber(row.id),
    slug: row.slug,
    name: row.name,
    category: row.category,
    zone: row.zone ?? null,
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    mapsUrl: row.maps_url ?? null,
    mapIcon: row.map_icon,
    coverUrl: row.cover_url ?? null,
    sortOrder: toNumber(row.sort_order) ?? 0,
    published: Boolean(row.is_published),
    updatedAt: row.updated_at,
  }
}

async function findExtra(id) {
  const row = await queryOne('SELECT * FROM map_extras WHERE id = ?', [id])
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'Extra no encontrado')
  return row
}

// Cualquier cuenta activa puede consultar; editar también.
router.get(
  '/admin/extras',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const rows = await query(
      // El listado muestra la foto de cada extra; sin esta consulta caía siempre en el icono.
      `SELECT x.*,
              (SELECT m.public_url FROM extra_images i JOIN media m ON m.id = i.media_id
               WHERE i.extra_id = x.id ORDER BY i.sort_order, i.id LIMIT 1) AS cover_url
       FROM map_extras x ORDER BY x.is_published DESC, x.sort_order, x.name`,
    )
    res.json({ data: rows.map(serialize), meta: { total: rows.length } })
  }),
)

router.post(
  '/admin/extras',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = req.body ?? {}
    const name = text(body.name, 'Nombre', { max: 180, required: true })
    const category = text(body.category, 'Categoría', { max: 80, required: true })
    const published = bool(body.published) === true

    const existing = await queryOne('SELECT slug FROM map_extras WHERE slug = ?', [slugify(name)])
    const slug = existing ? `${slugify(name)}-${Date.now().toString(36)}` : slugify(name)

    const result = await query(
      `INSERT INTO map_extras
         (slug, name, category, zone, latitude, longitude, maps_url, map_icon,
          sort_order, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slug,
        name,
        category,
        text(body.zone, 'Zona', { max: 120 }),
        parseCoordinate(body.latitude, 'lat', 'Latitud'),
        parseCoordinate(body.longitude, 'lng', 'Longitud'),
        mapsUrl(body.mapsUrl),
        mapIcon(body.mapIcon),
        Number.parseInt(body.sortOrder, 10) || 0,
        published ? 1 : 0,
      ],
    )

    res.status(201).json({ data: serialize(await findExtra(result.insertId)) })
  }),
)

// El guardado de una ficha (PATCH /:id) y sus fotos viven en admin-places.js.

router.delete(
  '/admin/extras/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10)
    await findExtra(id)
    await query('DELETE FROM map_extras WHERE id = ?', [id])
    res.json({ data: { id } })
  }),
)

export default router
