// Panel: calificaciones de cada ficha (pestaña «Calificaciones»). Lista quién
// votó y permite borrar una o todas; los triggers de la migración 013
// recalculan rating_stats al borrar.
import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { query, queryOne, withTransaction } from '../db.js'
import { ApiError, asyncHandler } from '../http.js'
import { toNumber } from '../serializers.js'

const router = Router()

const KINDS = {
  establishments: { type: 'establishment', table: 'establishments', notFound: 'Establecimiento no encontrado' },
  experiences: { type: 'experience', table: 'experiences', notFound: 'Experiencia no encontrada' },
}

function positiveId(value) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) throw new ApiError(400, 'VALIDATION', 'id no válido')
  return parsed
}

async function targetFrom(params) {
  const kind = KINDS[params.kind]
  if (!kind) throw new ApiError(404, 'NOT_FOUND', 'Tipo de ficha no válido')
  const id = positiveId(params.id)
  const row = await queryOne(`SELECT id FROM ${kind.table} WHERE id = ? AND deleted_at IS NULL`, [id])
  if (!row) throw new ApiError(404, 'NOT_FOUND', kind.notFound)
  return { type: kind.type, id }
}

async function listFor(target) {
  const [rows, stats] = await Promise.all([
    query(
      `SELECT id, voter_name, voter_email, stars, comment_text, status, pending_stars,
              pending_comment, confirm_expires_at, created_at, updated_at
       FROM ratings WHERE target_type = ? AND target_id = ?
       ORDER BY updated_at DESC, id DESC`,
      [target.type, target.id],
    ),
    queryOne('SELECT average, votes FROM rating_stats WHERE target_type = ? AND target_id = ?', [
      target.type,
      target.id,
    ]),
  ])
  return {
    average: Number(stats?.average ?? 0),
    votes: Number(stats?.votes ?? 0),
    items: rows.map((row) => ({
      id: toNumber(row.id),
      name: row.voter_name,
      email: row.voter_email,
      stars: Number(row.stars),
      // Comentario confirmado; el nuevo, si volvió a calificar, espera en pendingComment.
      comment: row.comment_text ?? null,
      pendingComment: row.pending_comment ?? null,
      // pending: aún no abre el enlace del correo (no cuenta en el promedio).
      // pendingStars: ya confirmado, pero votó otra vez y falta confirmar.
      pending: row.status === 'pending',
      pendingStars: row.pending_stars === null ? null : Number(row.pending_stars),
      confirmExpiresAt: row.confirm_expires_at ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  }
}

async function audit(connection, req, target, changes) {
  await connection.query(
    `INSERT INTO audit_log (admin_user_id, action, entity_type, entity_id, changes, ip_address)
     VALUES (?, 'delete_rating', ?, ?, ?, ?)`,
    [req.admin?.id ?? null, target.type, target.id, JSON.stringify(changes), (req.ip ?? '').slice(0, 45) || null],
  )
}

router.get(
  '/admin/:kind/:id/ratings',
  requireAuth,
  asyncHandler(async (req, res) => {
    const target = await targetFrom(req.params)
    res.json({ data: await listFor(target) })
  }),
)

router.delete(
  '/admin/:kind/:id/ratings/:ratingId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const target = await targetFrom(req.params)
    const ratingId = positiveId(req.params.ratingId)
    await withTransaction(async (connection) => {
      const [result] = await connection.query(
        'DELETE FROM ratings WHERE id = ? AND target_type = ? AND target_id = ?',
        [ratingId, target.type, target.id],
      )
      if (result.affectedRows === 0) throw new ApiError(404, 'NOT_FOUND', 'Calificación no encontrada')
      await audit(connection, req, target, { ratingId })
    })
    res.json({ data: await listFor(target) })
  }),
)

router.delete(
  '/admin/:kind/:id/ratings',
  requireAuth,
  asyncHandler(async (req, res) => {
    const target = await targetFrom(req.params)
    await withTransaction(async (connection) => {
      const [result] = await connection.query('DELETE FROM ratings WHERE target_type = ? AND target_id = ?', [
        target.type,
        target.id,
      ])
      await audit(connection, req, target, { all: true, deleted: result.affectedRows })
    })
    res.json({ data: await listFor(target) })
  }),
)

export default router
