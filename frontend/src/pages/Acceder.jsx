import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import { AuthError, ensureSession, login, logout } from '../lib/auth.js'

export default function Acceder() {
  const navigate = useNavigate()
  const location = useLocation()
  const [status, setStatus] = useState('checking')
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let alive = true
    ensureSession().then((session) => {
      if (!alive) return
      setUser(session)
      setStatus(session ? 'authed' : 'anon')
    })
    return () => {
      alive = false
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const session = await login(email, password)
      setUser(session)
      navigate(location.state?.from ?? '/admin', { replace: true })
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setPending(false)
    }
  }

  async function handleLogout() {
    setPending(true)
    await logout()
    setUser(null)
    setStatus('anon')
    setPending(false)
  }

  if (status === 'checking') {
    return (
      <section className="auth-wrap">
        <div className="container">
          <div className="auth-card">
            <h1>Acceder</h1>
            <p>Verificando sesión…</p>
          </div>
        </div>
      </section>
    )
  }

  if (status === 'authed' && user) {
    return (
      <section className="auth-wrap">
        <div className="container">
          <div className="auth-card">
            <h1>Sesión activa</h1>
            <p>
              {user.name} · {user.email}
            </p>
            <Button to="/admin">Ir al panel</Button>
            <Button variant="secondary" onClick={handleLogout} disabled={pending}>
              Cerrar sesión
            </Button>
            <p className="note">
              <Link className="link-arrow" to="/">
                Volver al inicio
              </Link>
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="auth-wrap">
      <div className="container">
        <div className="auth-card">
          <h1>Acceder</h1>
          <p>Área de administración de Gramalote Interactivo.</p>

          <form onSubmit={handleSubmit}>
            {error ? <p className="auth-error">{error}</p> : null}
            <div className="field">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>

          <p className="note">
            <Link className="link-arrow" to="/">
              Volver al inicio
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
