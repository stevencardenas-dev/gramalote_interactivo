import { NavLink } from 'react-router-dom'

// Tipos de lugar del panel. Son pestañas con línea inferior, no un desplegable:
// el botón «Lugares» de la barra lleva aquí y cada pestaña cambia de listado.
const TIPOS = [
  { to: '/admin/lugares/establecimientos', label: 'Establecimientos' },
  { to: '/admin/lugares/experiencias', label: 'Experiencias' },
  { to: '/admin/lugares/patrimonio', label: 'Patrimonio' },
  { to: '/admin/lugares/extras', label: 'Extras' },
  { to: '/admin/lugares/sugerencias', label: 'Sugerencias' },
]

export default function AdminLugaresTabs() {
  return (
    <nav className="admin-tabs admin-tabs--tipos" aria-label="Tipos de lugar">
      {TIPOS.map((tipo) => (
        <NavLink key={tipo.to} to={tipo.to} className="admin-tab">
          {tipo.label}
        </NavLink>
      ))}
    </nav>
  )
}
