import { Link } from 'react-router-dom'
import Placeholder from '../ui/Placeholder.jsx'
import Icon from '../ui/Icon.jsx'

export default function EstablishmentCard({ establishment }) {
  const title = establishment.name ?? establishment.title

  return (
    <Link className="entity-card" to={establishment.to ?? `/establecimiento/${establishment.slug}`}>
      <Placeholder />
      <div className="entity-card__top">
        <h3 className="entity-card__name">{title}</h3>
      </div>
      <div className="entity-card__bottom">
        <span className="entity-card__link">
          Ver ficha
          <Icon name="arrow" />
        </span>
      </div>
    </Link>
  )
}
