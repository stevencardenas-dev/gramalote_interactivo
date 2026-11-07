import { useCallback, useEffect, useState } from 'react'
import { apiRequest, changePassword, ensureSession, getUser } from '../lib/auth.js'

const ROLE_LABEL = { admin: 'Administrador', editor: 'Editor' }

function formatDate(value) {
  if (!value) return 'Nunca'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fullLink(reset) {
  return `${window.location.origin}${reset.path}`
}

export default function AdminUsuarios() {
  const me = getUser()
  const isAdmin = me?.role === 'admin'
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(isAdmin)
  const [error, setError] = useState('')
  const [links, setLinks] = useState({})
  const [form, setForm] = useState({ name: '', email: '', role: 'editor' })
  const [busy, setBusy] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', next: '' })
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordErr, setPasswordErr] = useState('')

  const load = useCallback(async () => {
    try {
      setUsers((await apiRequest('/admin/users')) ?? [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    ensureSession().then((session) => {
      if (session) load()
    })
  }, [isAdmin, load])

  async function run(action) {
    setBusy(true)
    setError('')
    try {
      await action()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function createUser(event) {
    event.preventDefault()
    run(async () => {
      const data = await apiRequest('/admin/users', { method: 'POST', body: form })
      setLinks((current) => ({ ...current, [data.user.id]: data.reset }))
      setForm({ name: '', email: '', role: 'editor' })
      setShowNew(false)
    })
  }

  function patchUser(user, changes) {
    run(() => apiRequest(`/admin/users/${user.id}`, { method: 'PATCH', body: changes }))
  }

  function makeLink(user) {
    run(async () => {
      const reset = await apiRequest(`/admin/users/${user.id}/reset-link`, { method: 'POST' })
      setLinks((current) => ({ ...current, [user.id]: reset }))
    })
  }

  async function submitPassword(event) {
    event.preventDefault()
    setPasswordMsg('')
    setPasswordErr('')
    try {
      await changePassword(passwords.current, passwords.next)
      setPasswords({ current: '', next: '' })
      setPasswordMsg('Contraseña actualizada.')
    } catch (err) {
      setPasswordErr(err.message)
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-wrap">
        <div className="admin-bar">
          <h1>Usuarios</h1>
          <p className="admin-lead admin-bar__lead">
            Los administradores publican y gestionan cuentas; los editores solo editan fichas.
          </p>
          {isAdmin ? (
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={() => setShowNew((open) => !open)}
              aria-expanded={showNew}
            >
              {showNew ? 'Cerrar' : '+ Agregar usuario'}
            </button>
          ) : null}
        </div>

        {error ? <p className="auth-error">{error}</p> : null}

        {isAdmin && showNew ? (
          <form className="admin-new admin-new--users" onSubmit={createUser}>
            <div className="field">
              <label htmlFor="user-name">Nombre</label>
              <input
                id="user-name"
                required
                autoFocus
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="user-email">Correo</label>
              <input
                id="user-email"
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="user-role">Rol</label>
              <select
                id="user-role"
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
              >
                <option value="editor">Editor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
              Crear y generar enlace
            </button>
          </form>
        ) : null}

        {isAdmin ? (
          loading ? (
            <p className="note">Cargando…</p>
          ) : (
            <ul className="admin-rows admin-urows">
              {users.map((user) => {
                const isMe = user.id === me?.id
                const link = links[user.id]
                return (
                  <li key={user.id} className={`admin-urow${user.isActive ? '' : ' is-off'}`}>
                    <span className="admin-urow__avatar" aria-hidden="true">
                      {(user.name || user.email).trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="admin-urow__main">
                      <strong>
                        {user.name}
                        {isMe ? ' (tú)' : ''}
                      </strong>
                      <small>
                        {user.email} · ingresó {formatDate(user.lastLoginAt)}
                      </small>
                    </div>
                    <div className="admin-urow__status">
                      {user.isActive ? null : (
                        <span className="admin-badge admin-badge--draft">Desactivado</span>
                      )}
                      {user.resetRequestedAt ? (
                        <span
                          className="admin-badge admin-badge--draft"
                          title={`Pidió restablecer la contraseña el ${formatDate(user.resetRequestedAt)}`}
                        >
                          Pidió nueva contraseña
                        </span>
                      ) : null}
                    </div>
                    <select
                      aria-label={`Rol de ${user.name}`}
                      value={user.role}
                      disabled={busy || isMe}
                      onChange={(event) => patchUser(user, { role: event.target.value })}
                    >
                      <option value="editor">{ROLE_LABEL.editor}</option>
                      <option value="admin">{ROLE_LABEL.admin}</option>
                    </select>
                    <div className="admin-urow__actions">
                      <button
                        type="button"
                        className="admin-btn"
                        disabled={busy}
                        onClick={() => makeLink(user)}
                      >
                        Enlace de contraseña
                      </button>
                      <button
                        type="button"
                        className={`admin-btn${user.isActive ? ' admin-btn--danger-outline' : ''}`}
                        disabled={busy || isMe}
                        onClick={() => patchUser(user, { isActive: !user.isActive })}
                      >
                        {user.isActive ? 'Desactivar' : 'Reactivar'}
                      </button>
                    </div>
                    {link ? (
                      <div className="admin-link-box">
                        Entrega este enlace a {user.name}. Funciona una sola vez y vence el{' '}
                        {formatDate(link.expiresAt)}; no se vuelve a mostrar.
                        <code>{fullLink(link)}</code>
                        <button
                          type="button"
                          className="admin-btn admin-btn--accent"
                          onClick={() => navigator.clipboard?.writeText(fullLink(link))}
                        >
                          Copiar enlace
                        </button>
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )
        ) : null}

        <details className="admin-details">
          <summary>Cambiar mi contraseña</summary>
          <form className="admin-password" onSubmit={submitPassword}>
            {passwordErr ? <p className="auth-error">{passwordErr}</p> : null}
            {passwordMsg ? (
              <p className="admin-notice" role="status">
                {passwordMsg}
              </p>
            ) : null}
            <div className="field">
              <label htmlFor="current-password">Contraseña actual</label>
              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                required
                value={passwords.current}
                onChange={(event) => setPasswords({ ...passwords, current: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="next-password">Nueva (mínimo 8 caracteres)</label>
              <input
                id="next-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={passwords.next}
                onChange={(event) => setPasswords({ ...passwords, next: event.target.value })}
              />
            </div>
            <button type="submit" className="admin-btn admin-btn--primary">
              Guardar contraseña
            </button>
          </form>
        </details>
      </div>
    </section>
  )
}
