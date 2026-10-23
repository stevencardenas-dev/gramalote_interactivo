import { Router } from 'express'
import { query, queryOne } from '../db.js'
import { ApiError, asyncHandler } from '../http.js'
import { mediaFromRow, toImage, toNumber } from '../serializers.js'

const router = Router()

router.get(
  '/history',
  asyncHandler(async (_req, res) => {
    const rows = await query(
      `SELECT h.id, h.slug, h.title, h.period_label, h.summary, h.sort_order,
              m.id AS media_id, m.public_url, m.alt_text, m.caption,
              m.credit, m.mime_type, m.width_px, m.height_px
       FROM history_entries h
       LEFT JOIN media m ON m.id = h.media_id
       WHERE h.is_published = 1 AND h.deleted_at IS NULL
       ORDER BY h.sort_order, h.id`,
    )

    res.json({
      data: rows.map((row) => ({
        id: toNumber(row.id),
        slug: row.slug,
        title: row.title,
        periodLabel: row.period_label ?? null,
        summary: row.summary ?? null,
        media: mediaFromRow(row),
        sortOrder: Number(row.sort_order),
      })),
    })
  }),
)

router.get(
  '/history/:slug',
  asyncHandler(async (req, res) => {
    const row = await queryOne(
      `SELECT h.id, h.slug, h.title, h.period_label, h.summary, h.body,
              h.sort_order, h.created_at, h.updated_at,
              m.id AS media_id, m.public_url, m.alt_text, m.caption,
              m.credit, m.mime_type, m.width_px, m.height_px
       FROM history_entries h
       LEFT JOIN media m ON m.id = h.media_id
       WHERE h.slug = ? AND h.is_published = 1 AND h.deleted_at IS NULL`,
      [req.params.slug],
    )

    if (!row) {
      throw new ApiError(404, 'NOT_FOUND', 'Entrada de historia no encontrada')
    }

    const images = await query(
      `SELECT i.sort_order, i.alt_override,
              m.id AS media_id, m.public_url, m.alt_text, m.caption,
              m.credit, m.mime_type, m.width_px, m.height_px
       FROM history_images i
       JOIN media m ON m.id = i.media_id
       WHERE i.entry_id = ?
       ORDER BY i.sort_order, i.id`,
      [row.id],
    )

    res.json({
      data: {
        id: toNumber(row.id),
        slug: row.slug,
        title: row.title,
        periodLabel: row.period_label ?? null,
        summary: row.summary ?? null,
        body: row.body,
        cover: mediaFromRow(row),
        images: images.map(toImage).filter(Boolean),
        sortOrder: Number(row.sort_order),
        createdAt: row.created_at ?? null,
        updatedAt: row.updated_at ?? null,
      },
    })
  }),
)

export default router
