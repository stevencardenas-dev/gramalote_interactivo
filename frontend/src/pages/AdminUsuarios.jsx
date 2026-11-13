import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PasswordInput from '../components/ui/PasswordInput.jsx'
import {
  apiRequest,
  changeOwnEmail,
  changePassword,
  deleteOwnAccount,
  ensureSession,
  getUser,
} from '../lib/auth.js'

const ROLE_LABEL = { admin: 'Administrador', editor: 'Editor' }

function formatDate(value) {
  if (!value) return 'Nunca'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminUsuarios() {
  const navigate = useNavigate()
  const me = getUser()
  const isAdmin = me?.role === 'admin'
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(isAdmin)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState({ name: '', email: '', role: 'editor' })
  const [busy, setBusy] = useState(false)
  const [showNew, setShowNew] = useState(false)
  // Correo en edición de otra cuenta: { id, value }.
  const [emailEdit, setEmailEdit] = useState(null)

  // Mi cuenta
  const [myEmail, setMyEmail] = useState({ email: '', password: '' })
  const [passwords, setPasswords] = useState({ current: '', next: '' })
  const [accountMsg, setAccountMsg] = useState('')
  const [accountErr, setAccountErr] = useState('')
  // La baja de la propia cuenta se confirma dentro del panel, no con el
  // diálogo del navegador.
  const [confirmDelete, setConfirmDelete] = useState(false)

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
    setNotice('')
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
      setNotice(
        data.mailed
          ? `Invitación enviada a ${data.user.email}.`
          : `Cuenta creada, pero el correo no salió (${data.mailError}). Cuando el correo esté configurado, usa «Enviar enlace por correo».`,
      )
      setForm({ name: '', email: '', role: 'editor' })
      setShowNew(false)
    })
  }

  function patchUser(user, changes) {
    run(() => apiRequest(`/admin/users/${user.id}`, { method: 'PATCH', body: changes }))
  }

  function sendLink(user) {
    run(async () => {
      await apiRequest(`/admin/users/${user.id}/send-reset`, { method: 'POST' })
      setNotice(`Enviamos a ${user.email} un enlace para crear una contraseña nueva.`)
    })
  }

  function saveUserEmail(event, user) {
    event.preventDefault()
    run(async () => {
      await apiRequest(`/admin/users/${user.id}/email`, {
        method: 'PATCH',
        body: { email: emailEdit.value },
      })
      setNotice(`Correo de ${user.name} actualizado. Sus sesiones se cerraron.`)
      setEmailEdit(null)
    })
  }

  function removeUser(user) {
    if (!window.confirm(`¿Eliminar la cuenta de ${user.name}? No se puede deshacer.`)) return
    run(async () => {
      await apiRequest(`/admin/users/${user.id}`, { method: 'DELETE' })
      setNotice(`Cuenta de ${user.name} eliminada.`)
    })
  }

  async function submitPassword(event) {
    event.preventDefault()
    setAccountMsg('')
    setAccountErr('')
    try {
      await changePassword(passwords.current, passwords.next)
      setPasswords({ current: '', next: '' })
      setAccountMsg('Contraseña actualizada.')
    } catch (err) {
      setAccountErr(err.message)
    }
  }

  async function submitMyEmail(event) {
    event.preventDefault()
    setAccountMsg('')
    setAccountErr('')
    try {
      await changeOwnEmail(myEmail.email, myEmail.password)
      setMyEmail({ email: '', password: '' })
      setAccountMsg('Correo actualizado. Desde ahora entras con el correo nuevo.')
      if (isAdmin) load()
    } catch (err) {
      setAccountErr(err.message)
    }
  }

  async function removeMyself() {
    setAccountMsg('')
    setAccountErr('')
    try {
      await deleteOwnAccount()
      navigate('/acceder', { replace: true })
    } catch (err) {
      setAccountErr(err.message)
      setConfirmDelete(false)
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-wrap">
        <div className="admin-bar">
          <div className="admin-bar__heading">
            <h1>{isAdmin ? 'Usuarios' : 'Mi cuenta'}</h1>
            <p className="admin-bar__lead">
              {isAdmin
                ? 'Gestiona las cuentas del panel. Puedes eliminar o cambiar el correo de las cuentas más nuevas que la tuya.'
                : 'Cambia tu correo o tu contraseña.'}
            </p>
          </div>
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
        {notice ? (
          <p className="admin-notice" role="status">
            {notice}
          </p>
        ) : null}

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
              Crear e invitar
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
                const isNewer = user.id > (me?.id ?? 0)
                const editing = emailEdit?.id === user.id
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
                        onClick={() => sendLink(user)}
                        title="Envía al correo de la cuenta un enlace para crear una contraseña nueva"
                      >
                        Enviar enlace por correo
                      </button>
                      {isNewer ? (
                        <button
                          type="button"
                          className="admin-btn"
                          disabled={busy}
                          onClick={() => setEmailEdit(editing ? null : { id: user.id, value: user.email })}
                        >
                          Cambiar correo
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={`admin-btn${user.isActive ? ' admin-btn--danger-outline' : ''}`}
                        disabled={busy || isMe}
                        onClick={() => patchUser(user, { isActive: !user.isActive })}
                      >
                        {user.isActive ? 'Desactivar' : 'Reactivar'}
                      </button>
                      {isNewer ? (
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger"
                          disabled={busy}
                          onClick={() => removeUser(user)}
                        >
                          Eliminar
                        </button>
                      ) : null}
                    </div>
                    {editing ? (
                      <form className="admin-link-box" onSubmit={(event) => saveUserEmail(event, user)}>
                        <div className="field">
                          <label htmlFor={`email-${user.id}`}>Correo nuevo de {user.name}</label>
                          <input
                            id={`email-${user.id}`}
                            type="email"
                            required
                            autoFocus
                            value={emailEdit.value}
                            onChange={(event) => setEmailEdit({ id: user.id, value: event.target.value })}
                          />
                        </div>
                        <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
                          Guardar correo
                        </button>
                      </form>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )
        ) : null}

        <details className="admin-details" open={!isAdmin}>
          <summary>Mi cuenta: correo y contraseña</summary>
          <div className="admin-account">
            {accountErr ? <p className="auth-error">{accountErr}</p> : null}
            {accountMsg ? (
              <p className="admin-notice" role="status">
                {accountMsg}
              </p>
            ) : null}
            <p className="admin-account__who">
              Tu correo actual: <strong>{me?.email}</strong>
            </p>

            <div className="admin-account__grid">
              <form className="admin-account__block" onSubmit={submitMyEmail}>
                <h2>Correo</h2>
                <p className="admin-account__hint">Con este correo entras al panel.</p>
                <div className="field">
                  <label htmlFor="my-email">Correo nuevo</label>
                  <input
                    id="my-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={myEmail.email}
                    onChange={(event) => setMyEmail({ ...myEmail, email: event.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="my-email-password">Tu contraseña actual</label>
                  <PasswordInput
                    id="my-email-password"
                    autoComplete="current-password"
                    required
                    value={myEmail.password}
                    onChange={(event) => setMyEmail({ ...myEmail, password: event.target.value })}
                  />
                </div>
                <button type="submit" className="admin-btn admin-btn--primary">
                  Guardar correo
                </button>
              </form>

              <form className="admin-account__block" onSubmit={submitPassword}>
                <h2>Contraseña</h2>
                <p className="admin-account__hint">Mínimo 8 caracteres.</p>
                <div className="field">
                  <label htmlFor="current-password">Contraseña actual</label>
                  <PasswordInput
                    id="current-password"
                    autoComplete="current-password"
                    required
                    value={passwords.current}
                    onChange={(event) => setPasswords({ ...passwords, current: event.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="next-password">Nueva contraseña</label>
                  <PasswordInput
                    id="next-password"
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
            </div>

            {isAdmin ? (
              <div className="admin-account__danger">
                <div>
                  <strong>Eliminar mi cuenta</strong>
                  <p>Sales del panel y no se puede deshacer.</p>
                </div>
                {confirmDelete ? (
                  <div className="admin-account__confirm" role="alert">
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger"
                      onClick={removeMyself}
                    >
                      Sí, eliminar mi cuenta
                    </button>
                    <button type="button" className="admin-btn" onClick={() => setConfirmDelete(false)}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="admin-btn admin-btn--danger-outline"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Eliminar mi cuenta
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </details>
      </div>
    </section>
  )
}
