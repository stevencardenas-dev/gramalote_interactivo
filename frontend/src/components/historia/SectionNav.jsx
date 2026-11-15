import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { SECCION_NAV } from '../../data/historia.js'

function isActive(pathname, to) {
  if (to === '/historia') return pathname === '/historia' || pathname === '/historia/'
  if (to.startsWith('/historia/recorrido')) return pathname.startsWith('/historia/recorrido')
  return pathname.startsWith(to)
}

export default function SectionNav() {
  const { pathname } = useLocation()
  const listRef = useRef(null)

  // En pantallas angostas la barra se desliza en horizontal. Si la pestaña
  // activa queda fuera de la vista no se sabe en qué sección estás, así que al
  // cambiar de ruta se centra la activa dentro de la barra (nunca la página).
  useEffect(() => {
    const centrar = () => {
      const list = listRef.current
      const active = list?.querySelector('.his-nav__link.is-active')
      if (!list || !active || list.scrollWidth <= list.clientWidth) return

      const caja = list.getBoundingClientRect()
      const enlace = active.getBoundingClientRect()
      const margen = 8
      const fuera = enlace.left < caja.left + margen || enlace.right > caja.right - margen
      if (!fuera) return

      const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      list.scrollTo({
        left: list.scrollLeft + (enlace.left - caja.left) - (caja.width - enlace.width) / 2,
        behavior: reducido ? 'auto' : 'smooth',
      })
    }

    // Al montar, el CSS de la ruta y las fuentes pueden llegar después: si se
    // mide solo una vez, la barra aún no desborda y la pestaña activa se queda
    // fuera. Se reintenta en el primer cuadro, tras cargar y al redimensionar.
    centrar()
    const cuadro = window.requestAnimationFrame(centrar)
    const espera = window.setTimeout(centrar, 300)
    window.addEventListener('resize', centrar, { passive: true })

    return () => {
      window.cancelAnimationFrame(cuadro)
      window.clearTimeout(espera)
      window.removeEventListener('resize', centrar)
    }
  }, [pathname])

  return (
    <nav className="his-nav" aria-label="Navegación de Conocer historia">
      <div className="container">
        <ul className="his-nav__list" ref={listRef}>
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
