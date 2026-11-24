import { useCallback, useEffect, useState } from 'react'
import AdminSection from '../components/admin/AdminSection.jsx'
import { useAdminToast } from '../lib/useAdminToast.jsx'
import { useUnsavedChanges } from '../lib/useUnsavedChanges.js'
import { apiRequest, ensureSession, getUser } from '../lib/auth.js'

// Panel › Correo (solo administradores): la cuenta de Gmail que envía los
// correos del sitio (restablecer contraseña, invitaciones, confirmar
// calificaciones, avisos de sugerencias).

const KIND_LABEL = {
  test: 'Prueba',
  password_forgot: 'Restablecer contraseña',
  password_admin: 'Enlace de contraseña',
  password_invite: 'Invitación al panel',
  password_changed: 'Aviso: contraseña cambiada',
  email_changed: 'Aviso: correo cambiado (anterior)',
  email_changed_new: 'Aviso: correo cambiado (nuevo)',
  rating_confirm: 'Confirmar calificación',
  suggestion_notify: 'Aviso de sugerencia',
  suggestion_thanks: 'Gracias por sugerir',
  suggestion_confirm: 'Confirma tu correo (sugerencias)',
}

const EMPTY = {
  fromEmail: '',
  fromName: 'Turismo Gramalote',
  user: '',
  password: '',
  host: 'smtp.gmail.com',
  port: 465,
  replyTo: '',
  notifyEmail: '',
  siteUrl: '',
  ratingConfirmation: true,
}

