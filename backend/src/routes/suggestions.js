// Sugerencias de establecimientos nuevos. Los visitantes llenan un formulario de
// Google (enlace en Panel › Correo); un Apps Script del formulario reenvía cada
// respuesta a POST /api/suggestions/google-form con un secreto compartido. Aquí
// se guardan, se avisa por correo al equipo y se agradece a quien sugirió.
import { Router } from 'express'
import { timingSafeEqual } from 'node:crypto'
import { requireAuth } from '../auth.js'
import { query, queryOne } from '../db.js'
import { ApiError, asyncHandler, stringParam } from '../http.js'
import { EMAIL, getMailSettings, notifyList, renderEmail, trySendMail } from '../mailer.js'
import { parseJson } from '../serializers.js'

const router = Router()
const STATUSES = ['nueva', 'revisada', 'agregada', 'descartada']

function sameSecret(given, expected) {
  if (!given || !expected) return false
  const a = Buffer.from(String(given))
  const b = Buffer.from(String(expected))
  return a.length === b.length && timingSafeEqual(a, b)
}

// Enlace para incrustar: Google acepta ?embedded=true en /viewform.
function embedUrl(url) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (!/(^|\.)google\.com$/.test(parsed.hostname) || !parsed.pathname.includes('/forms/')) return null
    if (parsed.hostname === 'forms.gle') return null
    parsed.searchParams.set('embedded', 'true')
    return parsed.toString()
  } catch {
    return null
  }
}

function text(value, max) {
  if (Array.isArray(value)) value = value.filter(Boolean).join(', ')
  return stringParam(typeof value === 'string' ? value : value == null ? '' : String(value), { max })
}

function row(item) {
  return {
    id: Number(item.id),
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

router.get(
  '/suggestions/form',
  asyncHandler(async (_req, res) => {
    const settings = await getMailSettings()
    res.set('Cache-Control', 'public, max-age=300')
    res.json({ data: { url: settings.formUrl || null, embedUrl: embedUrl(settings.formUrl) } })
  }),
)

router.post(
  '/suggestions/google-form',
  asyncHandler(async (req, res) => {
    const settings = await getMailSettings()
    const given = req.get('x-gramalote-secret') ?? req.body?.secret
    if (!sameSecret(given, settings.formSecret)) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Secreto del formulario no válido')
    }

    const answers = req.body?.answers ?? {}
    const businessName = text(answers.nombre, 190)
    if (!businessName) throw new ApiError(400, 'VALIDATION', 'Falta el nombre del establecimiento')
    const suggesterEmail = text(answers.correo ?? req.body?.respondentEmail, 190)?.toLowerCase() ?? null
    const submitted = new Date(req.body?.submittedAt ?? Date.now())

    const fields = {
      response_id: text(req.body?.responseId, 190),
      business_name: businessName,
      business_type: text(answers.tipo, 120),
      address: text(answers.direccion, 500),
      phone: text(answers.telefono, 120),
      links: text(answers.redes, 500),
      reason: text(answers.motivo, 4000),
      is_owner: text(answers.esDueno, 40),
      suggester_name: text(answers.sugeridoPor, 160),
      suggester_email: suggesterEmail && EMAIL.test(suggesterEmail) ? suggesterEmail : null,
      raw_answers: JSON.stringify(req.body?.raw ?? answers).slice(0, 60_000),
      submitted_at: Number.isNaN(submitted.getTime()) ? new Date() : submitted,
    }
    const columns = Object.keys(fields)
    const result = await query(
      `INSERT IGNORE INTO establishment_suggestions (${columns.join(', ')})
       VALUES (${columns.map(() => '?').join(', ')})`,
      columns.map((column) => fields[column]),
    )
    // Reenvío de la misma respuesta (Apps Script reintenta): no se duplica.
    if (!result.affectedRows) {
      res.json({ data: { duplicate: true } })
      return
    }

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
      const { html, text: plain } = renderEmail({
        title: `Nueva sugerencia: ${fields.business_name}`,
        paragraphs: ['Llegó una sugerencia de establecimiento desde el formulario de Google.'],
        rows,
        action: { label: 'Revisar en el panel', url: `${settings.siteUrl}/admin/sugerencias` },
      })
      trySendMail({
        to: team,
        subject: `Nueva sugerencia: ${fields.business_name}`,
        html,
        text: plain,
        kind: 'suggestion_notify',
        replyTo: fields.suggester_email ?? undefined,
      })
    }
    if (fields.suggester_email) {
      const { html, text: plain } = renderEmail({
        title: '¡Gracias por tu sugerencia!',
        paragraphs: [
          `${(fields.suggester_name ?? '').split(' ')[0] || 'Hola'}:`,
          `Recibimos tu sugerencia de «${fields.business_name}». El equipo de Gramalote Interactivo la revisará y, si cumple con lo necesario, la agregaremos al sitio.`,
        ],
        action: { label: 'Seguir explorando Gramalote', url: settings.siteUrl },
      })
      trySendMail({
        to: fields.suggester_email,
        subject: 'Recibimos tu sugerencia · Gramalote Interactivo',
        html,
        text: plain,
        kind: 'suggestion_thanks',
      })
    }

    res.status(201).json({ data: { id: Number(result.insertId) } })
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
      [req.admin.id, id, JSON.stringify({ status }), (req.ip ?? '').slice(0, 45) || null],
    )
    res.json({ data: row(await queryOne('SELECT * FROM establishment_suggestions WHERE id = ?', [id])) })
  }),
)

router.delete(
  '/admin/suggestions/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.admin?.role !== 'admin') throw new ApiError(403, 'FORBIDDEN', 'Solo un administrador borra sugerencias')
    const id = Number.parseInt(req.params.id, 10)
    await query('DELETE FROM establishment_suggestions WHERE id = ?', [id])
    await query(
      `INSERT INTO audit_log (admin_user_id, action, entity_type, entity_id, ip_address)
       VALUES (?, 'delete', 'suggestion', ?, ?)`,
      [req.admin.id, id, (req.ip ?? '').slice(0, 45) || null],
    )
    res.status(204).end()
  }),
)

export default router
