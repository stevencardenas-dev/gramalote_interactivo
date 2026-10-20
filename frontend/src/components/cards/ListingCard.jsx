import Placeholder from '../ui/Placeholder.jsx'
import Button from '../ui/Button.jsx'

export default function ListingCard({ item }) {
  return (
    <article className="listing-card-v">
      <Placeholder />
      <div className="listing-card-v__body">
        <span className="listing-card-v__type">{item.type}</span>
        <h3>{item.name}</h3>
        <p>{item.summary}</p>
        <Button
          to={`/establecimiento/${item.slug}`}
          variant="secondary"
          size="sm"
          className="listing-card-v__cta"
        >
          Ver ficha
        </Button>
      </div>
    </article>
  )
}
