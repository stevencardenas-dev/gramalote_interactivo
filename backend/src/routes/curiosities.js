import { Router } from 'express'
import { query, queryOne } from '../db.js'
import { ApiError, asyncHandler } from '../http.js'
import {
  mediaFromAlias,
  mediaFromRow,
  parseJson,
  toCuriositySection,
  toNumber,
} from '../serializers.js'

const router = Router()

router.get(
  '/curiosities',
  asyncHandler(async (_req, res) => {
    const rows = await query(
      `SELECT s.id, s.slug, s.eyebrow, s.title, s.summary, s.cta_label,
              s.sort_order, c.id AS curiosity_id,
              m.id AS media_id, m.public_url, m.alt_text
       FROM curiosity_sections s
       LEFT JOIN curiosities c ON c.section_id = s.id
       LEFT JOIN media m ON m.id = s.media_id
       WHERE s.is_published = 1 AND s.deleted_at IS NULL
       ORDER BY s.sort_order, s.id`,
    )

    res.json({ data: rows.map(toCuriositySection) })
  }),
)

router.get(
  '/curiosities/:slug',
  asyncHandler(async (req, res) => {
    const row = await queryOne(
      `SELECT s.id AS section_id, s.slug, s.eyebrow, s.title, s.summary,
              s.cta_label, s.sort_order,
              sm.id AS media_id, sm.public_url, sm.alt_text,
              c.id AS curiosity_id, c.intro_title, c.intro_text,
              c.closing_title, c.closing_text, c.closing_media_side,
              cm.id AS closing_media_id, cm.public_url AS closing_public_url,
              cm.alt_text AS closing_alt_text
       FROM curiosity_sections s
       JOIN curiosities c ON c.section_id = s.id
       LEFT JOIN media sm ON sm.id = s.media_id
       LEFT JOIN media cm ON cm.id = c.closing_media_id
       WHERE s.slug = ? AND s.is_published = 1 AND s.deleted_at IS NULL`,
      [req.params.slug],
    )

    if (!row) {
      throw new ApiError(404, 'NOT_FOUND', 'Curiosidad no encontrada')
    }

    const blocks = await query(
      `SELECT id, block_type, title, eyebrow, body_text, media_side,
              media_count, column_count, paragraphs, sort_order
       FROM curiosity_blocks
       WHERE curiosity_id = ?
       ORDER BY sort_order, id`,
      [row.curiosity_id],
    )

    const blockIds = blocks.map((block) => block.id)
    const [blockMedia, collectionItems] =
      blockIds.length === 0
        ? [[], []]
        : await Promise.all([
            query(
              `SELECT bm.block_id, bm.sort_order,
                      m.id AS media_id, m.public_url, m.alt_text, m.caption,
                      m.credit, m.mime_type, m.width_px, m.height_px
               FROM curiosity_block_media bm
               JOIN media m ON m.id = bm.media_id
               WHERE bm.block_id IN (?)
               ORDER BY bm.block_id, bm.sort_order, bm.id`,
              [blockIds],
            ),
            query(
              `SELECT ci.block_id, ci.id, ci.label, ci.text, ci.sort_order,
                      m.id AS media_id, m.public_url, m.alt_text, m.caption,
                      m.credit, m.mime_type, m.width_px, m.height_px
               FROM curiosity_collection_items ci
               LEFT JOIN media m ON m.id = ci.media_id
               WHERE ci.block_id IN (?)
               ORDER BY ci.block_id, ci.sort_order, ci.id`,
              [blockIds],
            ),
          ])

    const mediaByBlock = new Map()
    for (const item of blockMedia) {
      const list = mediaByBlock.get(item.block_id) ?? []
      const media = mediaFromRow(item)
      if (media) list.push(media)
      mediaByBlock.set(item.block_id, list)
    }

    const itemsByBlock = new Map()
    for (const item of collectionItems) {
      const list = itemsByBlock.get(item.block_id) ?? []
      list.push({
        id: toNumber(item.id),
        label: item.label,
        text: item.text ?? null,
        media: mediaFromRow(item),
        sortOrder: Number(item.sort_order),
      })
      itemsByBlock.set(item.block_id, list)
    }

    res.json({
      data: {
        id: toNumber(row.section_id),
        slug: row.slug,
        eyebrow: row.eyebrow ?? null,
        title: row.title,
        summary: row.summary,
        ctaLabel: row.cta_label ?? null,
        sortOrder: Number(row.sort_order),
        media: mediaFromAlias(row),
        detail: {
          id: toNumber(row.curiosity_id),
          introTitle: row.intro_title,
          introText: row.intro_text,
          closingTitle: row.closing_title ?? null,
          closingText: row.closing_text ?? null,
          closingMediaSide: row.closing_media_side,
          closingMedia: mediaFromAlias(row, 'closing_'),
          blocks: blocks.map((block) => ({
            id: toNumber(block.id),
            type: block.block_type,
            title: block.title ?? null,
            eyebrow: block.eyebrow ?? null,
            bodyText: block.body_text ?? null,
            mediaSide: block.media_side ?? null,
            mediaCount: Number(block.media_count),
            columnCount:
              block.column_count === null ? null : Number(block.column_count),
            paragraphs: parseJson(block.paragraphs, []),
            sortOrder: Number(block.sort_order),
            media: mediaByBlock.get(block.id) ?? [],
            items: itemsByBlock.get(block.id) ?? [],
          })),
        },
      },
    })
  }),
)

export default router
