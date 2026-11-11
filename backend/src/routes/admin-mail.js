// Panel › Correo (solo administradores): cuenta que envía los correos del
// sitio, a quién llegan los avisos internos, la confirmación de calificaciones
// y el formulario de Google de sugerencias.
import { Router } from 'express'
import { randomBytes } from 'node:crypto'
import { requireAuth } from '../auth.js'
import { query } from '../db.js'
import { ApiError, asyncHandler, stringParam } from '../http.js'
import {
  EMAIL,
  getMailSettings,
  invalidateMailSettings,
  mailReady,
  renderEmail,
  sendMail,
} from '../mailer.js'
import { seal } from '../secret-box.js'

const router = Router()
const WEB_URL = /^https?:\/\/[^\s"'<>]+$/i

function requireAdminRole(req, _res, next) {
  if (req.admin?.role !== 'admin') {
    next(new ApiError(403, 'FORBIDDEN', 'Solo un administrador configura el correo'))
    return
  }
  next()
}

function publicView(settings) {
  return {
    enabled: settings.enabled,
    ready: mailReady(settings),
    fromEmail: settings.fromEmail,
    fromName: settings.fromName,
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    user: settings.user,
    hasPassword: settings.hasPassword,
    passwordUnreadable: settings.passwordUnreadable,
    replyTo: settings.replyTo,
    notifyEmail: settings.notifyEmail,
    siteUrl: settings.siteUrl,
    ratingConfirmation: settings.ratingConfirmation,
    formUrl: settings.formUrl,
    // El secreto se muestra al admin: lo necesita para pegarlo en Apps Script.
    formSecret: settings.formSecret,
    webhookUrl: `${settings.siteUrl}/api/suggestions/google-form`,
    updatedAt: settings.updatedAt,
  }
}

function optionalEmail(value, label) {
  const text = stringParam(value, { max: 190 })
  if (!text) return null
  if (!EMAIL.test(text)) throw new ApiError(400, 'VALIDATION', `${label}: escribe un correo válido`)
  return text.toLowerCase()
}

function emailList(value) {
  const text = stringParam(value, { max: 500 })
  if (!text) return null
  const items = text.split(',').map((item) => item.trim()).filter(Boolean)
  const bad = items.find((item) => !EMAIL.test(item))
  if (bad) throw new ApiError(400, 'VALIDATION', `Avisos internos: «${bad}» no es un correo válido`)
  return items.join(', ').toLowerCase()
}

function optionalUrl(value, label) {
  const text = stringParam(value, { max: 500 })
  if (!text) return null
  if (!WEB_URL.test(text)) throw new ApiError(400, 'VALIDATION', `${label}: escribe un enlace que empiece por https://`)
  return text.replace(/\/$/, '')
}

// Valida el cuerpo y devuelve las columnas. password: undefined = no cambiar.
function fieldsFrom(body, current) {
  const port = Number.parseInt(body.port ?? current.port, 10)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ApiError(400, 'VALIDATION', 'Puerto SMTP no válido')
  }
  const fields = {
    enabled: Boolean(body.enabled),
    from_email: optionalEmail(body.fromEmail, 'Correo remitente'),
    from_name: stringParam(body.fromName, { max: 120 }) ?? 'Gramalote Interactivo',
    smtp_host: stringParam(body.host, { max: 190 }) ?? 'smtp.gmail.com',
    smtp_port: port,
    smtp_secure: body.secure === undefined ? port === 465 : Boolean(body.secure),
    smtp_user: stringParam(body.user, { max: 190 }) ?? optionalEmail(body.fromEmail, 'Correo remitente'),
    reply_to: optionalEmail(body.replyTo, 'Responder a'),
    notify_email: emailList(body.notifyEmail),
    site_url: optionalUrl(body.siteUrl, 'URL del sitio'),
    rating_confirmation: body.ratingConfirmation === undefined ? true : Boolean(body.ratingConfirmation),
    form_url: optionalUrl(body.formUrl, 'Enlace del formulario'),
  }
  if (typeof body.password === 'string' && body.password.trim()) {
    // Las contraseñas de aplicación de Google se muestran con espacios.
    fields.smtp_password_enc = seal(body.password.replace(/\s+/g, ''))
  } else if (body.clearPassword) {
    fields.smtp_password_enc = null
  }
  if (fields.enabled && (!fields.from_email || !fields.smtp_user)) {
    throw new ApiError(400, 'VALIDATION', 'Para activar el correo falta el correo remitente')
  }
  if (fields.enabled && !current.hasPassword && !fields.smtp_password_enc) {
    throw new ApiError(400, 'VALIDATION', 'Para activar el correo falta la contraseña de aplicación')
  }
  return fields
}

router.get(
  '/admin/mail-settings',
  requireAuth,
  requireAdminRole,
  asyncHandler(async (_req, res) => {
    invalidateMailSettings()
    res.json({ data: publicView(await getMailSettings()) })
  }),
)

