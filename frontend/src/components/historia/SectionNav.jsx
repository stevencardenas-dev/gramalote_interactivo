import { NavLink, useLocation } from 'react-router-dom'
import { SECCION_NAV } from '../../data/historia.js'

function isActive(pathname, to) {
  if (to === '/historia') return pathname === '/historia' || pathname === '/historia/'
  if (to.startsWith('/historia/recorrido')) return pathname.startsWith('/historia/recorrido')
  return pathname.startsWith(to)
}

export default function SectionNav() {
  const { pathname } = useLocation()

  return (
    <nav className="his-nav" aria-label="Navegación de Conocer historia">
      <div className="container">
        <ul className="his-nav__list">
          {SECCION_NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={`his-nav__link${isActive(pathname, item.to) ? ' is-active' : ''}`}
                aria-current={isActive(pathname, item.to) ? 'page' : undefined}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
