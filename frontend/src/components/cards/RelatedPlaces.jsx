import { Link } from 'react-router-dom'
import Icon from '../ui/Icon.jsx'
import { getEstablishment } from '../../data/establishments.js'

export default function RelatedPlaces({
  slugs,
  title = 'Lugares relacionados',
  text = 'También puedes conocer otras opciones de alojamiento en Gramalote y elegir la que mejor se adapte a tu visita.',
}) {
  const items = slugs.map(getEstablishment).filter(Boolean)

  return (
    <section className="section section--tight">
      <div className="container">
        <div className="section-head section-head--center">
          <h2>{title}</h2>
          <p>{text}</p>
        </div>

        <div className="related-grid">
          {items.map((item) => (
            <Link key={item.id} className="related-card" to={`/establecimiento/${item.slug}`}>
              <div className="related-card__body">
                <div>
                  <h3>{item.name}</h3>
                  <span>{item.type}</span>
                </div>
                <div className="related-card__actions">
                  <span className="related-card__button">Ver más</span>
                  <span className="related-card__link">
                    Explorar
                    <Icon name="arrow" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