router.put(
  '/admin/mail-settings',
  requireAuth,
  requireAdminRole,
  asyncHandler(async (req, res) => {
    const current = await getMailSettings()
    const fields = fieldsFrom(req.body ?? {}, current)
    const columns = Object.keys(fields)
    await query(
      `INSERT INTO mail_settings (id, ${columns.join(', ')}, updated_by)
       VALUES (1, ${columns.map(() => '?').join(', ')}, ?)
       ON DUPLICATE KEY UPDATE ${columns.map((column) => `${column} = VALUES(${column})`).join(', ')},
         updated_by = VALUES(updated_by)`,
      [...columns.map((column) => fields[column]), req.admin.id],
    )
    const changes = { ...fields }
    if ('smtp_password_enc' in changes) changes.smtp_password_enc = changes.smtp_password_enc ? '(cambiada)' : '(borrada)'
    await query(
      `INSERT INTO audit_log (admin_user_id, action, entity_type, entity_id, changes, ip_address)
       VALUES (?, 'update', 'mail_settings', 1, ?, ?)`,
      [req.admin.id, JSON.stringify(changes), (req.ip ?? '').slice(0, 45) || null],
    )
    invalidateMailSettings()
    res.json({ data: publicView(await getMailSettings()) })
  }),
)

// Envía un correo de prueba con lo guardado (o con lo que está en el
// formulario, sin guardarlo, si viene en el cuerpo).
router.post(
  '/admin/mail-settings/test',
  requireAuth,
  requireAdminRole,
  asyncHandler(async (req, res) => {
    const saved = await getMailSettings()
    const to = optionalEmail(req.body?.to, 'Destinatario') ?? req.admin.email
    let settings = saved
    if (req.body?.draft) {
      const draft = req.body.draft
      const password =
        typeof draft.password === 'string' && draft.password.trim()
          ? draft.password.replace(/\s+/g, '')
          : saved.password
      settings = {
        ...saved,
        fromEmail: optionalEmail(draft.fromEmail, 'Correo remitente') ?? saved.fromEmail,
        fromName: stringParam(draft.fromName, { max: 120 }) ?? saved.fromName,
        host: stringParam(draft.host, { max: 190 }) ?? saved.host,
        port: Number.parseInt(draft.port ?? saved.port, 10),
        secure: draft.secure === undefined ? saved.secure : Boolean(draft.secure),
        user: stringParam(draft.user, { max: 190 }) ?? saved.user,
        password,
        replyTo: optionalEmail(draft.replyTo, 'Responder a') ?? '',
      }
    }
    if (!settings.fromEmail || !settings.user || !settings.password) {
      throw new ApiError(400, 'VALIDATION', 'Falta el correo remitente o la contraseña de aplicación')
    }
    const { html, text } = renderEmail({
      title: 'Correo de prueba',
      paragraphs: [
        'Si lees esto, Gramalote Interactivo ya puede enviar correos desde esta cuenta.',
        `Lo pidió ${req.admin.name ?? req.admin.email} desde el panel.`,
      ],
      rows: [
        ['Remitente', `${settings.fromName} <${settings.fromEmail}>`],
        ['Servidor', `${settings.host}:${settings.port}`],
      ],
    })
    try {
      await sendMail({ to, subject: 'Prueba de correo · Gramalote Interactivo', html, text, kind: 'test', settings })
    } catch (failure) {
      throw new ApiError(502, 'MAIL_FAILED', failure.message)
    }
    res.json({ data: { to } })
  }),
)

// Genera (o cambia) el secreto que Apps Script manda con cada respuesta.
router.post(
  '/admin/mail-settings/form-secret',
  requireAuth,
  requireAdminRole,
  asyncHandler(async (req, res) => {
    const secret = randomBytes(24).toString('hex')
    await query(
      `INSERT INTO mail_settings (id, form_secret_enc, updated_by) VALUES (1, ?, ?)
       ON DUPLICATE KEY UPDATE form_secret_enc = VALUES(form_secret_enc), updated_by = VALUES(updated_by)`,
      [seal(secret), req.admin.id],
    )
    await query(
      `INSERT INTO audit_log (admin_user_id, action, entity_type, entity_id, ip_address)
       VALUES (?, 'regenerate_form_secret', 'mail_settings', 1, ?)`,
      [req.admin.id, (req.ip ?? '').slice(0, 45) || null],
    )
    invalidateMailSettings()
    res.json({ data: publicView(await getMailSettings()) })
  }),
)

router.get(
  '/admin/mail-log',
  requireAuth,
  requireAdminRole,
  asyncHandler(async (_req, res) => {
    const rows = await query(
      'SELECT id, kind, to_email, subject, status, error, created_at FROM mail_log ORDER BY id DESC LIMIT 40',
    )
    res.json({
      data: rows.map((row) => ({
        id: Number(row.id),
        kind: row.kind,
        to: row.to_email,
        subject: row.subject,
        status: row.status,
        error: row.error,
        createdAt: row.created_at,
      })),
    })
  }),
)

export default router
