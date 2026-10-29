import { useEffect, useRef, useState } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { site } from '../../data/site.js'
import Icon from '../ui/Icon.jsx'
import Logo from '../ui/Logo.jsx'

function SearchForm({ onSubmitted, inputId = 'site-search' }) {
  const navigate = useNavigate()
  const [value, setValue] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const term = value.trim()
    if (!term) return
    navigate(`/buscar?q=${encodeURIComponent(term)}`)
    setValue('')
    onSubmitted?.()
  }

  return (
    <form className="search-field" role="search" onSubmit={handleSubmit}>
      <Icon name="search" className="search-field__icon" />
      <label className="visually-hidden" htmlFor={inputId}>
        Buscar en el sitio
      </label>
      <input
        id={inputId}
        type="search"
        placeholder="Buscar en el sitio…"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    </form>
  )
}

const DESKTOP_BREAKPOINT = 1100

export default function Navbar({ over = false }) {
  const { pathname } = useLocation()
  // Se guarda la ruta en la que se abrió: al navegar, `open` pasa a false solo,
  // sin necesidad de sincronizar estado dentro de un efecto.
  const [openPath, setOpenPath] = useState(null)
  const open = openPath === pathname
  const [scrolled, setScrolled] = useState(false)
  const headerRef = useRef(null)
  const dropdownRef = useRef(null)
  const menuButtonRef = useRef(null)

  useEffect(() => {
    if (!over) return undefined

    function onScroll() {
      setScrolled(window.scrollY > 30)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [over])

  function closeDropdown({ restoreFocus = false } = {}) {
    const dropdown = dropdownRef.current
    if (!dropdown?.open) return
    dropdown.open = false
    if (restoreFocus) dropdown.querySelector('summary')?.focus()
  }

  // El desplegable se cierra al navegar (enlaces, atrás/adelante, redirecciones).
  useEffect(() => {
    closeDropdown()
  }, [pathname])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      if (dropdownRef.current?.open) {
        closeDropdown({ restoreFocus: true })
        return
      }
      if (open) {
        setOpenPath(null)
        menuButtonRef.current?.focus()
      }
    }

    function onPointerDown(event) {
      if (!headerRef.current?.contains(event.target)) {
        setOpenPath(null)
        closeDropdown()
        return
      }
      // Un clic fuera del desplegable pero dentro del header también lo cierra.
      if (dropdownRef.current?.open && !dropdownRef.current.contains(event.target)) {
        closeDropdown()
      }
    }

    function onResize() {
      if (window.innerWidth > DESKTOP_BREAKPOINT) setOpenPath(null)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  // El menú móvil abierto no debe dejar scrollear el contenido de fondo.
  useEffect(() => {
    if (!open) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  function closeMenu() {
    setOpenPath(null)
  }

  const solid = !over || scrolled || open
  const headerClass = [
    'site-header',
    over ? 'site-header--over' : '',
    over && solid ? 'is-solid' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <header className={headerClass} ref={headerRef}>
      <div className="site-header__inner container">
        <Link className="brand" to="/" aria-label="Gramalote Interactivo, ir al inicio">
          <Logo variant="cube" />
        </Link>

        <nav className="site-nav" aria-label="Navegación principal">
          {site.nav.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `site-nav__link${isActive ? ' active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}

          <details className="nav-dropdown" ref={dropdownRef}>
            <summary>
              {site.explore.label}
              <Icon name="chevron" />
            </summary>
            <div className="nav-dropdown__panel">
              {site.explore.items.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => closeDropdown()}>
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
        </nav>

        <div className="site-header__actions">
          <Link className="site-login" to="/acceder">
            <Icon name="lock" />
            Acceder
          </Link>
          <SearchForm inputId="site-search" />
          <button
            ref={menuButtonRef}
            className="menu-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="mobile-panel"
            onClick={() => setOpenPath(open ? null : pathname)}
          >
            <Icon name={open ? 'close' : 'menu'} />
            <span className="visually-hidden">
              {open ? 'Cerrar menú' : 'Abrir menú'}
            </span>
          </button>
        </div>
      </div>

      <div className={`mobile-panel${open ? ' is-open' : ''}`} id="mobile-panel">
        <nav aria-label="Navegación móvil">
          <ul className="mobile-panel__list">
            {site.nav.map((link) => (
              <li key={link.to}>
                <Link to={link.to} onClick={closeMenu}>
                  {link.label}
                </Link>
              </li>
            ))}
            {site.explore.items.map((item) => (
              <li key={item.to}>
                <Link to={item.to} onClick={closeMenu}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/acceder" onClick={closeMenu}>
                Acceder
              </Link>
            </li>
          </ul>
        </nav>
        <SearchForm inputId="site-search-mobile" onSubmitted={closeMenu} />
      </div>
    </header>
  )
}
