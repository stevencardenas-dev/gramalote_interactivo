import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import { getUser, logout } from '../lib/auth.js'

const MODULES = [
  {
    key: 'establecimientos',
    name: 'Establecimientos',
    hint: 'Datos e imágenes de comer, dormir y comprar',
    path: '/admin/establecimientos',
  },
  { key: 'experiencias', name: 'Experiencias', hint: 'Qué hacer', path: null },
  { key: 'curiosidades', name: 'Curiosidades', hint: 'Contenido editorial', path: null },
]

export default function Admin() {
  const navigate = useNavigate()
  const user = getUser()
  const [pending, setPending] = useState(false)

  async function handleLogout() {
    setPending(true)
    await logout()
    navigate('/acceder', { replace: true })
  }

  return (
    <section className="auth-wrap">
      <div className="container">
        <div className="auth-card admin-card">
          <h1>Panel de administración</h1>
          <p>{user ? `${user.name} · ${user.email}` : 'Sesión activa'}</p>

          <ul className="admin-modules">
            {MODULES.map((module) => (
              <li key={module.key} className="admin-module">
                {module.path ? (
                  <Link className="admin-module__link" to={module.path}>
                    <span className="admin-module__name">{module.name}</span>
                    <span className="admin-module__hint">{module.hint}</span>
                  </Link>
                ) : (
                  <>
                    <span className="admin-module__name">{module.name}</span>
                    <span className="admin-module__hint">{module.hint} · próximamente</span>
                  </>
                )}
              </li>
            ))}
          </ul>

          <Button onClick={handleLogout} disabled={pending}>
            {pending ? 'Cerrando…' : 'Cerrar sesión'}
          </Button>
          <p className="note">
            Por ahora solo se edita el módulo de establecimientos; las imágenes se
            guardan en el disco del servidor.
          </p>
        </div>
      </div>
    </section>
  )
}
