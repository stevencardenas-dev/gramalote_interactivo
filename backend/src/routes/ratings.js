import { Router } from 'express'
import { query, queryOne } from '../db.js'
import { ApiError, asyncHandler, stringParam } from '../http.js'

const router = Router()

const TARGETS = {
  establecimiento: {
    type: 'establishment',
    table: 'establishments',
    notFound: 'Establecimiento no encontrado',
  },
  experiencia: {
    type: 'experience',
    table: 'experiences',
    notFound: 'Experiencia no encontrada',
  },
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

async function targetFrom(params) {
  const target = TARGETS[params.kind]
  if (!target) throw new ApiError(404, 'NOT_FOUND', 'Tipo de ficha no válido')
  const row = await queryOne(
    `SELECT id FROM ${target.table}
     WHERE slug = ? AND is_published = 1 AND deleted_at IS NULL`,
    [params.slug],
  )
  if (!row) throw new ApiError(404, 'NOT_FOUND', target.notFound)
  return { type: target.type, id: row.id }
}

async function statsFor(target) {
  const row = await queryOne(
    'SELECT average, votes FROM rating_stats WHERE target_type = ? AND target_id = ?',
    [target.type, target.id],
  )
  return { average: Number(row?.average ?? 0), votes: Number(row?.votes ?? 0) }
}

// Establecimientos mejor calificados (para recomendar), sin el actual.
router.get(
  '/ratings/top',
  asyncHandler(async (req, res) => {
    const exclude = stringParam(req.query.exclude, { max: 160 })
    const category = stringParam(req.query.category, { max: 60 })
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 3, 1), 12)
    const where = []
    const params = []
    if (exclude) {
      where.push('e.slug <> ?')
      params.push(exclude)
    }
    if (category) {
      where.push('e.category_slug = ?')
      params.push(category)
    }

    const rows = await query(
      `SELECT e.id, e.slug, e.name, e.type_name, e.category_name,
              s.average, s.votes,
              (SELECT m.public_url FROM establishment_images i JOIN media m ON m.id = i.media_id
               WHERE i.establishment_id = e.id AND i.role = 'cover'
               ORDER BY i.sort_order, i.id LIMIT 1) AS cover_url
       FROM v_public_establishments e
       LEFT JOIN rating_stats s
         ON s.target_type = 'establishment' AND s.target_id = e.id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY COALESCE(s.average, 0) DESC, COALESCE(s.votes, 0) DESC, e.sort_order, e.name
       LIMIT ?`,
      [...params, limit],
    )

    res.json({
      data: rows.map((row) => ({
        id: Number(row.id),
        slug: row.slug,
        name: row.name,
        type: row.type_name ?? row.category_name,
        photo: row.cover_url ?? null,
        average: Number(row.average ?? 0),
        votes: Number(row.votes ?? 0),
      })),
    })
  }),
)

router.get(
  '/ratings/:kind/:slug',
  asyncHandler(async (req, res) => {
    const target = await targetFrom(req.params)
    res.json({ data: await statsFor(target) })
  }),
)

router.post(
  '/ratings/:kind/:slug',
  asyncHandler(async (req, res) => {
    const target = await targetFrom(req.params)
    const name = stringParam(req.body?.name, { max: 80 })
    const email = stringParam(req.body?.email, { max: 160 })?.toLowerCase()
    const stars = Number(req.body?.stars)

    if (!name || name.length < 2) {
      throw new ApiError(400, 'INVALID_NAME', 'Escribe tu nombre')
    }
    if (!email || !EMAIL.test(email)) {
      throw new ApiError(400, 'INVALID_EMAIL', 'Escribe un correo válido')
    }
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      throw new ApiError(400, 'INVALID_STARS', 'La calificación va de 1 a 5 estrellas')
    }

    await query(
      `INSERT INTO ratings (target_type, target_id, voter_name, voter_email, stars)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE voter_name = VALUES(voter_name), stars = VALUES(stars)`,
      [target.type, target.id, name, email, stars],
    )

    res.status(201).json({ data: await statsFor(target) })
  }),
)

export default router
