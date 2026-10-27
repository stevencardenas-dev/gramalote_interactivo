import { Link } from 'react-router-dom'
import Photo from '../ui/Photo.jsx'
import Icon from '../ui/Icon.jsx'
import { getEstablishment } from '../../data/establishments.js'

export default function RelatedPlaces({
  slugs = [],
  title = 'También puedes disfrutar en Gramalote',
  text = 'Explora otras opciones del municipio y descubre lugares con propuestas para compartir.',
}) {
  const items = slugs.map(getEstablishment).filter(Boolean)

  return (
    <section className="related">
      <div className="container">
        <div className="section-head section-head--center">
          <h2>{title}</h2>
          <p>{text}</p>
        </div>

        <div className="related-grid">
          {items.map((item) => (
            <Link key={item.id} className="related-card" to={`/establecimiento/${item.slug}`}>
              <Photo src={item.photo} alt={item.name} />
              <div className="related-card__body">
                <span className="related-card__type">{item.type}</span>
                <h3>{item.name}</h3>
                <span className="related-card__link">
                  Ver más
                  <Icon name="chevron-right" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
