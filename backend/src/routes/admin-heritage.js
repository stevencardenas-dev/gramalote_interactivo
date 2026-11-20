import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { query, queryOne } from '../db.js'
import { ApiError, asyncHandler, booleanParam } from '../http.js'
import { parseCoordinate } from '../coordinates.js'
import { MAP_ICONS } from '../map-icons.js'
import { toNumber } from '../serializers.js'

// Panel › Lugares › Patrimonio: bienes que tendrán ficha pública. Mientras la
// ficha se completa, sus datos ya alimentan la tarjeta y el pin del mapa.

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
  return icon ?? 'monumento'
}

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
    summary: row.summary ?? null,
    description: row.description ?? null,
    coverUrl: row.cover_url ?? null,
    coverAlt: row.cover_alt ?? null,
    sortOrder: toNumber(row.sort_order) ?? 0,
    published: Boolean(row.is_published),
    updatedAt: row.updated_at,
  }
}

async function findHeritage(id) {
  const row = await queryOne('SELECT * FROM heritage_sites WHERE id = ?', [id])
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'Lugar de patrimonio no encontrado')
  return row
}

async function uniqueSlug(name, currentId = null) {
  const base = slugify(name) || `patrimonio-${Date.now().toString(36)}`
  const rows = currentId
    ? await query('SELECT id, slug FROM heritage_sites WHERE slug = ? AND id <> ?', [base, currentId])
    : await query('SELECT id, slug FROM heritage_sites WHERE slug = ?', [base])
  return rows.length > 0 ? `${base}-${Date.now().toString(36)}` : base
}

router.get(
  '/admin/heritage',
  requireAuth,
  asyncHandler(async (_req, res) => {
    // El listado del panel muestra la portada de cada ficha; sin esta consulta
    // caía siempre en el icono del mapa aunque la ficha tuviera fotos.
    const rows = await query(
      `SELECT h.*,
              (SELECT m.public_url FROM heritage_images i JOIN media m ON m.id = i.media_id
               WHERE i.heritage_id = h.id AND i.role = 'cover'
               ORDER BY i.sort_order, i.id LIMIT 1) AS cover_url,
              (SELECT m.alt_text FROM heritage_images i JOIN media m ON m.id = i.media_id
               WHERE i.heritage_id = h.id AND i.role = 'cover'
               ORDER BY i.sort_order, i.id LIMIT 1) AS cover_alt
       FROM heritage_sites h
       ORDER BY h.sort_order, h.name`,
    )
    res.json({ data: rows.map(serialize), meta: { total: rows.length } })
  }),
)

router.post(
  '/admin/heritage',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = req.body ?? {}
    const name = text(body.name, 'Nombre', { max: 180, required: true })
    const category = text(body.category, 'Subcategoría', { max: 80, required: true })
    const slug = await uniqueSlug(name)

    const result = await query(
      `INSERT INTO heritage_sites
         (slug, name, category, zone, latitude, longitude, maps_url,
          map_icon, summary, description, sort_order, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slug,
        name,
        category,
        text(body.zone, 'Zona', { max: 120 }),
        parseCoordinate(body.latitude, 'lat', 'Latitud'),
        parseCoordinate(body.longitude, 'lng', 'Longitud'),
        mapsUrl(body.mapsUrl),
        mapIcon(body.mapIcon),
        text(body.summary, 'Resumen', { max: 320 }),
        text(body.description, 'Descripción', { max: 8000 }),
        Number.parseInt(body.sortOrder, 10) || 0,
        bool(body.published) === true ? 1 : 0,
      ],
    )

    res.status(201).json({ data: serialize(await findHeritage(result.insertId)) })
  }),
)

// El guardado de una ficha (PATCH /:id) y sus fotos viven en admin-places.js.

router.delete(
  '/admin/heritage/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10)
    await findHeritage(id)
    await query('DELETE FROM heritage_sites WHERE id = ?', [id])
    res.json({ data: { id } })
  }),
)

export default router
