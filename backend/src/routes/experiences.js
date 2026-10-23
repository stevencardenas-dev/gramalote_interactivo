import { Router } from 'express'
import { query, queryOne } from '../db.js'
import {
  ApiError,
  asyncHandler,
  booleanParam,
  pagination,
  stringParam,
} from '../http.js'
import {
  toEstablishmentSummary,
  toExperienceSummary,
  toImage,
  toNumber,
} from '../serializers.js'

const router = Router()

const COVER_SELECT = `
  (SELECT m.id FROM experience_images i JOIN media m ON m.id = i.media_id
   WHERE i.experience_id = e.id AND i.role = 'cover'
   ORDER BY i.sort_order, i.id LIMIT 1) AS cover_media_id,
  (SELECT m.public_url FROM experience_images i JOIN media m ON m.id = i.media_id
   WHERE i.experience_id = e.id AND i.role = 'cover'
   ORDER BY i.sort_order, i.id LIMIT 1) AS cover_url,
  (SELECT m.alt_text FROM experience_images i JOIN media m ON m.id = i.media_id
   WHERE i.experience_id = e.id AND i.role = 'cover'
   ORDER BY i.sort_order, i.id LIMIT 1) AS cover_alt`

function filtersFromQuery(queryParams) {
  const where = []
  const params = []
  const category = stringParam(queryParams.category, { max: 60 })
  const zone = stringParam(queryParams.zone, { max: 40 })
  const search = stringParam(queryParams.q, { max: 160 })
  const featured = booleanParam(queryParams.featured)

  if (category) {
    where.push('e.category_slug = ?')
    params.push(category)
  }
  if (zone) {
    where.push('e.zone_slug = ?')
    params.push(zone)
  }
  if (featured !== null) {
    where.push('e.is_featured = ?')
    params.push(featured ? 1 : 0)
  }
  if (search) {
    const like = `%${search}%`
    where.push(
      '(e.title LIKE ? OR e.summary LIKE ? OR e.description LIKE ? OR e.address LIKE ?)',
    )
    params.push(like, like, like, like)
  }

  return {
    sql: where.length > 0 ? `WHERE ${where.join(' AND ')}` : '',
    params,
  }
}

router.get(
  '/experiences',
  asyncHandler(async (req, res) => {
    const { limit, offset } = pagination(req.query)
    const filters = filtersFromQuery(req.query)

    const [countRow, rows] = await Promise.all([
      queryOne(
        `SELECT COUNT(*) AS total FROM v_public_experiences e ${filters.sql}`,
        filters.params,
      ),
      query(
        `SELECT e.*, ${COVER_SELECT}
         FROM v_public_experiences e
         ${filters.sql}
         ORDER BY e.is_featured DESC, e.sort_order, e.title
         LIMIT ? OFFSET ?`,
        [...filters.params, limit, offset],
      ),
    ])

    res.json({
      data: rows.map(toExperienceSummary),
      meta: {
        total: Number(countRow?.total ?? 0),
        limit,
        offset,
      },
    })
  }),
)

router.get(
  '/experiences/:slug',
  asyncHandler(async (req, res) => {
    const row = await queryOne(
      `SELECT e.*, c.slug AS category_slug, c.name AS category_name,
              z.slug AS zone_slug, z.name AS zone_name
       FROM experiences e
       LEFT JOIN experience_categories c ON c.id = e.category_id
       LEFT JOIN zones z ON z.id = e.zone_id
       WHERE e.slug = ? AND e.is_published = 1 AND e.deleted_at IS NULL`,
      [req.params.slug],
    )

    if (!row) {
      throw new ApiError(404, 'NOT_FOUND', 'Experiencia no encontrada')
    }

    const [images, tips, social, related] = await Promise.all([
      query(
        `SELECT i.role, i.sort_order, i.alt_override,
                m.id AS media_id, m.public_url, m.alt_text, m.caption,
                m.credit, m.mime_type, m.width_px, m.height_px
         FROM experience_images i
         JOIN media m ON m.id = i.media_id
         WHERE i.experience_id = ?
         ORDER BY FIELD(i.role, 'cover', 'gallery'), i.sort_order, i.id`,
        [row.id],
      ),
      query(
        `SELECT id, title, description, icon, sort_order
         FROM experience_tips
         WHERE experience_id = ?
         ORDER BY sort_order, id`,
        [row.id],
      ),
      query(
        `SELECT platform, url
         FROM experience_social_links
         WHERE experience_id = ?
         ORDER BY sort_order, id`,
        [row.id],
      ),
      query(
        `SELECT e.*, ${COVER_SELECT}
         FROM experience_establishments ee
         JOIN v_public_establishments e ON e.id = ee.establishment_id
         WHERE ee.experience_id = ?
         ORDER BY ee.sort_order, e.name`,
        [row.id],
      ),
    ])

    const imageList = images.map(toImage).filter(Boolean)
    const cover = imageList.find((image) => image.role === 'cover') ?? imageList[0] ?? null

    res.json({
      data: {
        ...toExperienceSummary(row),
        cover,
        images: imageList,
        tips: tips.map((tip) => ({
          id: toNumber(tip.id),
          title: tip.title,
          description: tip.description ?? null,
          icon: tip.icon ?? null,
          sortOrder: Number(tip.sort_order),
        })),
        social: social.map((link) => ({
          platform: link.platform,
          url: link.url,
        })),
        establishments: related.map(toEstablishmentSummary),
      },
    })
  }),
)

router.get(
  '/experiences/:slug/tips',
  asyncHandler(async (req, res) => {
    const experience = await queryOne(
      `SELECT id FROM experiences
       WHERE slug = ? AND is_published = 1 AND deleted_at IS NULL`,
      [req.params.slug],
    )
    if (!experience) {
      throw new ApiError(404, 'NOT_FOUND', 'Experiencia no encontrada')
    }

    const tips = await query(
      `SELECT id, title, description, icon, sort_order
       FROM experience_tips
       WHERE experience_id = ?
       ORDER BY sort_order, id`,
      [experience.id],
    )

    res.json({
      data: tips.map((tip) => ({
        id: toNumber(tip.id),
        title: tip.title,
        description: tip.description ?? null,
        icon: tip.icon ?? null,
        sortOrder: Number(tip.sort_order),
      })),
    })
  }),
)

export default router
