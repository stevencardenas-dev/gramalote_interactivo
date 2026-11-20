import { Router } from 'express'
import { query } from '../db.js'
import { asyncHandler, stringParam } from '../http.js'
import { coverFromRow, toNumber } from '../serializers.js'
import { listExtras } from './establishments.js'
import { ZONE_LABELS } from './heritage.js'

const router = Router()

const ESTABLISHMENT_COVER = `
  (SELECT m.id FROM establishment_images i JOIN media m ON m.id = i.media_id
   WHERE i.establishment_id = e.id AND i.role = 'cover'
   ORDER BY i.sort_order, i.id LIMIT 1) AS cover_media_id,
  (SELECT m.public_url FROM establishment_images i JOIN media m ON m.id = i.media_id
   WHERE i.establishment_id = e.id AND i.role = 'cover'
   ORDER BY i.sort_order, i.id LIMIT 1) AS cover_url,
  (SELECT m.alt_text FROM establishment_images i JOIN media m ON m.id = i.media_id
   WHERE i.establishment_id = e.id AND i.role = 'cover'
   ORDER BY i.sort_order, i.id LIMIT 1) AS cover_alt`

const HERITAGE_COVER = `
  (SELECT m.id FROM heritage_images i JOIN media m ON m.id = i.media_id
   WHERE i.heritage_id = h.id AND i.role = 'cover'
   ORDER BY i.sort_order, i.id LIMIT 1) AS cover_media_id,
  (SELECT m.public_url FROM heritage_images i JOIN media m ON m.id = i.media_id
   WHERE i.heritage_id = h.id AND i.role = 'cover'
   ORDER BY i.sort_order, i.id LIMIT 1) AS cover_url,
  (SELECT m.alt_text FROM heritage_images i JOIN media m ON m.id = i.media_id
   WHERE i.heritage_id = h.id AND i.role = 'cover'
   ORDER BY i.sort_order, i.id LIMIT 1) AS cover_alt`

const EXTRA_COVER = `
  (SELECT m.id FROM extra_images i JOIN media m ON m.id = i.media_id
   WHERE i.extra_id = x.id AND i.role = 'cover'
   ORDER BY i.sort_order, i.id LIMIT 1) AS cover_media_id,
  (SELECT m.public_url FROM extra_images i JOIN media m ON m.id = i.media_id
   WHERE i.extra_id = x.id AND i.role = 'cover'
   ORDER BY i.sort_order, i.id LIMIT 1) AS cover_url,
  (SELECT m.alt_text FROM extra_images i JOIN media m ON m.id = i.media_id
   WHERE i.extra_id = x.id AND i.role = 'cover'
   ORDER BY i.sort_order, i.id LIMIT 1) AS cover_alt`

const EXPERIENCE_COVER = `
  (SELECT m.id FROM experience_images i JOIN media m ON m.id = i.media_id
   WHERE i.experience_id = e.id AND i.role = 'cover'
   ORDER BY i.sort_order, i.id LIMIT 1) AS cover_media_id,
  (SELECT m.public_url FROM experience_images i JOIN media m ON m.id = i.media_id
   WHERE i.experience_id = e.id AND i.role = 'cover'
   ORDER BY i.sort_order, i.id LIMIT 1) AS cover_url,
  (SELECT m.alt_text FROM experience_images i JOIN media m ON m.id = i.media_id
   WHERE i.experience_id = e.id AND i.role = 'cover'
   ORDER BY i.sort_order, i.id LIMIT 1) AS cover_alt`

