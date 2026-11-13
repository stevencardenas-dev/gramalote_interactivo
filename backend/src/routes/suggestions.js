// Sugerencias de establecimientos nuevos. Los visitantes llenan el formulario
// de /sugerir; aquí se validan, se guardan, se avisa por correo al equipo y se
// agradece a quien sugirió. El panel las revisa en Sugerencias.
import { Router } from 'express'
import { requireAuth } from '../auth.js'
import { query, queryOne } from '../db.js'
import { ApiError, asyncHandler, stringParam } from '../http.js'
import { EMAIL, getMailSettings, notifyList, renderEmail, trySendMail } from '../mailer.js'
import { clientIp, consume, limitByIp } from '../rate-limit.js'
import { parseJson } from '../serializers.js'

const router = Router()
const STATUSES = ['nueva', 'revisada', 'agregada', 'descartada']
const HOUR = 60 * 60 * 1000

// Mismas opciones que muestra el formulario del sitio.
export const SUGGESTION_TYPES = [
  'Dónde comer',
  'Dónde dormir',
  'Dónde comprar',
  'Dónde ir',
  'Experiencia o actividad',
  'Otro',
]
const OWNER = ['Sí', 'No']

function row(item) {
  return {
    id: Number(item.id),
    source: item.source,
    businessName: item.business_name,
    businessType: item.business_type,
    address: item.address,
    phone: item.phone,
    links: item.links,
    reason: item.reason,
    isOwner: item.is_owner,
    suggesterName: item.suggester_name,
    suggesterEmail: item.suggester_email,
    rawAnswers: parseJson(item.raw_answers, null),
    status: item.status,
    adminNote: item.admin_note,
    submittedAt: item.submitted_at ?? item.created_at,
    createdAt: item.created_at,
  }
}

function field(body, key, label, { max, required = false, min = 0 }) {
  const value = stringParam(body?.[key], { max })
  if (!value) {
    if (required) throw new ApiError(400, 'VALIDATION', `${label}: este campo es obligatorio`)
    return null
  }
  if (value.length < min) throw new ApiError(400, 'VALIDATION', `${label}: escribe un poco más`)
  return value
}

