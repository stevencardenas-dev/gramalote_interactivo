import { useEffect, useState, useSyncExternalStore } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import Logo from '../ui/Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { getUser, logout, subscribe } from '../../lib/auth.js'

export default function AdminNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // Se suscribe a la sesión: al recargar, el usuario llega después del primer render.
  const user = useSyncExternalStore(subscribe, getUser)
  // En pantallas angostas los destinos se pliegan en un menú hamburguesa.
  // Se guarda la ruta en la que se abrió: al navegar se cierra solo.
  const [openPath, setOpenPath] = useState(null)
  const menuOpen = openPath === pathname

  // Shift+V abre el sitio público desde cualquier página del panel. Se ignora
  // mientras se escribe en un campo, para no secuestrar la letra.
  useEffect(() => {
    function onKeyDown(event) {
      if (!event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return
      if (event.key.toLowerCase() !== 'v') return
      const target = event.target
      const typing =
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      if (typing) return
      event.preventDefault()
      navigate('/')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate])

  async function handleLogout() {
    await logout()
    navigate('/acceder', { replace: true })
  }

  const close = () => setOpenPath(null)

  return (
    <header className="admin-nav">
      <Link className="admin-nav__brand" to="/admin" aria-label="Panel de administración">
        <Logo variant="cube" className="admin-nav__logo" alt="Turismo Gramalote" />
      </Link>

      <button
        type="button"
        className="admin-nav__toggle"
        aria-expanded={menuOpen}
        aria-controls="admin-menu"
        onClick={() => setOpenPath(menuOpen ? null : pathname)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d={menuOpen ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        {menuOpen ? 'Cerrar' : 'Menú'}
      </button>

      <div className={`admin-nav__panel${menuOpen ? ' is-open' : ''}`} id="admin-menu">
        <nav className="admin-nav__links" aria-label="Panel">
          <NavLink to="/admin" end onClick={close}>
            Inicio
          </NavLink>
          <NavLink to="/admin/lugares" onClick={close}>
            Lugares
          </NavLink>
          <NavLink to="/admin/paginas" onClick={close}>
            Páginas
          </NavLink>
          <NavLink to="/admin/usuarios" onClick={close}>
            {user?.role === 'admin' ? 'Usuarios' : 'Mi cuenta'}
          </NavLink>
          {user?.role === 'admin' ? (
            <NavLink to="/admin/correo" onClick={close}>
              Correo
            </NavLink>
          ) : null}
        </nav>

        <ThemeToggle />

        <div className="admin-nav__end">
          <Link
            className="admin-nav__site"
            to="/"
            title="Ver el sitio (Shift + V)"
            aria-keyshortcuts="Shift+V"
            onClick={close}
          >
            Ver sitio ↗
            <kbd className="admin-keyhint" aria-hidden="true">
              ⇧V
            </kbd>
          </Link>
          <button type="button" className="admin-nav__out" onClick={handleLogout} title="Cerrar sesión">
            {user?.name ? `${user.name.split(' ')[0]} · ` : ''}Salir
          </button>
        </div>
      </div>
    </header>
  )
}
