import PageHero from '../components/ui/PageHero.jsx'
import Photo from '../components/ui/Photo.jsx'
import Button from '../components/ui/Button.jsx'
import ListingCard from '../components/cards/ListingCard.jsx'
import PlaceCard from '../components/cards/PlaceCard.jsx'
import FilterBar, { FilterSelect, FilterToggle } from '../components/ui/FilterBar.jsx'
import MapPanel from '../components/ui/MapPanel.jsx'
import { categories } from '../data/establishments.js'
import { orderBySlugs, useEstablishments } from '../lib/contentApi.js'

export default function DondeComer() {
  const meta = categories.comer
  const { data: comer, loading, error } = useEstablishments('comer')
  const { data: dormir } = useEstablishments('dormir')

  const places = orderBySlugs(comer, [
    'bambu',
    'dona-claudia',
    'dulce-paseo',
    'fresas-con-crema-carvajal',
    'la-sazon-de-la-tia',
    'la-comarca',
  ])

  const lodging = orderBySlugs(dormir, [
    'glamping-vista-antigua',
    'hostal-campestre-camino-real',
    'hostal-luna-azul',
    'cabanas-el-penon',
  ]).slice(0, 4)

  return (
    <>
      <PageHero
        image="/img/ficha/bambu-hero.jpg"
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
            <FilterToggle label="Abierto hoy" />
            <span className="filter-divider" aria-hidden="true" />
            <FilterSelect label="Tipo" options={[meta.filterAll, ...meta.filters]} />
          </FilterBar>

          {loading ? (
            <p className="note">Cargando establecimientos…</p>
          ) : error ? (
            <p className="auth-error">{error}</p>
          ) : places.length === 0 ? (
            <p className="empty">Todavía no hay establecimientos publicados.</p>
          ) : (
            <div className="listing-grid-v">
              {places.map((item) => (
                <ListingCard key={item.id} item={item} />
              ))}
            </div>
          )}


          <MapPanel
            title={meta.mapTitle}
            cta={meta.mapCta}
            to="/mapa"
            groups={['comer']}
          />

          <div className="cross-section">
            <div className="section-head section-head--center">
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
                  photo={item.photo}
                />
              ))}
            </div>

            <div className="center-action">
              <Button to="/donde-dormir" variant="secondary">
                Ver alojamientos
              </Button>
            </div>
          </div>

          <div className="split-feature">
            <div className="split-feature__body">
              <p className="eyebrow">Describe Gramalote</p>
              <h2>Curiosidades</h2>
              <p>
                Conoce las tradiciones, la naturaleza, la gastronomía y los
                detalles que hacen único a Gramalote.
              </p>
              <Button to="/curiosidades" variant="secondary">
                Ver más
              </Button>
            </div>
            <Photo src="/img/home/historia.jpg" alt="Calle de Gramalote" className="split-feature__media" />
          </div>
        </div>
      </section>
    </>
  )
}
