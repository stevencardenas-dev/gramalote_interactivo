import { Router } from 'express'
import { query, queryOne } from '../db.js'
import {
  ApiError,
  asyncHandler,
  booleanParam,
  pagination,
  stringParam,
} from '../http.js'
import { calculateOpenNow } from '../opening-hours.js'
import {
  mediaFromRow,
  toEstablishmentSummary,
  toImage,
  toNumber,
} from '../serializers.js'

const router = Router()

const COVER_SELECT = `
  (SELECT m.id FROM establishment_images i JOIN media m ON m.id = i.media_id
   WHERE i.establishment_id = e.id AND i.role = 'cover'
   ORDER BY i.sort_order, i.id LIMIT 1) AS cover_media_id,
  (SELECT m.public_url FROM establishment_images i JOIN media m ON m.id = i.media_id
   WHERE i.establishment_id = e.id AND i.role = 'cover'
   ORDER BY i.sort_order, i.id LIMIT 1) AS cover_url,
  (SELECT m.alt_text FROM establishment_images i JOIN media m ON m.id = i.media_id
   WHERE i.establishment_id = e.id AND i.role = 'cover'
   ORDER BY i.sort_order, i.id LIMIT 1) AS cover_alt`

function filtersFromQuery(queryParams) {
  const where = []
  const params = []
  const category = stringParam(queryParams.category, { max: 20 })
  const type = stringParam(queryParams.type, { max: 80 })
  const zone = stringParam(queryParams.zone, { max: 40 })
  const service = stringParam(queryParams.service, { max: 80 })
  const payment = stringParam(queryParams.payment, { max: 60 })
  const search = stringParam(queryParams.q, { max: 160 })
  const featured = booleanParam(queryParams.featured)

  if (category) {
    where.push('e.category_slug = ?')
    params.push(category)
  }
  if (type) {
    where.push('e.type_slug = ?')
    params.push(type)
  }
  if (zone) {
    where.push('e.zone_slug = ?')
    params.push(zone)
  }
  if (service) {
    where.push(`EXISTS (
      SELECT 1 FROM establishment_services es
      JOIN services s ON s.id = es.service_id
      WHERE es.establishment_id = e.id AND s.slug = ?
    )`)
    params.push(service)
  }
  if (payment) {
    where.push(`EXISTS (
      SELECT 1 FROM establishment_payments ep
      JOIN payment_methods pm ON pm.id = ep.payment_method_id
      WHERE ep.establishment_id = e.id AND pm.slug = ?
    )`)
    params.push(payment)
  }
  if (featured !== null) {
    where.push('e.is_featured = ?')
    params.push(featured ? 1 : 0)
  }
  if (search) {
    const like = `%${search}%`
    where.push(
      '(e.name LIKE ? OR e.summary LIKE ? OR e.description LIKE ? OR e.address LIKE ?)',
    )
    params.push(like, like, like, like)
  }

  return {
    sql: where.length > 0 ? `WHERE ${where.join(' AND ')}` : '',
    params,
  }
}

router.get(
  '/establishments',
  asyncHandler(async (req, res) => {
    const { limit, offset } = pagination(req.query)
    const filters = filtersFromQuery(req.query)

    const [countRow, rows] = await Promise.all([
      queryOne(
        `SELECT COUNT(*) AS total FROM v_public_establishments e ${filters.sql}`,
        filters.params,
      ),
      query(
        `SELECT e.*, ${COVER_SELECT}
         FROM v_public_establishments e
         ${filters.sql}
         ORDER BY e.is_featured DESC, e.sort_order, e.name
         LIMIT ? OFFSET ?`,
        [...filters.params, limit, offset],
      ),
    ])

    res.json({
      data: rows.map(toEstablishmentSummary),
      meta: {
        total: Number(countRow?.total ?? 0),
        limit,
        offset,
      },
    })
  }),
)

