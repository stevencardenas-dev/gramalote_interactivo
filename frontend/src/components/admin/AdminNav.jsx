import { Link, NavLink, useNavigate } from 'react-router-dom'
import Logo from '../ui/Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { getUser, logout } from '../../lib/auth.js'

export default function AdminNav() {
  const navigate = useNavigate()
  const user = getUser()

  async function handleLogout() {
    await logout()
    navigate('/acceder', { replace: true })
  }

  return (
    <header className="admin-nav">
      <Link className="admin-nav__brand" to="/admin">
        <Logo variant="cube" className="admin-nav__logo" alt="Gramalote Interactivo" />
        <span>Panel</span>
      </Link>
      <nav className="admin-nav__links" aria-label="Panel">
        <NavLink to="/admin" end>
          Inicio
        </NavLink>
        <NavLink to="/admin/establecimientos">Establecimientos</NavLink>
        <NavLink to="/admin/experiencias">Experiencias</NavLink>
        {user?.role === 'admin' ? <NavLink to="/admin/usuarios">Usuarios</NavLink> : null}
      </nav>
      <ThemeToggle />
      <div className="admin-nav__end">
        <Link className="admin-nav__site" to="/">
          Ver sitio ↗
        </Link>
        <button type="button" className="admin-nav__out" onClick={handleLogout}>
          {user?.name ? `${user.name.split(' ')[0]} · ` : ''}Salir
        </button>
      </div>
    </header>
  )
}
