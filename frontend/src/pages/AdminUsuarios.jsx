import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminToast from '../components/admin/AdminToast.jsx'
import Pagination from '../components/admin/Pagination.jsx'
import { usePaged } from '../lib/usePaged.js'
import PasswordInput from '../components/ui/PasswordInput.jsx'
import { useDialog } from '../lib/dialog.jsx'
import {
  apiRequest,
  changeOwnEmail,
  changeOwnName,
  changePassword,
  deleteOwnAccount,
  ensureSession,
  getUser,
} from '../lib/auth.js'

const ROLE_LABEL = { admin: 'Administrador', editor: 'Editor' }

// Basura dibujada para la baja de la cuenta: tapa, cuerpo y dos rayas.
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        d="M9 4.5h6M4.5 7h15M7 7l.9 12.2a1.8 1.8 0 0 0 1.8 1.7h5.6a1.8 1.8 0 0 0 1.8-1.7L18 7M10.2 11v6M13.8 11v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function formatDate(value) {
  if (!value) return 'Nunca'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Flecha de los desplegables de la cuenta: SVG y no un carácter, que se veía
// distinto en cada navegador.
function Chevron() {
  return (
    <svg className="admin-acc__chevron" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        d="M6 9.5l6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
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
  const [myName, setMyName] = useState(me?.name ?? '')
  const [myEmail, setMyEmail] = useState({ email: '', password: '' })
  const [passwords, setPasswords] = useState({ current: '', next: '' })
  const [accountMsg, setAccountMsg] = useState('')
  const [accountErr, setAccountErr] = useState('')
  // Confirmaciones dentro del panel (borrar cuenta, borrar usuario).
  const { confirm } = useDialog()
  const paged = usePaged(users)

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
          : `Cuenta creada, pero el correo no salió (${data.mailError}). La persona puede usar «¿Olvidaste tu contraseña?» cuando el correo esté configurado.`,
      )
      setForm({ name: '', email: '', role: 'editor' })
      setShowNew(false)
    })
  }

  function patchUser(user, changes) {
    run(() => apiRequest(`/admin/users/${user.id}`, { method: 'PATCH', body: changes }))
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

  async function removeUser(user) {
    const ok = await confirm({
      title: `¿Eliminar la cuenta de ${user.name}?`,
      message: 'La persona sale del panel y no se puede deshacer.',
      confirmLabel: 'Eliminar cuenta',
      danger: true,
    })
    if (!ok) return
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

  async function submitMyName(event) {
    event.preventDefault()
    setAccountMsg('')
    setAccountErr('')
    try {
      const user = await changeOwnName(myName)
      setMyName(user.name)
      setAccountMsg('Nombre actualizado.')
      if (isAdmin) load()
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
    }
  }

  async function askRemoveMyself() {
    const ok = await confirm({
      title: '¿Eliminar tu cuenta?',
      message: 'Sales del panel y no se puede deshacer.',
      hint: 'Otro administrador tendrá que crearte de nuevo.',
      confirmLabel: 'Sí, eliminar mi cuenta',
      danger: true,
    })
    if (ok) removeMyself()
  }

  // Un aviso a la vez, abajo: primero el error y, si no hay, el mensaje de éxito.
  const toast =
    error || accountErr
      ? {
          tone: 'error',
          message: error || accountErr,
          close: () => {
            setError('')
            setAccountErr('')
          },
        }
      : notice || accountMsg
        ? {
            tone: 'ok',
            message: notice || accountMsg,
            close: () => {
              setNotice('')
              setAccountMsg('')
            },
          }
        : null

  return (
    <section className="admin-page">
      <div className="admin-wrap">
        <div className="admin-bar">
          <div className="admin-bar__heading">
            <h1>{isAdmin ? 'Usuarios' : 'Mi cuenta'}</h1>
            <p className="admin-bar__lead">
              {isAdmin
                ? 'Gestiona las cuentas del panel. Las cuentas más nuevas que la tuya se pueden editar; las anteriores son de solo lectura.'
                : 'Cambia tu nombre, correo o contraseña.'}
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
            <>
            <ul className="admin-rows admin-urows">
              {paged.pageItems.map((user) => {
                const isMe = user.id === me?.id
                const isNewer = user.id > (me?.id ?? 0)
                // Las cuentas anteriores no se editan: ni rol, ni estado, ni correo.
                const isOlder = !isMe && !isNewer
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
                      <small title={isOlder ? 'Cuenta anterior a la tuya: solo lectura' : undefined}>
                        {user.email} · ingresó {formatDate(user.lastLoginAt)}
                        {isOlder ? ' · anterior: solo lectura' : ''}
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
                      disabled={busy || isMe || isOlder}
                      title={isOlder ? 'Las cuentas anteriores a la tuya son de solo lectura' : undefined}
                      onChange={(event) => patchUser(user, { role: event.target.value })}
                    >
                      <option value="editor">{ROLE_LABEL.editor}</option>
                      <option value="admin">{ROLE_LABEL.admin}</option>
                    </select>
                    <div className="admin-urow__actions">
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
                        disabled={busy || isMe || isOlder}
                        title={isOlder ? 'Las cuentas anteriores a la tuya son de solo lectura' : undefined}
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
                      <form className="admin-email-edit" onSubmit={(event) => saveUserEmail(event, user)}>
                        <label htmlFor={`email-${user.id}`}>Correo nuevo</label>
                        <input
                          id={`email-${user.id}`}
                          type="email"
                          required
                          autoFocus
                          placeholder={user.email}
                          value={emailEdit.value}
                          onChange={(event) => setEmailEdit({ id: user.id, value: event.target.value })}
                        />
                        <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
                          Guardar
                        </button>
                        <button type="button" className="admin-btn" onClick={() => setEmailEdit(null)}>
                          Cancelar
                        </button>
                      </form>
                    ) : null}
                  </li>
                )
              })}
            </ul>
            <Pagination {...paged} label="cuentas" />
            </>
          )
        ) : null}

        <section className="admin-myaccount">
          <h2 className="admin-myaccount__title">Datos de la cuenta</h2>
          <p className="admin-account__who">
            Tu correo actual: <strong>{me?.email}</strong>
          </p>

          {/* Tres desplegables en fila (uno debajo del otro): nombre, correo y contraseña. */}
          <div className="admin-account__cols">
            <details className="admin-acc" open>
              <summary>
                <span>Nombre</span>
                <Chevron />
              </summary>
              <div className="admin-acc__body">
                <p className="admin-account__hint">Así apareces en el panel y en el historial.</p>
                <form className="admin-account__name" onSubmit={submitMyName}>
                  <div className="field">
                    <label htmlFor="my-name">Nombre visible</label>
                    <input
                      id="my-name"
                      autoComplete="name"
                      required
                      maxLength={160}
                      value={myName}
                      onChange={(event) => setMyName(event.target.value)}
                    />
                  </div>
                  <button type="submit" className="admin-btn admin-btn--primary">
                    Guardar nombre
                  </button>
                </form>
              </div>
            </details>

            <details className="admin-acc">
              <summary>
                <span>Correo</span>
                <Chevron />
              </summary>
              <div className="admin-acc__body">
                <p className="admin-account__hint">Con este correo entras al panel.</p>
                <form className="admin-account__block" onSubmit={submitMyEmail}>
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
              </div>
            </details>

            <details className="admin-acc">
              <summary>
                <span>Contraseña</span>
                <Chevron />
              </summary>
              <div className="admin-acc__body">
                <p className="admin-account__hint">Mínimo 8 caracteres.</p>
                <form className="admin-account__block" onSubmit={submitPassword}>
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
            </details>
          </div>

          {isAdmin ? (
            <div className="admin-account__danger">
              <div>
                <strong>Eliminar mi cuenta</strong>
                <p>Sales del panel y no se puede deshacer.</p>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--danger-outline admin-account__delete"
                onClick={askRemoveMyself}
              >
                <TrashIcon />
                Eliminar mi cuenta
              </button>
            </div>
          ) : null}
        </section>
      </div>
      {toast ? <AdminToast tone={toast.tone} message={toast.message} onClose={toast.close} /> : null}
    </section>
  )
}
