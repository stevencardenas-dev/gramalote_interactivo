import PageHero from '../components/ui/PageHero.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'

export default function Mapa() {
  return (
    <>
      <PageHero
        eyebrow="Mapa interactivo"
        title="Explora el mapa"
        intro="Filtra por categoría y consulta los lugares de Gramalote Nuevo y Gramalote Viejo. Los sitios naturales se muestran como referencia."
      />

      <section className="section">
        <div className="container">
          <div className="map-visual" style={{ aspectRatio: '16 / 9' }}>
            <div className="map-visual__grid" />
            <div className="map-visual__river" />
            <span className="map-visual__pin" style={{ left: '24%', top: '38%' }}>
              <Icon name="pin" />
            </span>
            <span className="map-visual__pin" style={{ left: '52%', top: '58%' }}>
              <Icon name="pin" />
            </span>
            <span className="map-visual__pin" style={{ left: '74%', top: '32%' }}>
              <Icon name="pin" />
            </span>
            <div className="map-visual__legend">
              <span>
                <i /> Gramalote Nuevo
              </span>
              <span>
                <i className="is-light" /> Gramalote Viejo
              </span>
            </div>
          </div>

          <p className="note">
            Pendiente integrar el mapa real y los filtros por categoría.
          </p>
          <div className="page-actions" style={{ marginTop: '20px' }}>
            <Button to="/donde-ir" variant="ghost">
              Ver establecimientos
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
