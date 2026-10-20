import { Link } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'

export default function Acceder() {
  return (
    <section className="auth-wrap">
      <div className="container">
        <div className="auth-card">
          <h1>Acceder</h1>
          <p>Área de administración de Gramalote Interactivo.</p>

          <form onSubmit={(event) => event.preventDefault()}>
            <div className="field">
              <label htmlFor="email">Correo electrónico</label>
              <input id="email" type="email" autoComplete="email" required />
            </div>
            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit">Ingresar</Button>
          </form>

          <p className="note">
            Módulo pendiente de conexión con el backend.{' '}
            <Link className="link-arrow" to="/">
              Volver al inicio
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
