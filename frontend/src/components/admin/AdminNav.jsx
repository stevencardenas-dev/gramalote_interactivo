import { useEffect, useSyncExternalStore } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Logo from '../ui/Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { getUser, logout, subscribe } from '../../lib/auth.js'

export default function AdminNav() {
  const navigate = useNavigate()
  // Se suscribe a la sesión: al recargar, el usuario llega después del primer render.
  const user = useSyncExternalStore(subscribe, getUser)

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

  return (
    <header className="admin-nav">
      <Link className="admin-nav__brand" to="/admin" aria-label="Panel de administración">
        <Logo variant="cube" className="admin-nav__logo" alt="Gramalote Interactivo" />
      </Link>
      <nav className="admin-nav__links" aria-label="Panel">
        <NavLink to="/admin" end>
          Inicio
        </NavLink>
        <NavLink to="/admin/lugares">Lugares</NavLink>
        <NavLink to="/admin/paginas">Páginas</NavLink>
        <NavLink to="/admin/usuarios">{user?.role === 'admin' ? 'Usuarios' : 'Mi cuenta'}</NavLink>
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
