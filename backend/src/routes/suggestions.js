// Sugerencias de establecimientos nuevos. Los visitantes llenan el formulario
// de /sugerir; aquí se validan, se guardan, se avisa por correo al equipo y se
// agradece a quien sugirió. El panel las revisa en Sugerencias.
import { Router } from 'express'
import { createHash, randomBytes } from 'node:crypto'
import { requireAuth } from '../auth.js'
import { query, queryOne } from '../db.js'
import { ApiError, asyncHandler, stringParam } from '../http.js'
import { EMAIL, getMailSettings, mailReady, notifyList, renderEmail, trySendMail } from '../mailer.js'
import { clientIp, consume, limitByIp } from '../rate-limit.js'
import { parseJson } from '../serializers.js'

const router = Router()
const STATUSES = ['nueva', 'revisada', 'agregada', 'descartada']
const HOUR = 60 * 60 * 1000
const CONFIRM_HOURS = 48
const tokenHashOf = (token) => createHash('sha256').update(token).digest('hex')

// Mismas opciones que muestra el formulario del sitio.
export const SUGGESTION_TYPES = [
  'Dónde comer',
  'Dónde dormir',
  'Dónde comprar',
  'Dónde ir',
  'Experiencia o actividad',
  'Patrimonio',
  'Extras',
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
    emailVerified: Boolean(item.email_verified_at),
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

// Filas del aviso al equipo (mismas claves que la tabla).
function suggestionRows(item) {
  return [
    ['Lugar', item.business_name],
    ['Tipo', item.business_type],
    ['Ubicación', item.address],
    ['Teléfono', item.phone],
    ['Redes / web', item.links],
    ['¿Tiene relación?', item.is_owner],
    ['Sugerido por', [item.suggester_name, item.suggester_email].filter(Boolean).join(' · ')],
    ['Por qué', item.reason],
  ]
}

// La sugerencia «cuenta» aquí: avisa al equipo y, si toca, agradece. Se llama
// cuando entra sin correo o cuando la persona confirma el suyo; con el correo
// sin confirmar no se envía nada, para que el paso de verificación sirva de
// algo (el panel la guarda en «Sin confirmar» mientras tanto).
function deliver(settings, item, { thanks }) {
  const team = notifyList(settings)
  if (team.length) {
    const { html, text } = renderEmail({
      title: `Nueva sugerencia: ${item.business_name}`,
      paragraphs: ['Llegó una sugerencia de lugar desde el sitio.'],
      rows: suggestionRows(item),
      action: { label: 'Revisar en el panel', url: `${settings.siteUrl}/admin/lugares/sugerencias` },
    })
    trySendMail({
      to: team,
      subject: `Nueva sugerencia: ${item.business_name}`,
      html,
      text,
      kind: 'suggestion_notify',
      replyTo: item.suggester_email ?? undefined,
    })
  }
  if (thanks && item.suggester_email) {
    const { html, text } = renderEmail({
      title: '¡Gracias por tu sugerencia!',
      paragraphs: [
        `${(item.suggester_name ?? '').split(' ')[0] || 'Hola'}:`,
        `Recibimos tu sugerencia de «${item.business_name}». El equipo de Turismo Gramalote la revisará y, si cumple con lo necesario, la agregaremos al sitio.`,
      ],
      action: { label: 'Seguir explorando Gramalote', url: settings.siteUrl },
    })
    trySendMail({
      to: item.suggester_email,
      subject: 'Recibimos tu sugerencia · Turismo Gramalote',
      html,
      text,
      kind: 'suggestion_thanks',
    })
  }
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
    // Los tipos son los mismos grupos del panel: Dónde ir/comer/dormir/comprar,
    // experiencias, patrimonio y extras.
    if (!SUGGESTION_TYPES.includes(businessType)) {
      throw new ApiError(400, 'VALIDATION', 'Tipo de lugar: elige una de las opciones')
    }
    const isOwner = field(body, 'esDueno', '¿Eres el dueño?', { max: 10 })
    if (isOwner && !OWNER.includes(isOwner)) throw new ApiError(400, 'VALIDATION', '¿Eres el dueño?: responde Sí o No')
    const email = field(body, 'correo', 'Tu correo', { max: 190 })?.toLowerCase() ?? null
    if (email && !EMAIL.test(email)) throw new ApiError(400, 'VALIDATION', 'Tu correo: escribe un correo válido')

    const fields = {
      source: 'web',
      business_name: field(body, 'nombre', 'Nombre del lugar', { max: 190, required: true, min: 2 }),
      business_type: businessType,
      address: field(body, 'direccion', 'Ubicación', { max: 500 }),
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

    // Primera vez con este correo: se le pide confirmarlo antes de escribirle.
    // El correo que ya confirmó una calificación o una sugerencia no repite el
    // paso; su sugerencia entra igual y solo cambia si le llega el enlace.
    const mailSettings = await getMailSettings()
    const canMail = mailReady(mailSettings)
    let verified = true
    if (email && canMail) {
      const known = await queryOne(
        `SELECT 1 AS ok FROM ratings WHERE voter_email = ? AND status = 'confirmed'
         UNION ALL
         SELECT 1 AS ok FROM establishment_suggestions
          WHERE suggester_email = ? AND email_verified_at IS NOT NULL
         LIMIT 1`,
        [email, email],
      )
      verified = Boolean(known)
    }
    const token = email && canMail && !verified ? randomBytes(32).toString('hex') : null
    if (token) {
      fields.confirm_token_hash = tokenHashOf(token)
      fields.confirm_expires_at = new Date(Date.now() + CONFIRM_HOURS * HOUR)
    }

    const columns = Object.keys(fields)
    const result = await query(
      `INSERT INTO establishment_suggestions (${columns.join(', ')})
       VALUES (${columns.map(() => '?').join(', ')})`,
      columns.map((column) => fields[column]),
    )

    const settings = mailSettings
    if (token) {
      // Sin confirmar no se avisa al equipo ni se agradece: la sugerencia queda
      // en «Sin confirmar» del panel hasta que la persona abra el enlace.
      const url = `${settings.siteUrl}/confirmar-sugerencia?token=${token}`
      const { html, text } = renderEmail({
        title: 'Confirma tu correo para enviar tu sugerencia',
        paragraphs: [
          `${(fields.suggester_name ?? '').split(' ')[0] || 'Hola'}:`,
          `Guardamos tu sugerencia de «${fields.business_name}», pero todavía no le llega al equipo: confirma que este correo es tuyo con el botón y la enviamos.`,
          `Solo hace falta la primera vez; después, tus sugerencias con este correo se envían sin este paso. El enlace vence en ${CONFIRM_HOURS} horas.`,
        ],
        action: { label: 'Confirmar y enviar', url },
        footer: 'Si no enviaste ninguna sugerencia, ignora este correo: sin confirmar no le llega a nadie.',
      })
      trySendMail({
        to: fields.suggester_email,
        subject: 'Confirma tu correo para enviar tu sugerencia · Turismo Gramalote',
        html,
        text,
        kind: 'suggestion_confirm',
      })
    } else {
      deliver(settings, fields, { thanks: thank })
    }

    res.status(201).json({ data: { ok: true, id: Number(result.insertId), pending: Boolean(token) } })
  }),
)

