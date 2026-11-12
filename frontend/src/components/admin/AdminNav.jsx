import { useEffect, useRef, useSyncExternalStore } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import Logo from '../ui/Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { getUser, logout, subscribe } from '../../lib/auth.js'

// Secciones que cuelgan de «Lugares» en la barra del panel.
const LUGARES = [
  { to: '/admin/establecimientos', label: 'Establecimientos' },
  { to: '/admin/experiencias', label: 'Experiencias' },
  { to: '/admin/extras', label: 'Extras' },
  { to: '/admin/sugerencias', label: 'Sugerencias' },
]

export default function AdminNav() {
  const navigate = useNavigate()
  const location = useLocation()
  // Se suscribe a la sesión: al recargar, el usuario llega después del primer render.
  const user = useSyncExternalStore(subscribe, getUser)
  const menuRef = useRef(null)
  const enLugares = LUGARES.some((item) => location.pathname.startsWith(item.to))

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

  // El desplegable de Lugares se cierra al navegar o al tocar fuera.
  useEffect(() => {
    if (menuRef.current) menuRef.current.open = false
  }, [location.pathname])

  useEffect(() => {
    function onPointerDown(event) {
      if (!menuRef.current?.open) return
      if (menuRef.current.contains(event.target)) return
      menuRef.current.open = false
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  async function handleLogout() {
    await logout()
    navigate('/acceder', { replace: true })
  }

  return (
    <header className="admin-nav">
      <Link className="admin-nav__brand" to="/admin" aria-label="Panel de administración">
        <Logo variant="cube" className="admin-nav__logo" alt="Gramalote Interactivo" />
      </Link>
      <nav className="admin-nav__links" aria-label="Panel">
        <NavLink to="/admin" end>
          Inicio
        </NavLink>
        <details className="admin-nav__drop" ref={menuRef}>
          <summary className={enLugares ? 'is-active' : undefined}>
            Lugares
            <span className="admin-nav__caret" aria-hidden="true" />
          </summary>
          <div className="admin-nav__drop-menu">
            {LUGARES.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </details>
        <NavLink to="/admin/paginas">Páginas</NavLink>
        {user?.role === 'admin' ? <NavLink to="/admin/usuarios">Usuarios</NavLink> : null}
        {user?.role === 'admin' ? <NavLink to="/admin/correo">Correo</NavLink> : null}
      </nav>
      <ThemeToggle />
      <div className="admin-nav__end">
        <Link
          className="admin-nav__site"
          to="/"
          title="Ver el sitio (Shift + V)"
          aria-keyshortcuts="Shift+V"
        >
          Ver sitio ↗
          <kbd className="admin-keyhint" aria-hidden="true">
            ⇧V
          </kbd>
        </Link>
        <button
          type="button"
          className="admin-nav__out"
          onClick={handleLogout}
          title="Cerrar sesión"
        >
          {user?.name ? `${user.name.split(' ')[0]} · ` : ''}Salir
        </button>
      </div>
    </header>
  )
}
