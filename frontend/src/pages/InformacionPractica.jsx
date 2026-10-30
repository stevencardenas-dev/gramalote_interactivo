import PageHero from '../components/ui/PageHero.jsx'
import Placeholder from '../components/ui/Placeholder.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import { heroNuevo2 } from '../data/heroImages.js'
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
        image={heroNuevo2.src}
        credit={heroNuevo2.credit}
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
                <Placeholder />
                <h3>{route.title}</h3>
                <p>{route.text}</p>
                <Button to="/informacion-practica#contactos" variant="secondary" icon="arrow">
                  Consultar ruta
                </Button>
              </article>
            ))}
          </div>

          <div className="section-head section-head--center">
            <h2 id="transporte">Opciones de transporte</h2>
          </div>

          <div className="transport-grid">
            {transportOptions.map((option) => (
              <article key={option.title} className="transport-card">
                <Placeholder />
                <h3>{option.title}</h3>
                <p>{option.text}</p>
              </article>
            ))}
          </div>

          <div className="section-head section-head--center">
            <h2 id="seguridad">Seguridad durante tu visita</h2>
          </div>

          <div className="safety-block">
            <Placeholder className="safety-block__media" />
            <ul className="safety-list">
              {safetyTips.map((tip) => (
                <li key={tip.title}>
                  <span className="safety-list__icon">
                    <Icon name={tip.icon} size={18} />
                  </span>
                  <div className="safety-list__body">
                    <h3>{tip.title}</h3>
                    <p>{tip.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="safety-note">
            Consulta las recomendaciones de seguridad antes de visitar
            Gramalote y sus espacios naturales.
          </p>

          <div className="help-note">
            <span className="help-note__icon">
              <Icon name="phone" />
            </span>
            <div>
              <strong>¿Necesitas ayuda?</strong>
              <p>Consulta los contactos de emergencia en esta misma página.</p>
            </div>
          </div>

          <div className="preparation" id="antes-de-salir">
            <p className="eyebrow">Antes de salir</p>
            <h2>Prepara tu visita a Gramalote</h2>

            <div className="preparation__grid">
              {preparationTips.map((tip) => (
                <article key={tip.title} className="preparation-card">
                  <span className="preparation-card__icon">
                    <Icon name={tip.icon} size={30} />
                  </span>
                  <h3>{tip.title}</h3>
                  <p>{tip.text}</p>
                </article>
              ))}
            </div>
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
                <Placeholder className="contact-card__media" />
                <div className="contact-card__body">
                  <h3>{contact.title}</h3>
                  <p>{contact.text}</p>
                  <span>
                    <Icon name="phone" size={16} /> {contact.phone}
                  </span>
                  <span>
                    <Icon name="clock" size={16} /> {contact.hours}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="location-block">
            <span className="location-block__icon">
              <Icon name="pin" size={34} />
            </span>
            <h2 id="ubicacion">Ubicación</h2>
            <p>Mapa o acceso a la ubicación de Gramalote.</p>
            <Button to="/mapa" icon="arrow">
              Ver ubicación en el mapa
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
