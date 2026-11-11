import { Link, useLocation } from 'react-router-dom'
import { site } from '../../data/site.js'
import { SOCIAL_NETWORKS, isSocialUrl } from '../../data/pages.js'
import { usePageContent } from '../../lib/pageContent.js'
import SocialIcon from '../ui/SocialIcon.jsx'

const year = new Date().getFullYear()

export default function Footer() {
  const { pathname } = useLocation()
  // En /sugerir el aviso del pie repetiría la propia página: no se muestra.
  const showSuggest = pathname !== '/sugerir'

  // Redes activas y sus enlaces: Páginas › Redes sociales, en el panel.
  const { social } = usePageContent('redes')
  const networks = social
    .filter((item) => item.enabled && isSocialUrl(item.url))
    .map((item) => ({ ...item, label: SOCIAL_NETWORKS.find((n) => n.id === item.id)?.label ?? item.id }))
    .filter((item) => SOCIAL_NETWORKS.some((n) => n.id === item.id))

  return (
    <footer className="site-footer">
      {showSuggest ? (
        <div className="footer-suggest">
          <div className="container footer-suggest__inner">
            <p>
              <strong>¿Conoces un lugar que debería estar aquí?</strong>
              <span>Sugiere un restaurante, alojamiento, tienda o atractivo de Gramalote.</span>
            </p>
            <Link className="btn btn--primary" to="/sugerir">
              Sugerir un establecimiento
            </Link>
          </div>
        </div>
      ) : null}

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

          {networks.length ? (
            <div className="footer-social">
              {networks.map((network) => (
                <a
                  key={network.id}
                  href={network.url.trim()}
                  target={network.id === 'email' ? undefined : '_blank'}
                  rel="noreferrer"
                  aria-label={network.label}
                >
                  <SocialIcon name={network.id} />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="footer-legal">
        © {year} Gramalote Interactivo. Todos los derechos reservados.
      </div>
    </footer>
  )
}
