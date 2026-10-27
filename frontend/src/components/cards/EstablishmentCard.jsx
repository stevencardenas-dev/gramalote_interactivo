import { Link } from 'react-router-dom'
import Photo from '../ui/Photo.jsx'

export default function EstablishmentCard({ establishment }) {
  const title = establishment.name ?? establishment.title
  const to = establishment.to ?? `/establecimiento/${establishment.slug}`

  return (
    <Link className="entity-card" to={to}>
      <Photo src={establishment.photo} alt={title} />
      <div className="entity-card__top">
        <h3 className="entity-card__name">{title}</h3>
      </div>
      <div className="entity-card__bottom">
        <span className="entity-card__link">Ver ficha</span>
      </div>
    </Link>
  )
}
