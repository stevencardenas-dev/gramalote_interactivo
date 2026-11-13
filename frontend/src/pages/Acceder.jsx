import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import Logo from '../components/ui/Logo.jsx'
import PasswordInput from '../components/ui/PasswordInput.jsx'
import { AuthError, ensureSession, forgotPassword, login, logout, takeSessionNotice } from '../lib/auth.js'

export default function Acceder() {
  const navigate = useNavigate()
  const location = useLocation()
  const [status, setStatus] = useState('checking')
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [forgot, setForgot] = useState(false)
  const [notice, setNotice] = useState('')
  // Aviso de por qué se cerró la sesión (la cuenta se abrió en otro equipo).
  const [kicked, setKicked] = useState('')

  useEffect(() => {
    let alive = true
    ensureSession().then((session) => {
      if (!alive) return
      setUser(session)
      setStatus(session ? 'authed' : 'anon')
      if (!session) setKicked(takeSessionNotice())
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

  async function handleForgot(event) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      setNotice(await forgotPassword(email))
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'No se pudo enviar la solicitud')
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
            <Logo variant="iso" className="auth-card__logo" alt="" />
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
            <Logo variant="iso" className="auth-card__logo" alt="" />
            <h1>¡Hola, {user.name}!</h1>
            <p>Tu sesión está activa ({user.email}).</p>
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
            <Logo variant="iso" className="auth-card__logo" alt="" />
          <h1>Acceder</h1>
          <p>Bienvenido/a al área de administración. Ingresa para editar las fichas de Gramalote.</p>

          {forgot ? (
            <form onSubmit={handleForgot}>
              {error ? <p className="auth-error">{error}</p> : null}
              {notice ? (
                <p role="status">{notice}</p>
              ) : (
                <>
                  <p>
                    Escribe tu correo y te enviaremos un enlace para crear una contraseña nueva.
                  </p>
                  <div className="field">
                    <label htmlFor="forgot-email">Correo electrónico</label>
                    <input
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={pending}>
                    {pending ? 'Enviando…' : 'Pedir enlace'}
                  </Button>
                </>
              )}
              <p className="note">
                <button
                  type="button"
                  className="link-arrow"
                  onClick={() => {
                    setForgot(false)
                    setNotice('')
                    setError('')
                  }}
                >
                  Volver a ingresar
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              {kicked && !error ? <p role="status">{kicked}</p> : null}
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
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? 'Ingresando…' : 'Ingresar'}
              </Button>
              <p className="note">
                <button
                  type="button"
                  className="link-arrow link-arrow--plano"
                  onClick={() => {
                    setForgot(true)
                    setError('')
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </p>
            </form>
          )}

        </div>
      </div>
    </section>
  )
}
