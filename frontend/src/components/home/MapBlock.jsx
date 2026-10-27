import Button from '../ui/Button.jsx'
import Photo from '../ui/Photo.jsx'

export default function MapBlock() {
  return (
    <section className="explore-block" aria-labelledby="map-title">
      <div className="container explore-block__inner">
        <div className="explore-block__body">
          <h2 id="map-title">Explora Gramalote Nuevo y Gramalote Viejo</h2>
          <p>
            Ubica los lugares de interés y distingue Gramalote Nuevo de
            Gramalote Viejo. Consulta las fichas y explora los sitios naturales
            como referencia.
          </p>
          <Button to="/mapa" icon="arrow">
            Explorar mapa
          </Button>
        </div>

        <Photo
          className="explore-block__media"
          src="/img/home/explora.jpg"
          alt="Calle de Gramalote Nuevo con montañas al fondo"
        />
      </div>
    </section>
  )
}
