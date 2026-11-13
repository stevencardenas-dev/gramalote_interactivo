// Calificaciones públicas. Con el correo configurado (Panel › Correo) cada voto
// queda pendiente hasta que la persona abre el enlace que le llega; sin correo,
// cuenta de inmediato.
import { Router } from 'express'
import { createHash, randomBytes } from 'node:crypto'
import { query, queryOne } from '../db.js'
import { ApiError, asyncHandler, stringParam } from '../http.js'
import { getMailSettings, mailReady, renderEmail, sendMail } from '../mailer.js'
import { consume, limitByIp } from '../rate-limit.js'

const router = Router()

const TARGETS = {
  establecimiento: {
    type: 'establishment',
    table: 'establishments',
    nameColumn: 'name',
    notFound: 'Establecimiento no encontrado',
  },
  experiencia: {
    type: 'experience',
    table: 'experiences',
    nameColumn: 'title',
    notFound: 'Experiencia no encontrada',
  },
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const CONFIRM_HOURS = 48

const tokenHashOf = (token) => createHash('sha256').update(token).digest('hex')

const HOUR = 60 * 60 * 1000
const RATING_LIMIT_MESSAGE = 'Enviaste muchas calificaciones seguidas; intenta de nuevo en un rato.'

async function targetFrom(params) {
  const target = TARGETS[params.kind]
  if (!target) throw new ApiError(404, 'NOT_FOUND', 'Tipo de ficha no válido')
  const row = await queryOne(
    `SELECT id, ${target.nameColumn} AS name FROM ${target.table}
     WHERE slug = ? AND is_published = 1 AND deleted_at IS NULL`,
    [params.slug],
  )
  if (!row) throw new ApiError(404, 'NOT_FOUND', target.notFound)
  return { type: target.type, id: row.id, name: row.name }
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
    const settings = await getMailSettings()
    // confirm: el voto se confirma por correo (el sitio lo avisa en el diálogo).
    res.json({ data: { ...(await statsFor(target)), confirm: settings.ratingConfirmation && mailReady(settings) } })
  }),
)