// Por IP: 5 sugerencias por hora y 15 por día. Además, una trampa para bots
// (campo «website» oculto) y un tiempo mínimo de llenado.
router.post(
  '/suggestions',
  limitByIp('suggestion', [
    { windowMs: HOUR, max: 5, message: 'Ya enviaste varias sugerencias; intenta de nuevo en una hora.' },
    { windowMs: 24 * HOUR, max: 15, message: 'Llegaste al máximo de sugerencias por hoy. ¡Gracias!' },
  ]),
  asyncHandler(async (req, res) => {
    const body = req.body ?? {}
    const elapsed = Number(body.elapsedMs)
    // Los bots llenan el campo oculto o envían en menos de 3 s: se responde
    // como si nada para no darles pistas, pero no se guarda.
    if (stringParam(body.website, { max: 200 }) || (Number.isFinite(elapsed) && elapsed < 3000)) {
      res.status(201).json({ data: { ok: true } })
      return
    }

    const businessType = field(body, 'tipo', 'Tipo de lugar', { max: 120, required: true })
    if (!SUGGESTION_TYPES.includes(businessType)) {
      throw new ApiError(400, 'VALIDATION', 'Tipo de lugar: elige una de las opciones')
    }
    const isOwner = field(body, 'esDueno', '¿Eres el dueño?', { max: 10 })
    if (isOwner && !OWNER.includes(isOwner)) throw new ApiError(400, 'VALIDATION', '¿Eres el dueño?: responde Sí o No')
    const email = field(body, 'correo', 'Tu correo', { max: 190 })?.toLowerCase() ?? null
    if (email && !EMAIL.test(email)) throw new ApiError(400, 'VALIDATION', 'Tu correo: escribe un correo válido')

    const fields = {
      source: 'web',
      business_name: field(body, 'nombre', 'Nombre del establecimiento', { max: 190, required: true, min: 2 }),
      business_type: businessType,
      address: field(body, 'direccion', 'Dirección', { max: 500 }),
      phone: field(body, 'telefono', 'Teléfono', { max: 120 }),
      links: field(body, 'redes', 'Redes o web', { max: 500 }),
      reason: field(body, 'motivo', '¿Por qué lo recomiendas?', { max: 2000, required: true, min: 10 }),
      is_owner: isOwner,
      suggester_name: field(body, 'sugeridoPor', 'Tu nombre', { max: 160 }),
      suggester_email: email,
      ip_address: clientIp(req),
      submitted_at: new Date(),
    }
    // Un correo de agradecimiento por dirección cada hora como mucho.
    let thank = Boolean(email)
    if (email) {
      try {
        consume('suggestion-email', email, { windowMs: HOUR, max: 2 })
      } catch {
        thank = false
      }
    }

    const columns = Object.keys(fields)
    const result = await query(
      `INSERT INTO establishment_suggestions (${columns.join(', ')})
       VALUES (${columns.map(() => '?').join(', ')})`,
      columns.map((column) => fields[column]),
    )

    const settings = await getMailSettings()
    const rows = [
      ['Establecimiento', fields.business_name],
      ['Tipo', fields.business_type],
      ['Dirección', fields.address],
      ['Teléfono', fields.phone],
      ['Redes / web', fields.links],
      ['¿Es el dueño?', fields.is_owner],
      ['Sugerido por', [fields.suggester_name, fields.suggester_email].filter(Boolean).join(' · ')],
      ['Por qué', fields.reason],
    ]
    const team = notifyList(settings)
    if (team.length) {
      const { html, text } = renderEmail({
        title: `Nueva sugerencia: ${fields.business_name}`,
        paragraphs: ['Llegó una sugerencia de establecimiento desde el sitio.'],
        rows,
        action: { label: 'Revisar en el panel', url: `${settings.siteUrl}/admin/sugerencias` },
      })
      trySendMail({
        to: team,
        subject: `Nueva sugerencia: ${fields.business_name}`,
        html,
        text,
        kind: 'suggestion_notify',
        replyTo: fields.suggester_email ?? undefined,
      })
    }
    if (thank) {
      const { html, text } = renderEmail({
        title: '¡Gracias por tu sugerencia!',
        paragraphs: [
          `${(fields.suggester_name ?? '').split(' ')[0] || 'Hola'}:`,
          `Recibimos tu sugerencia de «${fields.business_name}». El equipo de Turismo Gramalote la revisará y, si cumple con lo necesario, la agregaremos al sitio.`,
        ],
        action: { label: 'Seguir explorando Gramalote', url: settings.siteUrl },
      })
      trySendMail({
        to: fields.suggester_email,
        subject: 'Recibimos tu sugerencia · Turismo Gramalote',
        html,
        text,
        kind: 'suggestion_thanks',
      })
    }

    res.status(201).json({ data: { ok: true, id: Number(result.insertId) } })
  }),
)

router.get(
  '/admin/suggestions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const status = STATUSES.includes(req.query.status) ? req.query.status : null
    const rows = await query(
      `SELECT * FROM establishment_suggestions
       ${status ? 'WHERE status = ?' : ''}
       ORDER BY FIELD(status, 'nueva', 'revisada', 'agregada', 'descartada'), created_at DESC
       LIMIT 300`,
      status ? [status] : [],
    )
    res.json({ data: rows.map(row) })
  }),
)

router.patch(
  '/admin/suggestions/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10)
    const current = await queryOne('SELECT * FROM establishment_suggestions WHERE id = ?', [id])
    if (!current) throw new ApiError(404, 'NOT_FOUND', 'Sugerencia no encontrada')
    const status = req.body?.status ?? current.status
    if (!STATUSES.includes(status)) throw new ApiError(400, 'VALIDATION', 'Estado no válido')
    const note = req.body?.adminNote === undefined ? current.admin_note : stringParam(req.body.adminNote, { max: 500 })
    await query('UPDATE establishment_suggestions SET status = ?, admin_note = ? WHERE id = ?', [status, note, id])
    await query(
      `INSERT INTO audit_log (admin_user_id, action, entity_type, entity_id, changes, ip_address)
       VALUES (?, 'update', 'suggestion', ?, ?, ?)`,
      [req.admin.id, id, JSON.stringify({ status }), clientIp(req)],
    )
    res.json({ data: row(await queryOne('SELECT * FROM establishment_suggestions WHERE id = ?', [id])) })
  }),
)

router.delete(
  '/admin/suggestions/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = Number.parseInt(req.params.id, 10)
    await query('DELETE FROM establishment_suggestions WHERE id = ?', [id])
    await query(
      `INSERT INTO audit_log (admin_user_id, action, entity_type, entity_id, ip_address)
       VALUES (?, 'delete', 'suggestion', ?, ?)`,
      [req.admin.id, id, clientIp(req)],
    )
    res.status(204).end()
  }),
)

export default router
