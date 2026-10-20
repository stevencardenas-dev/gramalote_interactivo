import { Link } from 'react-router-dom'
import Placeholder from '../ui/Placeholder.jsx'
import Icon from '../ui/Icon.jsx'

export default function PlaceCard({ title, subtitle, to, summary }) {
  return (
    <Link className="place-card" to={to}>
      <span className="place-card__icon">
        <Icon name="arrow" />
      </span>
      <Placeholder className="place-card__media" />
      <div className="place-card__body">
        <h3>{title}</h3>
        {subtitle ? <span className="place-card__subtitle">{subtitle}</span> : null}
        {summary ? <p>{summary}</p> : null}
      </div>
    </Link>
  )
}
