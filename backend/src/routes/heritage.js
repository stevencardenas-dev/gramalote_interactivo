import { Router } from 'express'
import { query, queryOne } from '../db.js'
import { ApiError, asyncHandler } from '../http.js'
import { toNumber } from '../serializers.js'

// Fichas públicas de Historia › Patrimonio. Lo que se edita en el panel
// (Lugares › Patrimonio) llega aquí; el sitio lo mezcla con sus datos de respaldo.

const router = Router()

export const ZONE_LABELS = {
  caldereros: 'Caldereros',
  'gramalote-viejo': 'Gramalote Viejo',
  'nuevo-gramalote': 'Nuevo Gramalote',
}

function paragraphs(text) {
  return String(text ?? '')
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
}

async function loadImages(ids) {
  if (ids.length === 0) return new Map()
  const rows = await query(
    `SELECT i.heritage_id, i.role, i.era_label, i.sort_order, m.public_url, m.alt_text, m.caption, m.credit
     FROM heritage_images i JOIN media m ON m.id = i.media_id
     WHERE i.heritage_id IN (${ids.map(() => '?').join(',')})
     ORDER BY i.sort_order, i.id`,
    ids,
  )
  const byId = new Map()
  for (const row of rows) {
    const list = byId.get(Number(row.heritage_id)) ?? []
    list.push({
      role: row.role,
      eraLabel: row.era_label ?? null,
      url: row.public_url,
      alt: row.alt_text ?? null,
      caption: row.caption ?? null,
      credit: row.credit ?? null,
    })
    byId.set(Number(row.heritage_id), list)
  }
  return byId
}

function serialize(row, images = []) {
  const cover = images.find((image) => image.role === 'cover') ?? null
  const hasVisit = row.visit_location || row.visit_access || row.visit_recommendation
  // Carrusel: solo las fotos con uso «Carrusel» (role «historic»). Las de
  // «Galería» van siempre a la cuadrícula, aunque conserven una época vieja.
  const isEra = (image) => image.role === 'historic'
  const slides = images
    .filter(isEra)
    .map((image) => ({ src: image.url, label: image.eraLabel, alt: image.alt, caption: image.caption, credit: image.credit }))
  // El carrusel no incluye la portada: si se quiere en él, se sube también como «Carrusel».
  return {
    slug: row.slug,
    name: row.name,
    zone: row.zone_key ?? null,
    zoneLabel: row.zone_key ? (ZONE_LABELS[row.zone_key] ?? row.zone) : (row.zone ?? null),
    zoneTag: row.zone_tag ?? null,
    category: row.ficha_category ?? row.category,
    status: row.status ?? 'Visitable',
    subtitle: row.subtitle ?? null,
    intro: row.intro ?? null,
    summary: row.summary ?? null,
    body: paragraphs(row.description),
    visit: hasVisit
      ? {
          location: row.visit_location ?? null,
          access: row.visit_access ?? null,
          recommendation: row.visit_recommendation ?? null,
        }
      : null,
    hoursText: row.hours_text ?? null,
    address: row.address ?? null,
    sources: row.sources ?? null,
    mapsUrl: row.maps_url ?? null,
    coords: Number.isFinite(Number(row.latitude)) ? [Number(row.longitude), Number(row.latitude)] : null,
    coordsApprox: Boolean(row.coords_approx),
    showOnMap: Boolean(row.show_on_map),
    order: toNumber(row.sort_order) ?? 0,
    image: cover?.url ?? null,
    imageAlt: cover?.alt ?? null,
    imageCaption: cover?.caption ?? null,
    imageCredit: cover?.credit ?? null,
    eras: slides,
    gallery: images
      .filter((image) => !isEra(image) && image.role !== 'cover')
      .map((image) => ({ src: image.url, alt: image.alt, caption: image.caption, credit: image.credit })),
    images,
  }
}

router.get(
  '/heritage',
  asyncHandler(async (_req, res) => {
    const rows = await query('SELECT * FROM heritage_sites WHERE is_published = 1 ORDER BY sort_order, name')
    const images = await loadImages(rows.map((row) => Number(row.id)))
    res.json({ data: rows.map((row) => serialize(row, images.get(Number(row.id)) ?? [])) })
  }),
)

router.get(
  '/heritage/:slug',
  asyncHandler(async (req, res) => {
    const row = await queryOne('SELECT * FROM heritage_sites WHERE slug = ? AND is_published = 1', [req.params.slug])
    if (!row) throw new ApiError(404, 'NOT_FOUND', 'Patrimonio no encontrado')
    const images = await loadImages([Number(row.id)])
    res.json({ data: serialize(row, images.get(Number(row.id)) ?? []) })
  }),
)

export default router
