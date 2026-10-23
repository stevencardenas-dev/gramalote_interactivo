import { Router } from 'express'
import { query } from '../db.js'
import { asyncHandler, pagination, stringParam } from '../http.js'
import { toNumber } from '../serializers.js'

const router = Router()

router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const term = stringParam(req.query.q, { max: 160 })
    const { limit, offset } = pagination(req.query)

    if (!term || term.length < 2) {
      res.json({ data: [], meta: { total: 0, limit, offset, query: term } })
      return
    }

    const [countRow, rows] = await Promise.all([
      query(
        `SELECT COUNT(*) AS total
         FROM search_documents
         WHERE is_published = 1
           AND MATCH(title, body) AGAINST (? IN NATURAL LANGUAGE MODE)`,
        [term],
      ),
      query(
        `SELECT entity_type, entity_id, title, url
         FROM search_documents
         WHERE is_published = 1
           AND MATCH(title, body) AGAINST (? IN NATURAL LANGUAGE MODE)
         ORDER BY MATCH(title, body) AGAINST (? IN NATURAL LANGUAGE MODE) DESC
         LIMIT ? OFFSET ?`,
        [term, term, limit, offset],
      ),
    ])

    res.json({
      data: rows.map((row) => ({
        entityType: row.entity_type,
        entityId: toNumber(row.entity_id),
        title: row.title,
        url: row.url,
      })),
      meta: {
        total: Number(countRow[0]?.total ?? 0),
        limit,
        offset,
        query: term,
      },
    })
  }),
)

export default router
