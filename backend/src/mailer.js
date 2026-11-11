// Correo saliente del sitio (Gmail u otro SMTP). La configuración vive en la
// tabla mail_settings y se edita en Panel › Correo; aquí se lee con una caché
// corta para no consultar la base en cada envío.
import nodemailer from 'nodemailer'
import { config } from './config.js'
import { query, queryOne } from './db.js'
import { open } from './secret-box.js'

const CACHE_MS = 60 * 1000
let cache = null

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function invalidateMailSettings() {
  cache = null
}

function defaultSiteUrl() {
  const fromEnv = (process.env.PUBLIC_SITE_URL ?? '').trim()
  if (fromEnv) return fromEnv
  return config.corsOrigins.find((origin) => origin.startsWith('https://')) ?? config.corsOrigins[0] ?? ''
}

export async function getMailSettings() {
  if (cache && cache.at > Date.now() - CACHE_MS) return cache.value
  const row = await queryOne('SELECT * FROM mail_settings WHERE id = 1')
  const value = {
    enabled: Boolean(row?.enabled),
    fromEmail: row?.from_email ?? '',
    fromName: row?.from_name ?? 'Gramalote Interactivo',
    host: row?.smtp_host ?? 'smtp.gmail.com',
    port: Number(row?.smtp_port ?? 465),
    secure: row ? Boolean(row.smtp_secure) : true,
    user: row?.smtp_user ?? '',
    password: open(row?.smtp_password_enc),
    hasPassword: Boolean(row?.smtp_password_enc),
    passwordUnreadable: Boolean(row?.smtp_password_enc) && !open(row?.smtp_password_enc),
    replyTo: row?.reply_to ?? '',
    notifyEmail: row?.notify_email ?? '',
    siteUrl: (row?.site_url || defaultSiteUrl()).replace(/\/$/, ''),
    ratingConfirmation: row ? Boolean(row.rating_confirmation) : true,
    updatedAt: row?.updated_at ?? null,
  }
  cache = { at: Date.now(), value }
  return value
}

// Listo para enviar: activado y con remitente, usuario y contraseña legibles.
export function mailReady(settings) {
  return Boolean(settings.enabled && settings.fromEmail && settings.user && settings.password && settings.host)
}

export async function isMailReady() {
  return mailReady(await getMailSettings())
}

export function notifyList(settings) {
  return settings.notifyEmail
    .split(',')
    .map((item) => item.trim())
    .filter((item) => EMAIL.test(item))
}

function transportFor(settings) {
  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    auth: { user: settings.user, pass: settings.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  })
}

async function logMail(kind, to, subject, status, error = null) {
  try {
    await query('INSERT INTO mail_log (kind, to_email, subject, status, error) VALUES (?, ?, ?, ?, ?)', [
      kind,
      String(to).slice(0, 500),
      String(subject).slice(0, 255),
      status,
      error ? String(error).slice(0, 500) : null,
    ])
    // Solo se guardan los últimos 500 envíos.
    await query(
      `DELETE FROM mail_log WHERE id < (SELECT min_id FROM (
         SELECT id AS min_id FROM mail_log ORDER BY id DESC LIMIT 1 OFFSET 499) AS t)`,
    )
  } catch (failure) {
    console.error('[mail] no se pudo registrar el envío', failure.message)
  }
}

// Envía un correo. Lanza si falla; `settings` permite probar una configuración
// antes de guardarla.
export async function sendMail({ to, subject, text, html, kind = 'general', replyTo, settings: override }) {
  const settings = override ?? (await getMailSettings())
  if (!override && !mailReady(settings)) {
    const error = new Error('El correo saliente no está configurado')
    error.code = 'MAIL_DISABLED'
    throw error
  }
  try {
    const info = await transportFor(settings).sendMail({
      from: { name: settings.fromName || 'Gramalote Interactivo', address: settings.fromEmail },
      to,
      replyTo: replyTo || settings.replyTo || undefined,
      subject,
      text,
      html,
    })
    await logMail(kind, Array.isArray(to) ? to.join(', ') : to, subject, 'sent')
    return info
  } catch (failure) {
    await logMail(kind, Array.isArray(to) ? to.join(', ') : to, subject, 'failed', failure.message)
    const error = new Error(friendlySmtpError(failure))
    error.code = 'MAIL_FAILED'
    error.cause = failure
    throw error
  }
}

