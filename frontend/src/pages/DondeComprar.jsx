import PageHero from '../components/ui/PageHero.jsx'
import Photo from '../components/ui/Photo.jsx'
import Button from '../components/ui/Button.jsx'
import ListingCard from '../components/cards/ListingCard.jsx'
import FilterBar, { FilterSelect } from '../components/ui/FilterBar.jsx'
import MapPanel from '../components/ui/MapPanel.jsx'
import { categories, getEstablishmentsByCategory } from '../data/establishments.js'

export default function DondeComprar() {
  const meta = categories.comprar
  const places = getEstablishmentsByCategory('comprar')

  return (
    <>
      <PageHero
        image="/img/ficha/sombreros-techa-sombrero.jpg"
        title={meta.label}
        intro={meta.intro}
        breadcrumb={[
          { label: 'Inicio', to: '/' },
          { label: 'Dónde ir', to: '/donde-ir' },
          { label: meta.label },
        ]}
      />

      <section className="section section--tight">
        <div className="container">
          <FilterBar>
            <FilterSelect
              label={meta.filterLabel}
              options={[meta.filterAll, ...meta.filters]}
            />
            <span className="filter-divider" aria-hidden="true" />
            <FilterSelect
              label={meta.priceLabel}
              options={[meta.priceAll, ...meta.prices]}
            />
          </FilterBar>

          <div className="listing-grid-v">
            {places.slice(0, 6).map((item) => (
              <ListingCard key={item.id} item={item} />
            ))}
          </div>

          <div className="center-action">
            <Button variant="ghost">Cargar más</Button>
          </div>

          <MapPanel title={meta.mapTitle} cta={meta.mapCta} to="/mapa" />

          <div className="split-feature">
            <div className="split-feature__body">
              <p className="eyebrow">Gastronomía local</p>
              <h2>Explora nuestros platos típicos</h2>
              <p>
                Descubre los sabores de Gramalote y conoce algunas de las
                preparaciones que puedes encontrar en sus establecimientos
                gastronómicos.
              </p>
              <Button to="/donde-comer" icon="arrow">
                Descubrir platos típicos
              </Button>
            </div>
            <div className="photo-collage photo-collage--right">
              <Photo src="/img/ficha/sombreros-techa-card.jpg" alt="Sombreros Techa" className="photo-collage__tall" />
              <Photo src="/img/ficha/maestros-de-la-madera-card.jpg" alt="Maestros de la Madera" />
              <Photo src="/img/ficha/creaciones-martina-card.jpg" alt="Creaciones Martina" />
            </div>
          </div>

          <div className="split-feature split-feature--reverse">
            <div className="split-feature__body">
              <h2>Encuentra dónde comer</h2>
              <p>
                Explora los restaurantes, cafeterías y otros establecimientos
                gastronómicos de Gramalote en el mapa interactivo.
              </p>
              <Button to="/donde-comer" icon="arrow">
                Ver restaurantes
              </Button>
            </div>
            <Photo src="/img/home/historia.jpg" alt="Calle de Gramalote" className="split-feature__media" />
          </div>
        </div>
      </section>
    </>
  )
}
