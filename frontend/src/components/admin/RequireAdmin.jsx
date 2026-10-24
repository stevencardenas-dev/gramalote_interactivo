import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ensureSession } from '../../lib/auth.js'

export default function RequireAdmin({ children }) {
  const location = useLocation()
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let alive = true
    ensureSession().then((session) => {
      if (alive) setStatus(session ? 'ok' : 'anon')
    })
    return () => {
      alive = false
    }
  }, [])

  if (status === 'checking') {
    return (
      <section className="auth-wrap">
        <div className="container">
          <p className="note">Verificando sesión…</p>
        </div>
      </section>
    )
  }

  if (status === 'anon') {
    return <Navigate to="/acceder" replace state={{ from: location.pathname }} />
  }

  return children
}