function formatStamp(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function formFrom(data) {
  return {
    fromEmail: data.fromEmail ?? '',
    fromName: data.fromName ?? '',
    user: data.user ?? '',
    password: '',
    host: data.host ?? 'smtp.gmail.com',
    port: data.port ?? 465,
    replyTo: data.replyTo ?? '',
    notifyEmail: data.notifyEmail ?? '',
    siteUrl: data.siteUrl ?? '',
    ratingConfirmation: data.ratingConfirmation,
  }
}

export default function AdminCorreo() {
  const me = getUser()
  const isAdmin = me?.role === 'admin'
  const [saved, setSaved] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [log, setLog] = useState([])
  const [busy, setBusy] = useState(false)
  const [testTo, setTestTo] = useState('')
  const { notify, toast } = useAdminToast()
  // Hay cambios si el formulario difiere de lo guardado (la contraseña nunca se lee del
  // servidor, así que escribirla ya cuenta como cambio).
  const dirty = saved !== null && JSON.stringify(form) !== JSON.stringify(formFrom(saved))
  useUnsavedChanges(dirty)

  const load = useCallback(async () => {
    const [settings, entries] = await Promise.all([
      apiRequest('/admin/mail-settings'),
      apiRequest('/admin/mail-log').catch(() => []),
    ])
    setSaved(settings)
    setForm(formFrom(settings))
    setLog(entries ?? [])
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    ensureSession().then((session) => {
      if (session) load().catch((err) => notify('error', 'No se pudo cargar', err.message))
    })
  }, [isAdmin, load, notify])

  const set = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    setForm((current) => {
      const next = { ...current, [key]: value }
      // El usuario SMTP de Gmail es el mismo correo: se copia mientras coincidan.
      if (key === 'fromEmail' && (!current.user || current.user === current.fromEmail)) next.user = value
      return next
    })
  }

  function body() {
    const port = Number(form.port)
    return { ...form, port, secure: port === 465 }
  }

  async function save(event) {
    event.preventDefault()
    setBusy(true)
    try {
      const data = await apiRequest('/admin/mail-settings', { method: 'PUT', body: body() })
      setSaved(data)
      setForm(formFrom(data))
      notify('ok', 'Configuración guardada', data.ready ? 'El sitio ya envía correos.' : 'Faltan datos para enviar correos.')
    } catch (err) {
      notify('error', 'No se pudo guardar', err.message)
    } finally {
      setBusy(false)
    }
  }

  async function sendTest() {
    setBusy(true)
    try {
      const data = await apiRequest('/admin/mail-settings/test', {
        method: 'POST',
        body: { to: testTo.trim() || undefined, draft: body() },
      })
      notify('ok', 'Correo de prueba enviado', `Revisa la bandeja de ${data.to} (y la carpeta de spam).`)
    } catch (err) {
      notify('error', 'La prueba falló', err.message)
    } finally {
      setBusy(false)
      apiRequest('/admin/mail-log').then((entries) => setLog(entries ?? [])).catch(() => {})
    }
  }

  if (!isAdmin) {
    return (
      <section className="admin-page">
        <div className="admin-wrap">
          <h1>Correo</h1>
          <p className="auth-error" role="alert">Solo un administrador puede configurar el correo del sitio.</p>
        </div>
      </section>
    )
  }

  const gmail = form.host.trim().toLowerCase() === 'smtp.gmail.com'

  return (
    <section className="admin-page">
      <div className="admin-wrap">
        <div className="admin-bar">
          <h1>Correo</h1>
          <p className="admin-lead admin-bar__lead">
            Cuenta que envía los correos del sitio: restablecer contraseñas, invitaciones al panel,
            confirmación de calificaciones y avisos de sugerencias.
          </p>
        </div>

        {!saved ? (
          <p className="note">Cargando…</p>
        ) : (
          <form className="admin-mail" onSubmit={save}>
            <div className="admin-mail__actions admin-mail__actions--top">
              <button type="submit" className="admin-btn admin-btn--primary" disabled={busy || !dirty}>
                {busy ? 'Guardando…' : dirty ? 'Guardar cambios' : 'Sin cambios'}
              </button>
              <span className="admin-mail__state">
                {dirty ? 'Hay cambios sin guardar.' : 'Los datos del formulario están guardados.'}
              </span>
            </div>

            {saved.passwordUnreadable ? (
              <p className="auth-error" role="alert">
                La contraseña guardada no se puede leer (cambió la llave del servidor). Escríbela de nuevo.
              </p>
            ) : null}

            <AdminSection title="Cuenta de envío" hint="Remitente y acceso SMTP">
              <div className="admin-grid">
                <label className="admin-field">
                  <span>Correo remitente</span>
                  <input type="email" value={form.fromEmail} onChange={set('fromEmail')} placeholder="cuenta@gmail.com" />
                </label>
                <label className="admin-field">
                  <span>Nombre que verá quien recibe</span>
                  <input value={form.fromName} onChange={set('fromName')} maxLength={120} />
                </label>
                <label className="admin-field">
                  <span>Contraseña de aplicación</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={set('password')}
                    placeholder={saved.hasPassword ? '•••• guardada (escribe para cambiarla)' : 'xxxx xxxx xxxx xxxx'}
                  />
                  <small>No es la contraseña normal de la cuenta. Nunca se muestra después de guardarla.</small>
                </label>
                <label className="admin-field">
                  <span>Responder a (opcional)</span>
                  <input type="email" value={form.replyTo} onChange={set('replyTo')} placeholder="Si las respuestas deben ir a otro correo" />
                </label>
              </div>
              {gmail ? (
                <div className="admin-mail__help">
                  <strong>Cómo sacar la contraseña de aplicación de Gmail</strong>
                  <ol>
                    <li>
                      Entra con la cuenta remitente a{' '}
                      <span className="admin-mail__mark">Verificación en dos pasos</span>{' '}
                      y actívala (Google lo exige).
                    </li>
                    <li>
                      Abre{' '}
                      <span className="admin-mail__mark">Contraseñas de aplicaciones</span>, escribe «Gramalote» y pulsa Crear.
                    </li>
                    <li>Copia las 16 letras aquí (con o sin espacios), guarda y envía una prueba.</li>
                  </ol>
                </div>
              ) : null}
              <AdminSection title="Servidor SMTP" hint="Otro proveedor">
                <div className="admin-grid">
                  <label className="admin-field">
                    <span>Servidor</span>
                    <input value={form.host} onChange={set('host')} />
                  </label>
                  <label className="admin-field">
                    <span>Puerto</span>
                    <select value={form.port} onChange={set('port')}>
                      <option value={465}>465 (SSL)</option>
                      <option value={587}>587 (STARTTLS)</option>
                    </select>
                  </label>
                  <label className="admin-field">
                    <span>Usuario SMTP</span>
                    <input value={form.user} onChange={set('user')} />
                    <small>En Gmail es el mismo correo remitente.</small>
                  </label>
                </div>
              </AdminSection>
            </AdminSection>

            <AdminSection title="Avisos y enlaces" hint="Quién recibe los avisos internos">
              <div className="admin-grid">
                <label className="admin-field">
                  <span>Correos del equipo</span>
                  <input value={form.notifyEmail} onChange={set('notifyEmail')} placeholder="uno@correo.com, otro@correo.com" />
                  <small>Reciben el aviso de cada sugerencia nueva. Varios, separados por coma.</small>
                </label>
                <label className="admin-field">
                  <span>Dirección del sitio</span>
                  <input value={form.siteUrl} onChange={set('siteUrl')} placeholder="https://…" />
                  <small>Base de los enlaces de los correos (restablecer, confirmar…).</small>
                </label>
              </div>
            </AdminSection>

            <AdminSection title="Calificaciones" hint="Confirmación por correo">
              <label className="admin-check">
                <input type="checkbox" checked={form.ratingConfirmation} onChange={set('ratingConfirmation')} />
                Pedir confirmación por correo antes de contar una calificación
              </label>
              <p className="note">
                Quien califica recibe un enlace en el correo que escribió; el voto cuenta solo al abrirlo
                (vence en 48 horas). El comentario, si lo escribe, va en ese mismo correo y se ve en la
                pestaña Calificaciones de la ficha. Sin correo activo, los votos cuentan de inmediato.
              </p>
            </AdminSection>

          </form>
        )}

        {log.length ? (
          <AdminSection title="Últimos envíos" hint={`${log.length} registros`}>
            <div className="admin-ratings__table admin-mail__log" role="table" aria-label="Últimos envíos">
              <div className="admin-ratings__row admin-ratings__row--head" role="row">
                <span role="columnheader">Fecha</span>
                <span role="columnheader">Tipo</span>
                <span role="columnheader">Para</span>
                <span role="columnheader">Estado</span>
              </div>
              {log.map((entry) => (
                <div key={entry.id} className="admin-ratings__row" role="row" title={entry.error ?? entry.subject}>
                  <span role="cell">{formatStamp(entry.createdAt)}</span>
                  <span role="cell">{KIND_LABEL[entry.kind] ?? entry.kind}</span>
                  <span role="cell">{entry.to}</span>
                  <span role="cell">
                    <span className={`admin-badge ${entry.status === 'sent' ? 'admin-badge--ok' : 'admin-badge--draft'}`}>
                      {entry.status === 'sent' ? 'Enviado' : 'Falló'}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </AdminSection>
        ) : null}

        {saved ? (
          <AdminSection title="Enviar prueba" hint="Comprueba la cuenta con un correo de prueba">
            <p className="note">
              Usa lo que hay en el formulario, aunque todavía no lo hayas guardado. Si dejas el campo
              vacío, la prueba llega a {me?.email ?? 'tu correo de la cuenta'}.
            </p>
            <div className="admin-mail__test">
              <input
                type="email"
                value={testTo}
                onChange={(event) => setTestTo(event.target.value)}
                placeholder={me?.email ?? 'destinatario'}
                aria-label="Enviar la prueba a"
              />
              <button type="button" className="admin-btn" onClick={sendTest} disabled={busy}>
                {busy ? 'Enviando…' : 'Enviar prueba'}
              </button>
            </div>
          </AdminSection>
        ) : null}
      </div>
      {toast}
    </section>
  )
}
