import { createHash, randomBytes } from 'node:crypto'
import { query, queryOne } from './db.js'
import { getMailSettings, renderEmail, sendMail, trySendMail } from './mailer.js'

const BRAND = 'Turismo Gramalote'

export function resetTokenHash(token) {
  return createHash('sha256').update(token).digest('hex')
}

// Crea un enlace de un solo uso. Devuelve el token original: es la única vez
// que existe en claro; en la base solo queda su hash.
export async function createResetToken(userId, { createdBy = null, hours = 1 } = {}) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)
  // Un solo enlace vigente por usuario.
  await query(
    'UPDATE admin_password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL',
    [userId],
  )
  await query(
    `INSERT INTO admin_password_resets (user_id, token_hash, expires_at, created_by)
     VALUES (?, ?, ?, ?)`,
    [userId, resetTokenHash(token), expiresAt, createdBy],
  )
  return { token, path: `/restablecer?token=${token}`, expiresAt: expiresAt.toISOString() }
}

function formatExpiry(iso) {
  return new Date(iso).toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// reason: 'forgot' (lo pidió la persona), 'admin' (lo generó un admin) o
// 'invite' (cuenta nueva). Lanza si el envío falla.
export async function sendResetEmail(user, reset, reason = 'admin') {
  const settings = await getMailSettings()
  const url = `${settings.siteUrl}${reset.path}`
  const first = (user.name ?? '').split(' ')[0] || 'Hola'
  const copy = {
    forgot: {
      subject: 'Restablece tu contraseña del panel',
      title: 'Crea una contraseña nueva',
      lead: `Recibimos una solicitud para restablecer la contraseña de tu cuenta del panel de ${BRAND}.`,
      label: 'Crear contraseña nueva',
      footer: 'Si no lo pediste, ignora este correo: tu contraseña actual sigue funcionando.',
    },
    admin: {
      subject: 'Enlace para cambiar tu contraseña del panel',
      title: 'Crea una contraseña nueva',
      lead: `Un administrador generó un enlace para que definas una contraseña nueva en el panel de ${BRAND}.`,
      label: 'Crear contraseña nueva',
      footer: 'Si no esperabas este correo, avisa a un administrador del sitio.',
    },
    invite: {
      subject: `Te dieron acceso al panel de ${BRAND}`,
      title: 'Bienvenido/a al panel',
      lead: `Te crearon una cuenta en el panel de ${BRAND}. Para entrar, primero define tu contraseña.`,
      label: 'Definir mi contraseña',
      footer: 'Después podrás entrar en /acceder con este correo y tu contraseña.',
    },
  }[reason]

  const { html, text } = renderEmail({
    title: copy.title,
    paragraphs: [
      `${first}:`,
      copy.lead,
      `El enlace funciona una sola vez y vence el ${formatExpiry(reset.expiresAt)}.`,
    ],
    action: { label: copy.label, url },
    footer: copy.footer,
  })
  await sendMail({ to: user.email, subject: copy.subject, html, text, kind: `password_${reason}` })
}

// Aviso de seguridad tras cambiar la contraseña. No bloquea ni lanza.
export function sendPasswordChangedEmail(userId) {
  ;(async () => {
    const user = await queryOne('SELECT name, email FROM admin_users WHERE id = ?', [userId])
    if (!user) return
    const settings = await getMailSettings()
    const { html, text } = renderEmail({
      title: 'Tu contraseña cambió',
      paragraphs: [
        `${(user.name ?? '').split(' ')[0] || 'Hola'}:`,
        `La contraseña de tu cuenta del panel de ${BRAND} se acaba de cambiar.`,
        'Si fuiste tú, no tienes que hacer nada. Si no, pide de inmediato un enlace nuevo desde «¿Olvidaste tu contraseña?» y avisa a un administrador.',
      ],
      action: { label: 'Ir al panel', url: `${settings.siteUrl}/acceder` },
    })
    await trySendMail({ to: user.email, subject: 'Tu contraseña del panel cambió', html, text, kind: 'password_changed' })
  })().catch((failure) => console.error('[mail] aviso de contraseña:', failure.message))
}

// Aviso de cambio de correo: se envía al correo anterior y al nuevo. No bloquea
// ni lanza; el cambio ya quedó guardado en la base.
export function sendEmailChangedNotice(user, newEmail) {
  ;(async () => {
    const first = (user.name ?? '').split(' ')[0] || 'Hola'

    const oldCopy = renderEmail({
      title: 'El correo de tu cuenta cambió',
      paragraphs: [
        `${first}:`,
        `El correo de tu cuenta del panel de ${BRAND} cambió a ${newEmail}. Desde ahora entras con ese correo.`,
        'Si no fuiste tú ni un administrador, avisa de inmediato a un administrador del sitio.',
      ],
    })

    const newCopy = renderEmail({
      title: 'Este es ahora el correo de tu cuenta',
      paragraphs: [
        `${first}:`,
        `Este correo (${newEmail}) es ahora el correo de acceso de tu cuenta en el panel de ${BRAND}.`,
        'Desde ahora inicia sesión con este correo y tu contraseña. Si no esperabas este mensaje, puedes ignorarlo.',
      ],
      footer: 'Por seguridad, este aviso se envió también al correo anterior de la cuenta.',
    })

    await Promise.all([
      trySendMail({
        to: user.email,
        subject: 'El correo de tu cuenta del panel cambió',
        html: oldCopy.html,
        text: oldCopy.text,
        kind: 'email_changed',
      }),
      trySendMail({
        to: newEmail,
        subject: `Confirmamos tu nuevo correo · ${BRAND}`,
        html: newCopy.html,
        text: newCopy.text,
        kind: 'email_changed_new',
      }),
    ])
  })().catch((failure) => console.error('[mail] aviso de correo:', failure.message))
}