// Por IP: 10 calificaciones por hora y 30 por día (cada una puede mandar un
// correo). Por correo destino: 4 por hora (ver abajo).
router.post(
  '/ratings/:kind/:slug',
  limitByIp('rating', [
    { windowMs: HOUR, max: 10, message: RATING_LIMIT_MESSAGE },
    { windowMs: 24 * HOUR, max: 30, message: RATING_LIMIT_MESSAGE },
  ]),
  asyncHandler(async (req, res) => {
    const target = await targetFrom(req.params)
    const name = stringParam(req.body?.name, { max: 80 })
    const email = stringParam(req.body?.email, { max: 160 })?.toLowerCase()
    const stars = Number(req.body?.stars)
    // Comentario opcional; si viene vacío se guarda como NULL.
    const comment = stringParam(req.body?.comment, { max: 1000 })

    if (!name || name.length < 2) {
      throw new ApiError(400, 'INVALID_NAME', 'Escribe tu nombre')
    }
    if (!email || !EMAIL.test(email)) {
      throw new ApiError(400, 'INVALID_EMAIL', 'Escribe un correo válido')
    }
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      throw new ApiError(400, 'INVALID_STARS', 'La calificación va de 1 a 5 estrellas')
    }

    const settings = await getMailSettings()
    const mustConfirm = settings.ratingConfirmation && mailReady(settings)

    if (!mustConfirm) {
      // Sin correo configurado (o con la confirmación apagada) el voto cuenta
      // de inmediato, como antes.
      await query(
        `INSERT INTO ratings (target_type, target_id, voter_name, voter_email, stars, comment_text, status, confirmed_at)
         VALUES (?, ?, ?, ?, ?, ?, 'confirmed', NOW())
         ON DUPLICATE KEY UPDATE voter_name = VALUES(voter_name), stars = VALUES(stars),
           comment_text = VALUES(comment_text), status = 'confirmed', pending_stars = NULL,
           pending_name = NULL, pending_comment = NULL,
           confirm_token_hash = NULL, confirm_expires_at = NULL, confirmed_at = NOW()`,
        [target.type, target.id, name, email, stars, comment],
      )
      res.status(201).json({ data: { ...(await statsFor(target)), pending: false } })
      return
    }

    consume('rating-email', email, { windowMs: HOUR, max: 4, message: RATING_LIMIT_MESSAGE })

    // Limpieza perezosa de votos que nunca se confirmaron.
    await query(
      `DELETE FROM ratings WHERE status = 'pending' AND confirm_expires_at < NOW() - INTERVAL 1 DAY`,
    )

    const token = randomBytes(32).toString('hex')
    const tokenHash = tokenHashOf(token)
    const existing = await queryOne(
      'SELECT id, status FROM ratings WHERE target_type = ? AND target_id = ? AND voter_email = ?',
      [target.type, target.id, email],
    )
    let createdId = null
    if (existing?.status === 'confirmed') {
      // El voto anterior sigue contando hasta que se confirme el nuevo.
      await query(
        `UPDATE ratings SET pending_stars = ?, pending_name = ?, pending_comment = ?,
           confirm_token_hash = ?, confirm_expires_at = NOW() + INTERVAL ${CONFIRM_HOURS} HOUR
         WHERE id = ?`,
        [stars, name, comment, tokenHash, existing.id],
      )
    } else if (existing) {
      await query(
        `UPDATE ratings SET voter_name = ?, stars = ?, comment_text = ?, pending_stars = NULL,
           pending_name = NULL, pending_comment = NULL, confirm_token_hash = ?,
           confirm_expires_at = NOW() + INTERVAL ${CONFIRM_HOURS} HOUR
         WHERE id = ?`,
        [name, stars, comment, tokenHash, existing.id],
      )
    } else {
      const result = await query(
        `INSERT INTO ratings (target_type, target_id, voter_name, voter_email, stars, comment_text,
           status, confirm_token_hash, confirm_expires_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NOW() + INTERVAL ${CONFIRM_HOURS} HOUR)`,
        [target.type, target.id, name, email, stars, comment, tokenHash],
      )
      createdId = result.insertId
    }

    const url = `${settings.siteUrl}/confirmar-calificacion?token=${token}`
    const { html, text } = renderEmail({
      title: 'Confirma tu calificación',
      paragraphs: [
        `${name.split(' ')[0]}:`,
        `Gracias por calificar ${target.name} con ${stars} ${stars === 1 ? 'estrella' : 'estrellas'}. Para que tu voto cuente, confírmalo con el botón. Así evitamos votos falsos.`,
        `El enlace vence en ${CONFIRM_HOURS} horas. Si calificas otra vez con este correo, cuenta solo tu último voto.`,
        ...(comment ? ['Guardamos también tu comentario; el equipo del sitio lo verá en el panel.'] : []),
      ],
      rows: comment ? [['Tu comentario', comment]] : [],
      action: { label: 'Confirmar mi calificación', url },
      footer: 'Si no calificaste nada en Turismo Gramalote, ignora este correo y el voto no se contará.',
    })
    try {
      await sendMail({ to: email, subject: `Confirma tu calificación de ${target.name}`, html, text, kind: 'rating_confirm' })
    } catch (failure) {
      if (createdId) await query('DELETE FROM ratings WHERE id = ?', [createdId])
      else if (existing?.status === 'confirmed') {
        await query(
          'UPDATE ratings SET pending_stars = NULL, pending_name = NULL, confirm_token_hash = NULL, confirm_expires_at = NULL WHERE id = ?',
          [existing.id],
        )
      }
      console.error('[mail] confirmación de calificación:', failure.message)
      throw new ApiError(502, 'MAIL_FAILED', 'No pudimos enviarte el correo de confirmación. Intenta de nuevo más tarde.')
    }

    res.status(202).json({ data: { ...(await statsFor(target)), pending: true } })
  }),
)

// Abre el enlace del correo: el voto pasa a contar.
router.post(
  '/ratings/confirm',
  limitByIp('rating-confirm', [{ windowMs: HOUR, max: 30 }]),
  asyncHandler(async (req, res) => {
    const token = stringParam(req.body?.token, { max: 128 })
    if (!token) throw new ApiError(400, 'VALIDATION', 'Falta el enlace de confirmación')
    const row = await queryOne(
      `SELECT r.id, r.target_type, r.target_id, r.stars, r.pending_stars, r.pending_name,
              r.confirm_expires_at, r.status,
              COALESCE(e.slug, x.slug) AS slug, COALESCE(e.name, x.title) AS title
       FROM ratings r
       LEFT JOIN establishments e ON r.target_type = 'establishment' AND e.id = r.target_id
       LEFT JOIN experiences x ON r.target_type = 'experience' AND x.id = r.target_id
       WHERE r.confirm_token_hash = ?`,
      [tokenHashOf(token)],
    )
    if (!row || new Date(row.confirm_expires_at).getTime() <= Date.now()) {
      throw new ApiError(400, 'INVALID_TOKEN', 'El enlace no es válido o ya venció. Vuelve a calificar para recibir uno nuevo.')
    }
    const stars = row.pending_stars ?? row.stars
    await query(
      `UPDATE ratings SET stars = ?, voter_name = COALESCE(pending_name, voter_name),
         comment_text = COALESCE(pending_comment, comment_text), status = 'confirmed',
         pending_stars = NULL, pending_name = NULL, pending_comment = NULL,
         confirm_token_hash = NULL, confirm_expires_at = NULL, confirmed_at = NOW()
       WHERE id = ?`,
      [stars, row.id],
    )
    const target = { type: row.target_type, id: row.target_id }
    res.json({
      data: {
        kind: row.target_type === 'experience' ? 'experiencia' : 'establecimiento',
        slug: row.slug,
        title: row.title,
        stars: Number(stars),
        ...(await statsFor(target)),
      },
    })
  }),
)

export default router
