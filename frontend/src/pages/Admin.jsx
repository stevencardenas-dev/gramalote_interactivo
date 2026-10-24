import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button.jsx'
import { getUser, logout } from '../lib/auth.js'

const MODULES = [
  { key: 'establecimientos', name: 'Establecimientos', hint: 'Comer, dormir y comprar' },
  { key: 'experiencias', name: 'Experiencias', hint: 'Qué hacer' },
  { key: 'curiosidades', name: 'Curiosidades', hint: 'Contenido editorial' },
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
                <span className="admin-module__name">{module.name}</span>
                <span className="admin-module__hint">{module.hint} · próximamente</span>
              </li>
            ))}
          </ul>

          <Button onClick={handleLogout} disabled={pending}>
            {pending ? 'Cerrando…' : 'Cerrar sesión'}
          </Button>
          <p className="note">
            Los módulos de edición se habilitan en las siguientes entregas del plan.
          </p>
        </div>
      </div>
    </section>
  )
}