// Igual que sendMail pero nunca lanza: para avisos que no deben romper la
// respuesta (p. ej. «tu contraseña cambió»).
export async function trySendMail(message) {
  try {
    if (!(await isMailReady())) return false
    await sendMail(message)
    return true
  } catch (failure) {
    console.error(`[mail] ${message.kind ?? 'general'}:`, failure.message)
    return false
  }
}

export function friendlySmtpError(failure) {
  const message = String(failure?.message ?? '')
  if (failure?.code === 'EAUTH' || /535|Username and Password not accepted|BadCredentials/i.test(message)) {
    return 'Gmail rechazó el usuario o la contraseña. Usa una «contraseña de aplicación» de 16 letras (requiere verificación en dos pasos), no la contraseña normal de la cuenta.'
  }
  if (['ETIMEDOUT', 'ECONNECTION', 'ESOCKET', 'ECONNREFUSED'].includes(failure?.code)) {
    return 'No se pudo conectar con el servidor SMTP (revisa servidor, puerto y si el servidor permite salir por ese puerto).'
  }
  return `El servidor de correo respondió: ${message.slice(0, 200)}`
}

// ---------------------------------------------------------------------------
// Plantilla HTML sencilla y con estilos en línea (los clientes de correo
// ignoran las hojas de estilo).
// ---------------------------------------------------------------------------

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

// paragraphs: textos planos (se escapan). action: { label, url }. rows: [[k, v]].
export function renderEmail({ title, paragraphs = [], action = null, rows = [], footer = '' }) {
  const body = paragraphs
    .map((text) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#2b2b2b">${escapeHtml(text)}</p>`)
    .join('')
  const table = rows.length
    ? `<table role="presentation" style="width:100%;border-collapse:collapse;margin:4px 0 18px;font-size:14px">${rows
        .map(
          ([label, value]) =>
            `<tr><td style="padding:6px 10px 6px 0;color:#6b6b6b;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:6px 0;color:#2b2b2b">${escapeHtml(value || '—')}</td></tr>`,
        )
        .join('')}</table>`
    : ''
  const button = action
    ? `<p style="margin:22px 0"><a href="${escapeHtml(action.url)}" style="display:inline-block;background:#00426b;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px;font-size:15px">${escapeHtml(action.label)}</a></p>
       <p style="margin:0 0 14px;font-size:12px;line-height:1.5;color:#8a8a8a">Si el botón no funciona, copia este enlace en el navegador:<br><span style="word-break:break-all">${escapeHtml(action.url)}</span></p>`
    : ''
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f4f1ea;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;width:100%;border-collapse:separate">
<tr><td style="padding:22px 28px 8px;border-bottom:3px solid #00426b"><strong style="font-size:17px;color:#00426b">Gramalote Interactivo</strong></td></tr>
<tr><td style="padding:22px 28px 12px">
<h1 style="margin:0 0 16px;font-size:21px;color:#1d1d1d">${escapeHtml(title)}</h1>
${body}${table}${button}
</td></tr>
<tr><td style="padding:14px 28px 22px;font-size:12px;color:#8a8a8a;border-top:1px solid #eee">${escapeHtml(footer || 'Este correo lo envió automáticamente Gramalote Interactivo.')}</td></tr>
</table></body></html>`

  const text = [
    title,
    '',
    ...paragraphs.flatMap((paragraph) => [paragraph, '']),
    ...rows.map(([label, value]) => `${label}: ${value || '—'}`),
    ...(rows.length ? [''] : []),
    ...(action ? [`${action.label}: ${action.url}`, ''] : []),
    footer || 'Este correo lo envió automáticamente Gramalote Interactivo.',
  ].join('\n')

  return { html, text }
}