router.get(
  '/establishments/:slug',
  asyncHandler(async (req, res) => {
    const row = await queryOne(
      `SELECT e.*, c.slug AS category_slug, c.name AS category_name,
              t.slug AS type_slug, t.name AS type_name, t.filter_group,
              z.slug AS zone_slug, z.name AS zone_name
       FROM establishments e
       JOIN establishment_categories c ON c.id = e.category_id
       LEFT JOIN establishment_types t ON t.id = e.type_id
       LEFT JOIN zones z ON z.id = e.zone_id
       WHERE e.slug = ? AND e.is_published = 1 AND e.deleted_at IS NULL`,
      [req.params.slug],
    )

    if (!row) {
      throw new ApiError(404, 'NOT_FOUND', 'Establecimiento no encontrado')
    }

    const [
      images,
      features,
      products,
      services,
      payments,
      social,
      hours,
      exceptions,
      related,
    ] = await Promise.all([
      query(
        `SELECT i.role, i.sort_order, i.alt_override,
                m.id AS media_id, m.public_url, m.alt_text, m.caption,
                m.credit, m.mime_type, m.width_px, m.height_px
         FROM establishment_images i
         JOIN media m ON m.id = i.media_id
         WHERE i.establishment_id = ?
         ORDER BY FIELD(i.role, 'cover', 'logo', 'gallery'), i.sort_order, i.id`,
        [row.id],
      ),
      query(
        `SELECT id, title, description, icon, sort_order
         FROM establishment_features
         WHERE establishment_id = ?
         ORDER BY sort_order, id`,
        [row.id],
      ),
      query(
        `SELECT p.id, p.name, p.description, p.price_cop, p.sort_order,
                m.id AS media_id, m.public_url, m.alt_text, m.caption,
                m.credit, m.mime_type, m.width_px, m.height_px
         FROM establishment_products p
         LEFT JOIN media m ON m.id = p.media_id
         WHERE p.establishment_id = ? AND p.is_active = 1
         ORDER BY p.sort_order, p.id`,
        [row.id],
      ),
      query(
        `SELECT s.slug, s.name, s.icon
         FROM establishment_services es
         JOIN services s ON s.id = es.service_id
         WHERE es.establishment_id = ?
         ORDER BY s.sort_order, s.id`,
        [row.id],
      ),
      query(
        `SELECT pm.slug, pm.name
         FROM establishment_payments ep
         JOIN payment_methods pm ON pm.id = ep.payment_method_id
         WHERE ep.establishment_id = ?
         ORDER BY pm.sort_order, pm.id`,
        [row.id],
      ),
      query(
        `SELECT platform, url
         FROM establishment_social_links
         WHERE establishment_id = ?
         ORDER BY sort_order, id`,
        [row.id],
      ),
      query(
        `SELECT day_of_week, opens_at, closes_at, is_closed, note, sort_order
         FROM opening_hours
         WHERE establishment_id = ?
         ORDER BY day_of_week, sort_order, id`,
        [row.id],
      ),
      query(
        `SELECT exception_date, is_closed, opens_at, closes_at, note
         FROM opening_hours_exceptions
         WHERE establishment_id = ?
         ORDER BY exception_date`,
        [row.id],
      ),
      query(
        `SELECT e.*, ${COVER_SELECT}
         FROM establishment_relations r
         JOIN v_public_establishments e ON e.id = r.related_establishment_id
         WHERE r.establishment_id = ?
         ORDER BY r.sort_order, e.name`,
        [row.id],
      ),
    ])

    const openNow = calculateOpenNow(hours, exceptions)
    const imageList = images.map(toImage).filter(Boolean)
    const cover = imageList.find((image) => image.role === 'cover') ?? imageList[0] ?? null

    res.json({
      data: {
        ...toEstablishmentSummary(row),
        cover,
        phoneSecondary: row.phone_secondary ?? null,
        openNow,
        images: imageList,
        features: features.map((feature) => ({
          id: toNumber(feature.id),
          title: feature.title,
          description: feature.description ?? null,
          icon: feature.icon ?? null,
          sortOrder: Number(feature.sort_order),
        })),
        products: products.map((product) => ({
          id: toNumber(product.id),
          name: product.name,
          description: product.description ?? null,
          price: toNumber(product.price_cop),
          media: mediaFromRow(product),
          sortOrder: Number(product.sort_order),
        })),
        services: services.map((service) => ({
          slug: service.slug,
          name: service.name,
          icon: service.icon ?? null,
        })),
        payments: payments.map((payment) => ({
          slug: payment.slug,
          name: payment.name,
        })),
        social: social.map((link) => ({
          platform: link.platform,
          url: link.url,
        })),
        openingHours: hours.map((slot) => ({
          dayOfWeek: Number(slot.day_of_week),
          opensAt: slot.opens_at ?? null,
          closesAt: slot.closes_at ?? null,
          closed: Boolean(slot.is_closed),
          note: slot.note ?? null,
          sortOrder: Number(slot.sort_order),
        })),
        openingHoursExceptions: exceptions.map((exception) => ({
          date: exception.exception_date,
          closed: Boolean(exception.is_closed),
          opensAt: exception.opens_at ?? null,
          closesAt: exception.closes_at ?? null,
          note: exception.note ?? null,
        })),
        related: related.map(toEstablishmentSummary),
      },
    })
  }),
)

export default router
