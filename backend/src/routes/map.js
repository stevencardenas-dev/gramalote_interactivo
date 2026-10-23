import { Router } from 'express'
import { query } from '../db.js'
import { asyncHandler, stringParam } from '../http.js'
import { coverFromRow, toNumber } from '../serializers.js'

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
    const mapEstablishment = (row) => ({
      kind: 'establishment',
      id: toNumber(row.id),
      slug: row.slug,
      name: row.name,
      category: { slug: row.category_slug, name: row.category_name },
      type: row.type_name ?? null,
      zone: row.zone_slug ? { slug: row.zone_slug, name: row.zone_name } : null,
      coordinates: {
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
      },
      cover: coverFromRow(row),
    })
    const mapExperience = (row) => ({
      kind: 'experience',
      id: toNumber(row.id),
      slug: row.slug,
      name: row.title,
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

    const [establishments, experiences] = await Promise.all([
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
    ])

    res.json({
      data: {
        establishments: establishments.map(mapEstablishment),
        experiences: experiences.map(mapExperience),
      },
    })
  }),
)

export default router
