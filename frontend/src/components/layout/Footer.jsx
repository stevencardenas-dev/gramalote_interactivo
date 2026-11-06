import { Link } from 'react-router-dom'
import { site } from '../../data/site.js'
import SocialIcon from '../ui/SocialIcon.jsx'

const year = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-logos">
        <img src="/brand/logo-rect.svg" alt="Gramalote Interactivo" />
        <span className="footer-logos__rule" aria-hidden="true" />
        <img
          className="footer-logos__institution"
          src="/img/brand/alcaldia.png"
          alt="Alcaldía de Gramalote"
        />
      </div>

      <div className="footer-top">
        <div className="container footer-top__inner">
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
      </div>

      <div className="footer-legal">
        © {year} Gramalote Interactivo. Todos los derechos reservados.
      </div>
    </footer>
  )
}
