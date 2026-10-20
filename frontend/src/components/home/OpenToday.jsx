import { homeHighlights } from '../../data/inicio.js'
import EstablishmentCard from '../cards/EstablishmentCard.jsx'
import Button from '../ui/Button.jsx'

export default function OpenToday() {
  return (
    <section className="section" aria-labelledby="open-title">
      <div className="container">
        <div className="open-today__head">
          <div className="section-head">
            <p className="eyebrow">Abierto hoy en Gramalote</p>
            <h2 id="open-title">
              Descubre establecimientos disponibles para tu visita
            </h2>
          </div>
        </div>

        <div className="entity-grid">
          {homeHighlights.map((item) => (
            <EstablishmentCard key={item.id} establishment={item} />
          ))}
        </div>

        <Button to="/donde-ir" icon="arrow" className="open-today__more">
          Explora más lugares
        </Button>
      </div>
    </section>
  )
}
