import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchTopRated, formatAverage, formatVotes } from '../../lib/ratingsApi.js'
import { StarsRow } from '../ui/RatingStars.jsx'
import Photo from '../ui/Photo.jsx'
import Icon from '../ui/Icon.jsx'

// Recomienda lo elegido en «También puedes visitar» del panel. Solo si la ficha
// no tiene ninguna selección se muestran los mejor calificados. Las dos fuentes
// vienen de la API ya filtradas por publicadas y sin borradores.
export default function RelatedPlaces({
  items: chosen = [],
  exclude,
  category,
  title = 'También puedes disfrutar en Gramalote',
  text = 'Explora otras opciones del municipio y descubre lugares con propuestas para compartir.',
}) {
  const [top, setTop] = useState([])
  const selected = chosen.filter((item) => item && item.slug !== exclude)
  const hasSelection = selected.length > 0

  useEffect(() => {
    if (hasSelection) return undefined
    const controller = new AbortController()
    fetchTopRated({ exclude, category, limit: 3 }, controller.signal)
      .then(setTop)
      .catch(() => {})
    return () => controller.abort()
  }, [hasSelection, exclude, category])

  const items = hasSelection ? selected : top
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
                    {formatAverage(item.average)} <small>({formatVotes(item.votes)})</small>
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
