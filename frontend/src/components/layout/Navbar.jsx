import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { site } from '../../data/site.js'
import Icon from '../ui/Icon.jsx'

function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Gramalote Interactivo, ir al inicio">
      <span className="brand__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="5" cy="5" r="1.8" fill="currentColor" />
          <circle cx="12" cy="5" r="1.8" fill="currentColor" />
          <circle cx="19" cy="5" r="1.8" fill="currentColor" />
          <circle cx="5" cy="12" r="1.8" fill="currentColor" />
          <circle cx="12" cy="12" r="1.8" fill="currentColor" />
          <circle cx="19" cy="12" r="1.8" fill="currentColor" />
          <circle cx="5" cy="19" r="1.8" fill="currentColor" />
          <circle cx="12" cy="19" r="1.8" fill="currentColor" />
          <circle cx="19" cy="19" r="1.8" fill="currentColor" />
        </svg>
      </span>
      <span className="visually-hidden">Gramalote</span>
    </Link>
  )
}

function SearchForm({ onSubmitted }) {
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
      <label className="visually-hidden" htmlFor="site-search">
        Buscar en el sitio
      </label>
      <input
        id="site-search"
        type="search"
        placeholder="Buscar..."
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    </form>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)

  function closeMenu() {
    setOpen(false)
  }

  return (
    <header className="site-header">
      <div className="site-header__inner container container--wide">
        <Brand />

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

          <details className="nav-dropdown">
            <summary>
              {site.explore.label}
              <Icon name="chevron" />
            </summary>
            <div className="nav-dropdown__panel">
              {site.explore.items.map((item) => (
                <Link key={item.to} to={item.to}>
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
          <SearchForm />
          <button
            className="menu-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="mobile-panel"
            onClick={() => setOpen((value) => !value)}
          >
            <Icon name={open ? 'close' : 'menu'} />
            <span className="visually-hidden">
              {open ? 'Cerrar menú' : 'Abrir menú'}
            </span>
          </button>
        </div>
      </div>

      <div
        className={`mobile-panel${open ? ' is-open' : ''}`}
        id="mobile-panel"
      >
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
        <SearchForm onSubmitted={closeMenu} />
      </div>
    </header>
  )
}
