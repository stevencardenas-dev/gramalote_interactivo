import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { apiRequest, ensureSession, getUser, logout } from '../../lib/auth.js'

function formatBytes(bytes) {
  if (!bytes) return '0 MB'
  const mb = bytes / (1024 * 1024)
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(mb < 10 ? 1 : 0)} MB`
}

export default function AdminNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const user = getUser()
  const [media, setMedia] = useState(null)

  // Se vuelve a pedir al cambiar de pantalla: así refleja las fotos recién subidas.
  useEffect(() => {
    let alive = true
    ensureSession().then((session) => {
      if (!alive || !session) return
      apiRequest('/admin/media/stats')
        .then((stats) => alive && setMedia(stats))
        .catch(() => {})
    })
    return () => {
      alive = false
    }
  }, [pathname])

  async function handleLogout() {
    await logout()
    navigate('/acceder', { replace: true })
  }

  const pct =
    media?.quotaBytes > 0 ? Math.min(100, Math.round((media.usedBytes / media.quotaBytes) * 100)) : 0

  return (
    <header className="admin-nav">
      <Link className="admin-nav__brand" to="/admin">
        Gramalote <span>Panel</span>
      </Link>
      <nav className="admin-nav__links" aria-label="Panel">
        <NavLink to="/admin" end>
          Inicio
        </NavLink>
        <NavLink to="/admin/establecimientos">Establecimientos</NavLink>
        {user?.role === 'admin' ? <NavLink to="/admin/usuarios">Usuarios</NavLink> : null}
      </nav>
      <div className="admin-nav__end">
        {media ? (
          <span
            className={`admin-chip${pct > 85 ? ' is-warn' : ''}`}
            title="Espacio usado por las imágenes"
          >
            Imágenes {formatBytes(media.usedBytes)} de {formatBytes(media.quotaBytes)}
          </span>
        ) : null}
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
