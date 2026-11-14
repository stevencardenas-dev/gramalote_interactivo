import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import AdminNavSelect from './AdminNavSelect.jsx'

// Tipos de lugar del panel. En escritorio son pestañas con línea inferior, como
// siempre; en celular y tablet, un desplegable (la hilera no cabía).
const TIPOS = [
  { to: '/admin/lugares/establecimientos', label: 'Establecimientos' },
  { to: '/admin/lugares/experiencias', label: 'Experiencias' },
  { to: '/admin/lugares/patrimonio', label: 'Patrimonio' },
  { to: '/admin/lugares/extras', label: 'Extras' },
  { to: '/admin/lugares/sugerencias', label: 'Sugerencias' },
]

export default function AdminLugaresTabs() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const current = TIPOS.find((tipo) => pathname.startsWith(tipo.to))?.to ?? TIPOS[0].to

  return (
    <>
      <nav className="admin-tabs admin-tabs--tipos admin-only-wide" aria-label="Tipos de lugar">
        {TIPOS.map((tipo) => (
          <NavLink key={tipo.to} to={tipo.to} className="admin-tab">
            {tipo.label}
          </NavLink>
        ))}
      </nav>
      <div className="admin-only-narrow">
        <AdminNavSelect
          id="admin-tipo-lugar"
          label="Tipo de lugar"
          value={current}
          options={TIPOS.map((tipo) => ({ value: tipo.to, label: tipo.label }))}
          onChange={(to) => navigate(to)}
        />
      </div>
    </>
  )
}
