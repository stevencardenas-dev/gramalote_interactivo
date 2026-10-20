import { Link, useLocation } from 'react-router-dom'
import { site } from '../../data/site.js'
import Icon from '../ui/Icon.jsx'

const year = new Date().getFullYear()

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

export default function Footer() {
  const { pathname } = useLocation()
  const hidePractical =
    pathname.startsWith('/establecimiento/') ||
    pathname.startsWith('/curiosidades/') ||
    pathname === '/informacion-practica'

  return (
    <footer className="site-footer">
      {hidePractical ? null : (
        <div className="container">
          <div className="footer-cta">
            <p className="eyebrow">Información práctica</p>
            <h2>¿Qué debes saber si vas a visitar Gramalote?</h2>
            <div className="practical-grid">
              {site.practical.map((item) => (
                <Link key={item.title} className="feature-card" to={item.to}>
                  <span className="feature-card__icon">
                    <Icon name={item.icon} />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="footer-bar">
        <div className="footer-bar__inner container">
          <Brand />

          <nav className="footer-nav" aria-label="Navegación del pie de página">
            {site.footer.map((link) => (
              <Link key={link.to} to={link.to}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="footer-social">
            {site.social.map((network) => (
              <a
                key={network.label}
                href={network.href}
                target="_blank"
                rel="noreferrer"
                aria-label={network.label}
              >
                <Icon name={network.icon} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="footer-legal">
        © {year} Gramalote Interactivo. Todos los derechos reservados.
      </div>
    </footer>
  )
}
