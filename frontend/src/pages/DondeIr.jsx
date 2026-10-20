import PageHero from '../components/ui/PageHero.jsx'
import Placeholder from '../components/ui/Placeholder.jsx'
import Button from '../components/ui/Button.jsx'
import PlaceCard from '../components/cards/PlaceCard.jsx'
import { MapExplorer } from '../components/ui/MapPanel.jsx'
import { getEstablishmentsByCategory } from '../data/establishments.js'

export default function DondeIr() {
  const lodging = getEstablishmentsByCategory('dormir').slice(0, 4)
  const shops = getEstablishmentsByCategory('comprar').slice(0, 3)

  return (
    <>
      <PageHero
        title="Dónde ir"
        breadcrumb={[
          { label: 'Inicio', to: '/' },
          { label: 'Dónde ir' },
        ]}
      />

      <section className="section section--intro">
        <div className="container">
          <p className="page-intro">
            Descubre los lugares turísticos, dónde comer, dónde alojarte y
            dónde comprar productos locales en Gramalote.
          </p>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <MapExplorer
            title="Explora Gramalote en el mapa"
            text="Encuentra lugares turísticos, restaurantes, alojamientos y artesanos, y consulta su ubicación."
            cta="Explorar mapa"
          />

          <div className="category-spotlight">
            <div className="category-spotlight__body">
              <p className="eyebrow">Gastronomía local</p>
              <h2>Dónde comer</h2>
              <p>
                Descubre restaurantes, cafeterías, comidas típicas y sabores de
                Gramalote.
              </p>
              <Button to="/donde-comer" variant="secondary">
                Ver restaurantes
              </Button>
            </div>
            <div className="photo-collage photo-collage--right">
              <Placeholder className="photo-collage__tall" />
              <Placeholder />
              <Placeholder />
            </div>
          </div>

          <div className="section-head section-head--center lodging-head">
            <p className="eyebrow">Alojamientos en Gramalote</p>
            <h2>Dónde dormir</h2>
          </div>

          <div className="place-grid place-grid--four">
            {lodging.map((item) => (
              <PlaceCard
                key={item.id}
                title={item.name}
                to={`/establecimiento/${item.slug}`}
                summary={item.summary}
              />
            ))}
          </div>

          <div className="center-action">
            <Button to="/donde-dormir" variant="secondary">
              Ver alojamientos
            </Button>
          </div>

          <div className="shops-block">
            <div className="shops-block__feature">
              {shops[0] ? (
                <PlaceCard
                  title={shops[0].name}
                  to={`/establecimiento/${shops[0].slug}`}
                  summary={shops[0].summary}
                />
              ) : null}
            </div>

            <div className="shops-block__intro">
              <p className="eyebrow">Artesanías y productos locales</p>
              <h2>Dónde comprar</h2>
              <p>
                Conoce a los artesanos de Gramalote y descubre tejidos,
                bisutería, decoración y productos hechos a mano.
              </p>
              <Button to="/donde-comprar" variant="secondary">
                Ver sitios
              </Button>
            </div>

            <div className="shops-block__grid">
              {shops.slice(1).map((item) => (
                <PlaceCard
                  key={item.id}
                  title={item.name}
                  to={`/establecimiento/${item.slug}`}
                  summary={item.summary}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
