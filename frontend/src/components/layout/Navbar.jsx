import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { site } from '../../data/site.js'
import { getUser, subscribe } from '../../lib/auth.js'
import { loadSearchIndex, suggest } from '../../lib/searchIndex.js'
import Icon from '../ui/Icon.jsx'
import Logo from '../ui/Logo.jsx'

function SearchForm({ onSubmitted, inputId = 'site-search' }) {
  const navigate = useNavigate()
  const listId = useId()
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [loaded, setLoaded] = useState(false)
  // En pantallas pequeñas caben menos sugerencias (3 o 4).
  const [compactScreen, setCompactScreen] = useState(
    () => window.matchMedia('(max-width: 900px)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(max-width: 900px)')
    const update = () => setCompactScreen(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  // `loaded` fuerza el recálculo cuando llega el índice de establecimientos.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = useMemo(() => suggest(value, compactScreen ? 4 : 7), [value, loaded, compactScreen])

  function finish() {
    setValue('')
    setOpen(false)
    setActive(-1)
    onSubmitted?.()
  }

  function go(to) {
    navigate(to)
    finish()
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (active >= 0 && options[active]) {
      go(options[active].to)
      return
    }
    const term = value.trim()
    if (!term) return
    navigate(`/buscar?q=${encodeURIComponent(term)}`)
    finish()
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    } else if (event.key === 'ArrowDown' && options.length > 0) {
      event.preventDefault()
      setOpen(true)
      setActive((index) => (index + 1) % options.length)
    } else if (event.key === 'ArrowUp' && options.length > 0) {
      event.preventDefault()
      setOpen(true)
      setActive((index) => (index <= 0 ? options.length - 1 : index - 1))
    }
  }

  const showList = open && options.length > 0

  return (
    <form
      className="search-field"
      role="search"
      onSubmit={handleSubmit}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false)
          setActive(-1)
        }
      }}
    >
      <Icon name="search" className="search-field__icon" />
      <label className="visually-hidden" htmlFor={inputId}>
        Buscar en el sitio
      </label>
      <input
        id={inputId}
        type="search"
        placeholder="Buscar en el sitio…"
        value={value}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        onFocus={() => {
          setOpen(true)
          loadSearchIndex().then(() => setLoaded(true))
        }}
        onKeyDown={handleKeyDown}
        onChange={(event) => {
          setValue(event.target.value)
          setOpen(true)
          setActive(-1)
        }}
      />
      {showList ? (
        <ul className="search-suggest" id={listId} role="listbox" aria-label="Sugerencias">
          {options.map((option, index) => (
            <li
              key={option.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              className={index === active ? 'is-active' : undefined}
              onMouseEnter={() => setActive(index)}
              onMouseDown={(event) => {
                event.preventDefault()
                go(option.to)
              }}
            >
              <span className="search-suggest__title">{option.title}</span>
              <span className={`search-suggest__tag search-suggest__tag--${option.meta === 'Sección' ? 'seccion' : 'lugar'}`}>
                {option.meta}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  )
}

const DESKTOP_BREAKPOINT = 1100

// La rayita del menú sigue a la sección, no solo a la ruta exacta: las fichas,
// los listados y los accesos por redirección también marcan su opción.
function isActive({ match = [], exact = false }, pathname) {
  return match.some((base) =>
    exact ? pathname === base : pathname === base || pathname.startsWith(`${base}/`),
  )
}

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

  // Con sesión iniciada el acceso lleva al panel.
  const loggedIn = Boolean(useSyncExternalStore(subscribe, getUser))
  const loginTo = loggedIn ? '/admin' : '/acceder'
  const loginLabel = loggedIn ? 'Panel' : 'Acceder'
  const loginRef = useRef(null)

  // Shift+V vuelve al panel (o a /acceder sin sesión): equivale a pulsar el
  // candado. Igual que en el panel, se ignora mientras se escribe en un campo.
  useEffect(() => {
    function onShortcut(event) {
      if (!event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return
      if (event.key.toLowerCase() !== 'v') return
      const target = event.target
      const typing =
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      if (typing) return
      event.preventDefault()
      loginRef.current?.click()
    }
    window.addEventListener('keydown', onShortcut)
    return () => window.removeEventListener('keydown', onShortcut)
  }, [])

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
          {site.nav.map((link) => {
            const active = isActive(link, pathname)
            return (
              <Link
                key={link.to}
                to={link.to}
                aria-current={active ? 'page' : undefined}
                className={`site-nav__link${active ? ' active' : ''}`}
              >
                {link.label}
              </Link>
            )
          })}

          <details className="nav-dropdown" ref={dropdownRef}>
            <summary className={isActive(site.explore, pathname) ? 'active' : undefined}>
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
          <SearchForm inputId="site-search" />
          <Link
            ref={loginRef}
            className="site-login"
            to={loginTo}
            aria-label={loginLabel}
            aria-keyshortcuts="Shift+V"
            title={`${loginLabel} (Shift + V)`}
          >
            <Icon name="lock" />
          </Link>
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
              <Link to={loginTo} onClick={closeMenu}>
                {loginLabel}
              </Link>
            </li>
          </ul>
        </nav>
        <SearchForm inputId="site-search-mobile" onSubmitted={closeMenu} />
      </div>
    </header>
  )
}
