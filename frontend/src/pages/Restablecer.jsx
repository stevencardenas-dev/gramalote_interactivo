import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import Logo from '../components/ui/Logo.jsx'
import { AuthError, resetPassword } from '../lib/auth.js'

export default function Restablecer() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setPending(true)
    try {
      await resetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'No se pudo cambiar la contraseña')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="auth-wrap">
      <div className="container">
        <div className="auth-card">
          <Logo variant="iso" className="auth-card__logo" alt="" />
          <h1>Nueva contraseña</h1>
          {done ? (
            <>
              <p>Listo: tu contraseña quedó actualizada. Ya puedes ingresar.</p>
              <Button to="/acceder">Ir a acceder</Button>
            </>
          ) : !token ? (
            <>
              <p className="auth-error">Este enlace está incompleto. Pide uno nuevo desde «¿Olvidaste tu contraseña?».</p>
              <Link className="link-arrow" to="/acceder">
                Volver a acceder
              </Link>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              {error ? <p className="auth-error">{error}</p> : null}
              <div className="field">
                <label htmlFor="new-password">Contraseña nueva</label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="confirm-password">Repite la contraseña</label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                />
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? 'Guardando…' : 'Guardar contraseña'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