// Categoría o zona de un extra -> slug estable para los filtros del mapa.
function slugifyCategory(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Zona de un patrimonio: sale de la lista de la ficha (zone_key), así el mapa y la
// ficha no se contradicen. El texto suelto de la base solo es respaldo.
function heritageZone(row) {
  const name = ZONE_LABELS[row.zone_key] ?? row.zone
  return name ? { slug: slugifyCategory(name), name } : null
}

function buildWhere(queryParams, titleField = 'name') {
  const where = ['e.latitude IS NOT NULL', 'e.longitude IS NOT NULL']
  const params = []
  const zone = stringParam(queryParams.zone, { max: 40 })
  const category = stringParam(queryParams.category, { max: 60 })
  const search = stringParam(queryParams.q, { max: 160 })

  if (zone) {
    where.push('e.zone_slug = ?')
    params.push(zone)
  }
  if (category) {
    where.push('e.category_slug = ?')
    params.push(category)
  }
  if (search) {
    where.push(`(e.${titleField} LIKE ? OR e.summary LIKE ?)`)
    params.push(`%${search}%`, `%${search}%`)
  }

  return { sql: `WHERE ${where.join(' AND ')}`, params }
}

router.get(
  '/map',
  asyncHandler(async (req, res) => {
    const kind = stringParam(req.query.kind, { max: 20 }) ?? 'all'
    const establishmentFilters = buildWhere(req.query, 'name')
    const experienceFilters = buildWhere(req.query, 'title')
    const mapEstablishment = (row, extra, stats) => ({
      kind: 'establishment',
      id: toNumber(row.id),
      slug: row.slug,
      name: row.name,
      category: { slug: row.category_slug, name: row.category_name },
      type: row.type_name ?? null,
      mapIcon: row.map_icon ?? null,
      mapsUrl: row.maps_url ?? null,
      openNow: extra?.openNow ?? null,
      rating: stats ?? { average: 0, votes: 0 },
      zone: row.zone_slug ? { slug: row.zone_slug, name: row.zone_name } : null,
      coordinates: {
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
      },
      cover: coverFromRow(row),
    })
    const mapExperience = (row, stats) => ({
      kind: 'experience',
      id: toNumber(row.id),
      slug: row.slug,
      name: row.title,
      mapIcon: row.map_icon ?? null,
      mapsUrl: row.maps_url ?? null,
      rating: stats ?? { average: 0, votes: 0 },
      category: row.category_slug
        ? { slug: row.category_slug, name: row.category_name }
        : null,
      zone: row.zone_slug ? { slug: row.zone_slug, name: row.zone_name } : null,
      coordinates: {
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
      },
      cover: coverFromRow(row),
    })

    const [establishments, experiences, extraRows, heritageRows] = await Promise.all([
      kind === 'experience'
        ? []
        : query(
            `SELECT e.*, ${ESTABLISHMENT_COVER}
             FROM v_public_establishments e
             ${establishmentFilters.sql}
             ORDER BY e.sort_order, e.name`,
            establishmentFilters.params,
          ),
      kind === 'establishment'
        ? []
        : query(
            `SELECT e.*, ${EXPERIENCE_COVER}
             FROM v_public_experiences e
             ${experienceFilters.sql}
             ORDER BY e.sort_order, e.title`,
            experienceFilters.params,
          ),
      // Extras: puntos complementarios sin ficha; solo se filtran por categoría.
      query(
        `SELECT x.id, x.slug, x.name, x.category, x.zone, x.latitude, x.longitude,
                x.maps_url, x.map_icon, x.summary, x.sort_order, ${EXTRA_COVER}
         FROM map_extras x
         WHERE x.is_published = 1
         ORDER BY x.sort_order, x.name`,
      ),
      // Patrimonio: fichas en preparación; ya tienen pin y tarjeta de mapa.
      query(
        `SELECT h.id, h.slug, h.name, h.category, h.zone, h.zone_key, h.latitude, h.longitude,
                h.maps_url, h.map_icon, h.summary, h.sort_order, ${HERITAGE_COVER}
         FROM heritage_sites h
         WHERE h.is_published = 1 AND h.show_on_map = 1
         ORDER BY h.sort_order, h.name`,
      ),
    ])

    const [extras, stats] = await Promise.all([
      listExtras(establishments.map((row) => row.id)),
      query('SELECT target_type, target_id, average, votes FROM rating_stats'),
    ])
    const statsOf = (type, id) => {
      const row = stats.find(
        (item) => item.target_type === type && Number(item.target_id) === Number(id),
      )
      return row ? { average: Number(row.average), votes: Number(row.votes) } : null
    }

    res.json({
      data: {
        establishments: establishments.map((row) =>
          mapEstablishment(row, extras.get(Number(row.id)), statsOf('establishment', row.id)),
        ),
        experiences: experiences.map((row) => mapExperience(row, statsOf('experience', row.id))),
        extras: extraRows
          .filter((row) => Number.isFinite(Number(row.latitude)))
          .map((row) => ({
            kind: 'extra',
            id: toNumber(row.id),
            slug: row.slug,
            name: row.name,
            group: 'Extra',
            category: { slug: slugifyCategory(row.category), name: row.category },
            zone: row.zone ? { slug: slugifyCategory(row.zone), name: row.zone } : null,
            mapIcon: row.map_icon ?? null,
            mapsUrl: row.maps_url ?? null,
            coordinates: {
              latitude: Number(row.latitude),
              longitude: Number(row.longitude),
            },
            summary: row.summary ?? null,
            cover: coverFromRow(row),
          })),
        heritage: heritageRows
          .filter((row) => Number.isFinite(Number(row.latitude)))
          .map((row) => ({
            kind: 'heritage',
            id: toNumber(row.id),
            slug: row.slug,
            name: row.name,
            group: 'Patrimonio',
            category: { slug: slugifyCategory(row.category), name: row.category },
            // La zona sale de la lista de la ficha (zone_key); el texto suelto solo es respaldo.
            zone: heritageZone(row),
            mapIcon: row.map_icon ?? null,
            mapsUrl: row.maps_url ?? null,
            summary: row.summary ?? null,
            coordinates: {
              latitude: Number(row.latitude),
              longitude: Number(row.longitude),
            },
            cover: coverFromRow(row),
          })),
      },
    })
  }),
)

export default router
