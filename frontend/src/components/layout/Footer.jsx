import { Link } from 'react-router-dom'
import { site } from '../../data/site.js'
import SocialIcon from '../ui/SocialIcon.jsx'

const year = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
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
                <SocialIcon name={network.icon} />
              </a>
            ))}
          </div>
        </div>

        <div className="footer-logos">
          <img src="/brand/logo-rect.svg" alt="Gramalote Interactivo" />
          <img
            className="footer-logos__institution"
            src="/img/brand/alcaldia.png"
            alt="Alcaldía de Gramalote"
          />
        </div>
      </div>

      <div className="footer-rule" />

      <div className="footer-legal">
        © {year} Gramalote Interactivo. Todos los derechos reservados.
      </div>
    </footer>
  )
}