// Abre el enlace del correo: el correo queda verificado y se manda el gracias.
router.post(
  '/suggestions/confirm',
  limitByIp('suggestion-confirm', [{ windowMs: HOUR, max: 30 }]),
  asyncHandler(async (req, res) => {
    const token = stringParam(req.body?.token, { max: 128 })
    if (!token) throw new ApiError(400, 'VALIDATION', 'Falta el enlace de confirmación')
    const row = await queryOne('SELECT * FROM establishment_suggestions WHERE confirm_token_hash = ?', [
      tokenHashOf(token),
    ])
    if (!row || !row.confirm_expires_at || new Date(row.confirm_expires_at).getTime() <= Date.now()) {
      throw new ApiError(400, 'INVALID_TOKEN', 'El enlace no es válido o ya venció. Envía otra sugerencia para recibir uno nuevo.')
    }
    await query(
      `UPDATE establishment_suggestions
          SET email_verified_at = NOW(), confirm_token_hash = NULL, confirm_expires_at = NULL
        WHERE id = ?`,
      [row.id],
    )

    // Ahora sí: el correo está verificado y la sugerencia le llega al equipo.
    const settings = await getMailSettings()
    deliver(settings, row, { thanks: true })

    res.json({ data: { ok: true, name: row.business_name } })
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

// Borrado en bloque: todas las sugerencias o solo las de un estado. Sirve para
// cuando se acumulan (una tanda de spam, pruebas) sin borrarlas una por una.
router.delete(
  '/admin/suggestions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const status = STATUSES.includes(req.query.status) ? req.query.status : null
    // `pending=1`: las que tienen correo sin confirmar (las de «Sin confirmar»).
    const pending = req.query.pending === '1'
    const where = pending
      ? ' WHERE suggester_email IS NOT NULL AND email_verified_at IS NULL'
      : status
        ? ' WHERE status = ?'
        : ''
    const result = await query(
      `DELETE FROM establishment_suggestions${where}`,
      status && !pending ? [status] : [],
    )
    await query(
      `INSERT INTO audit_log (admin_user_id, action, entity_type, entity_id, changes, ip_address)
       VALUES (?, 'delete', 'suggestion', NULL, ?, ?)`,
      [
        req.admin.id,
        JSON.stringify({ status: pending ? 'sin-confirmar' : status ?? 'todas', deleted: result.affectedRows }),
        clientIp(req),
      ],
    )
    res.json({ data: { deleted: Number(result.affectedRows ?? 0) } })
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
