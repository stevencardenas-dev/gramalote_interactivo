import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchTopRated } from '../../lib/ratingsApi.js'
import { StarsRow } from '../ui/RatingStars.jsx'
import Photo from '../ui/Photo.jsx'
import Icon from '../ui/Icon.jsx'

// Recomienda los mejor calificados (sin la ficha actual); si la API no responde
// o aún no hay datos, usa la lista editorial recibida en items.
export default function RelatedPlaces({
  items: fallback = [],
  exclude,
  category,
  title = 'También puedes disfrutar en Gramalote',
  text = 'Explora otras opciones del municipio y descubre lugares con propuestas para compartir.',
}) {
  const [top, setTop] = useState([])

  useEffect(() => {
    const controller = new AbortController()
    fetchTopRated({ exclude, category, limit: 3 }, controller.signal)
      .then(setTop)
      .catch(() => {})
    return () => controller.abort()
  }, [exclude, category])

  const items = top.length > 0 ? top : fallback.filter((item) => item.slug !== exclude)
  if (items.length === 0) return null

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
                {item.votes ? (
                  <span className="related-card__rating">
                    <StarsRow value={item.average} />
                    {item.average.toFixed(1).replace('.', ',')} ({item.votes})
                  </span>
                ) : null}
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
