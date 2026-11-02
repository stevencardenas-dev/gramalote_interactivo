import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
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
      <div className="container">
        <div className="admin-head">
          <div>
            <p className="admin-breadcrumb">
              <Link to="/admin">Panel</Link> / Usuarios
            </p>
            <h1>Usuarios y contraseñas</h1>
            <p className="admin-lead">
              Los administradores publican fichas y gestionan cuentas; los editores solo editan
              fichas.
            </p>
          </div>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}

        {isAdmin ? (
          <>
            <form className="admin-new admin-new--users" onSubmit={createUser}>
              <strong>Agregar usuario</strong>
              <div className="field">
                <label htmlFor="user-name">Nombre</label>
                <input
                  id="user-name"
                  required
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
              <Button type="submit" disabled={busy}>
                Crear y generar enlace
              </Button>
            </form>

            {loading ? (
              <p className="note">Cargando…</p>
            ) : (
              <ul className="admin-users">
                {users.map((user) => {
                  const isMe = user.id === me?.id
                  const link = links[user.id]
                  return (
                    <li
                      key={user.id}
                      className={`admin-users__item${user.isActive ? '' : ' is-off'}`}
                    >
                      <div>
                        <span className="admin-users__name">
                          {user.name}
                          {isMe ? ' (tú)' : ''}
                        </span>
                        <span className="admin-users__meta">
                          {user.email} · {ROLE_LABEL[user.role]} · último ingreso{' '}
                          {formatDate(user.lastLoginAt)}
                          {user.isActive ? '' : ' · desactivado'}
                        </span>
                        {user.resetRequestedAt ? (
                          <span className="admin-badge admin-badge--draft">
                            Pidió restablecer contraseña el {formatDate(user.resetRequestedAt)}
                          </span>
                        ) : null}
                      </div>
                      <div className="admin-users__actions">
                        <select
                          aria-label={`Rol de ${user.name}`}
                          value={user.role}
                          disabled={busy || isMe}
                          onChange={(event) => patchUser(user, { role: event.target.value })}
                        >
                          <option value="editor">Editor</option>
                          <option value="admin">Administrador</option>
                        </select>
                        <button type="button" disabled={busy} onClick={() => makeLink(user)}>
                          Generar enlace de contraseña
                        </button>
                        <button
                          type="button"
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
            )}
          </>
        ) : null}

        <h2 className="admin-title-sm">Cambiar mi contraseña</h2>
        <form className="admin-password" onSubmit={submitPassword}>
          {passwordErr ? <p className="auth-error">{passwordErr}</p> : null}
          {passwordMsg ? <p role="status">{passwordMsg}</p> : null}
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
            <label htmlFor="next-password">Contraseña nueva (mínimo 8 caracteres)</label>
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
          <Button type="submit">Guardar contraseña</Button>
        </form>
      </div>
    </section>
  )
}
