import Button from '../ui/Button.jsx'
import Placeholder from '../ui/Placeholder.jsx'

export default function MapBlock() {
  return (
    <section className="section" aria-labelledby="map-title">
      <div className="map-block container">
        <div className="map-block__content">
          <h2 id="map-title">Explora Gramalote Nuevo y Gramalote Viejo</h2>
          <p>
            Ubica los lugares de interés y distingue Gramalote Nuevo de
            Gramalote Viejo. Consulta las fichas y explora los sitios naturales
            como referencia.
          </p>
          <div className="map-block__actions">
            <Button to="/mapa" icon="arrow">
              Explorar mapa
            </Button>
          </div>
        </div>

        <Placeholder
          className="map-block__media"
          label="Mapa de Gramalote Nuevo y Gramalote Viejo"
        />
      </div>
    </section>
  )
}
