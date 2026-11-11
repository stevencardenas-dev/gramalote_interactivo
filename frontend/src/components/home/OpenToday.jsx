import EstablishmentCard from '../cards/EstablishmentCard.jsx'
import Button from '../ui/Button.jsx'
import { PAGE_DEFAULTS } from '../../data/pages.js'
import { resolveLink } from '../../lib/pageContent.js'

export default function OpenToday({ items = PAGE_DEFAULTS.inicio.highlights }) {
  const cards = items
    .map((item) => ({ ...item, ...resolveLink(item.link) }))
    .filter((item) => item.available)

  return (
    <section className="open-today" aria-labelledby="open-title">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Abierto hoy en Gramalote</p>
          <h2 id="open-title">
            Descubre establecimientos disponibles para tu visita
          </h2>
        </div>

        <div className="entity-grid">
          {cards.map((card) => (
            <EstablishmentCard key={card.id} establishment={{ title: card.title, photo: card.photo, to: card.to }} />
          ))}
        </div>

        <Button to="/donde-ir" icon="arrow" className="open-today__more">
          Explora más lugares
        </Button>
      </div>
    </section>
  )
}
