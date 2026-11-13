import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { query, queryOne } from '../db.js'
import { ApiError, asyncHandler, booleanParam } from '../http.js'
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

function coordinate(value, field, max) {
  const parsed = Number(value)
  if (value === null || value === undefined || value === '' || !Number.isFinite(parsed) || Math.abs(parsed) > max) {
    throw new ApiError(400, 'VALIDATION', `${field} no es una coordenada válida`)
  }
  return parsed
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
    matrixRef: row.matrix_ref ?? null,
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

async function assertMatrixRef(value, currentId = null) {
  if (!value) return
  const row = currentId
    ? await queryOne('SELECT id FROM heritage_sites WHERE matrix_ref = ? AND id <> ?', [value, currentId])
    : await queryOne('SELECT id FROM heritage_sites WHERE matrix_ref = ?', [value])
  if (row) throw new ApiError(409, 'DUPLICATE', 'Ya existe un lugar con esa referencia de la matriz')
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
    const rows = await query('SELECT * FROM heritage_sites ORDER BY sort_order, name')
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
    const matrixRef = text(body.matrixRef, 'Referencia de la matriz', { max: 16 })
    await assertMatrixRef(matrixRef)
    const slug = await uniqueSlug(name)

    const [result] = await query(
      `INSERT INTO heritage_sites
         (matrix_ref, slug, name, category, zone, latitude, longitude, maps_url,
          map_icon, summary, description, sort_order, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        matrixRef,
        slug,
        name,
        category,
        text(body.zone, 'Zona', { max: 120 }),
        coordinate(body.latitude, 'Latitud', 90),
        coordinate(body.longitude, 'Longitud', 180),
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

router.patch(
  '/admin/heritage/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10)
    const current = await findHeritage(id)
    const body = req.body ?? {}
    const name = body.name !== undefined ? text(body.name, 'Nombre', { max: 180, required: true }) : current.name
    const category =
      body.category !== undefined
        ? text(body.category, 'Subcategoría', { max: 80, required: true })
        : current.category
    const zone = body.zone !== undefined ? text(body.zone, 'Zona', { max: 120 }) : current.zone
    const latitude =
      body.latitude !== undefined ? coordinate(body.latitude, 'Latitud', 90) : Number(current.latitude)
    const longitude =
      body.longitude !== undefined
        ? coordinate(body.longitude, 'Longitud', 180)
        : Number(current.longitude)
    const link = body.mapsUrl !== undefined ? mapsUrl(body.mapsUrl) : current.maps_url
    const icon = body.mapIcon !== undefined ? mapIcon(body.mapIcon) : current.map_icon
    const matrixRef =
      body.matrixRef !== undefined
        ? text(body.matrixRef, 'Referencia de la matriz', { max: 16 })
        : current.matrix_ref
    if (body.matrixRef !== undefined) await assertMatrixRef(matrixRef, id)
    const summary =
      body.summary !== undefined ? text(body.summary, 'Resumen', { max: 320 }) : current.summary
    const description =
      body.description !== undefined
        ? text(body.description, 'Descripción', { max: 8000 })
        : current.description
    const sortOrder =
      body.sortOrder !== undefined
        ? Number.parseInt(body.sortOrder, 10) || 0
        : Number(current.sort_order)

    let published = Boolean(current.is_published)
    if (body.published !== undefined) {
      const next = bool(body.published)
      if (next === null) throw new ApiError(400, 'VALIDATION', 'Indica si se publica o no')
      published = next
    }

    let slug = current.slug
    if (name !== current.name) slug = await uniqueSlug(name, id)

    await query(
      `UPDATE heritage_sites
       SET matrix_ref = ?, slug = ?, name = ?, category = ?, zone = ?, latitude = ?,
           longitude = ?, maps_url = ?, map_icon = ?, summary = ?, description = ?,
           sort_order = ?, is_published = ?
       WHERE id = ?`,
      [
        matrixRef,
        slug,
        name,
        category,
        zone,
        latitude,
        longitude,
        link,
        icon,
        summary,
        description,
        sortOrder,
        published ? 1 : 0,
        id,
      ],
    )

    res.json({ data: serialize(await findHeritage(id)) })
  }),
)

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
