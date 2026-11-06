import PageHero from '../components/ui/PageHero.jsx'
import Photo from '../components/ui/Photo.jsx'
import Icon from '../components/ui/Icon.jsx'
import IconMask from '../components/ui/IconMask.jsx'
import OfflineDownload from '../components/ui/OfflineDownload.jsx'
import { MapExplorer } from '../components/ui/MapPanel.jsx'
import {
  accessRoutes,
  preparationTips,
  safetyTips,
  transportOptions,
  usefulContacts,
} from '../data/practical.js'

export default function InformacionPractica() {
  return (
    <>
      <PageHero
        image="/img/info/hero.jpg"
        title="Información práctica"
        intro="Todo lo que necesitas saber para planear tu visita a Gramalote y disfrutar una experiencia segura y agradable."
        breadcrumb={[
          { label: 'Inicio', to: '/' },
          { label: 'Información práctica' },
        ]}
      />

      <section className="section section--tight">
        <div className="container">
          <div className="section-head section-head--center">
            <h2 id="como-llegar">Cómo llegar a Gramalote</h2>
            <p>Conoce las opciones de acceso y planifica tu recorrido.</p>
          </div>

          <div className="access-grid">
            {accessRoutes.map((route) => (
              <article key={route.title} className="access-card">
                <Photo src={route.photo} alt={route.alt} />
                <div className="access-card__body">
                  <h3>{route.title}</h3>
                  <p>{route.text}</p>
                  <a className="pill-link" href={route.href} target="_blank" rel="noreferrer">
                    Consultar ruta <span aria-hidden="true">↗</span>
                    <span className="visually-hidden"> {route.title.toLowerCase()} (abre Google Maps)</span>
                  </a>
                </div>
              </article>
            ))}
          </div>

          <div className="section-head section-head--center">
            <h2 id="transporte">Opciones de transporte</h2>
          </div>

          <div className="transport-grid">
            {transportOptions.map((option) => (
              <article key={option.title} className="transport-card">
                <IconMask icon={`icono-${option.icon}`} size={78} className="transport-card__icon" />
                <h3>{option.title}</h3>
                <p>{option.text}</p>
              </article>
            ))}
          </div>

          <div className="section-head section-head--center">
            <h2 id="seguridad">Seguridad durante tu visita</h2>
          </div>

          <div className="safety-block">
            <figure className="safety-block__media">
              <Photo src="/img/info/seguridad.jpg" alt="Sendero de tierra entre el bosque" />
              <figcaption>
                Consulta las recomendaciones de seguridad antes de visitar
                Gramalote y sus espacios naturales.
              </figcaption>
            </figure>
            <ul className="safety-list">
              {safetyTips.map((tip) => (
                <li key={tip.title}>
                  <span className="safety-list__icon">
                    <IconMask icon={`icono-${tip.icon}`} size={20} />
                  </span>
                  <div className="safety-list__body">
                    <h3>{tip.title}</h3>
                    <p>{tip.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <a className="help-note" href="#contactos">
            <span className="help-note__icon">
              <Icon name="phone" />
            </span>
            <span>
              <strong>¿Necesitas ayuda?</strong>
              <span>Consulta los contactos de emergencia en esta misma página.</span>
            </span>
          </a>

          <div className="preparation" id="antes-de-salir">
            <div className="section-head section-head--center">
              <h2>Prepara tu visita a Gramalote</h2>
              <p>
                Prepara cada detalle antes de salir y disfruta al máximo tu
                experiencia en Gramalote.
              </p>
            </div>

            <div className="preparation__grid">
              {preparationTips.map((tip) => (
                <article key={tip.title} className="preparation-card">
                  <Photo src={tip.photo} alt={tip.alt} />
                  <h3>{tip.title}</h3>
                  <p>{tip.text}</p>
                </article>
              ))}
            </div>

            <OfflineDownload />
          </div>

          <div className="section-head section-head--center">
            <h2 id="contactos">Contactos útiles</h2>
            <p>
              Encuentra entidades y servicios de atención que pueden orientarte
              durante tu visita a Gramalote.
            </p>
          </div>

          <div className="contacts-grid">
            {usefulContacts.map((contact) => (
              <article key={contact.title} className="contact-card">
                <div className={`contact-card__logo${contact.logo ? '' : ' contact-card__logo--health'}`}>
                  {contact.logo ? (
                    <img src={contact.logo} alt="" loading="lazy" />
                  ) : (
                    <span className="contact-card__cross" aria-hidden="true" />
                  )}
                </div>
                <div className="contact-card__body">
                  <p className="contact-card__kind">{contact.kind}</p>
                  <h3>{contact.title}</h3>
                  <p>{contact.text}</p>
                  <p className="contact-card__phone">
                    <strong>Teléfono:</strong>{' '}
                    <a href={`tel:+57${contact.phone}`}>{contact.phone}</a>
                  </p>
                </div>
              </article>
            ))}
          </div>

          <MapExplorer
            title="Explora Gramalote en el mapa"
            text="Encuentra lugares turísticos, restaurantes, alojamientos y artesanos, y consulta su ubicación."
            cta="Explorar mapa"
          />
        </div>
      </section>
    </>
  )
}
