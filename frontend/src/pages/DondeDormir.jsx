import PracticalInfo from '../components/home/PracticalInfo.jsx'
import PageHero from '../components/ui/PageHero.jsx'
import Button from '../components/ui/Button.jsx'
import ListingCard from '../components/cards/ListingCard.jsx'
import PlaceCard from '../components/cards/PlaceCard.jsx'
import FilterBar, { FilterSelect } from '../components/ui/FilterBar.jsx'
import MapPanel from '../components/ui/MapPanel.jsx'
import HistoryBlock from '../components/home/HistoryBlock.jsx'
import { categories } from '../data/establishments.js'
import { orderBySlugs, useEstablishments } from '../lib/contentApi.js'

export default function DondeDormir() {
  const meta = categories.dormir
  const { data: places, loading, error } = useEstablishments('dormir')
  const { data: comprar } = useEstablishments('comprar')
  const shops = orderBySlugs(comprar, ['maestros-de-la-madera', 'creaciones-martina']).slice(0, 2)

  return (
    <>
      <PageHero
        image="/img/home/hero-donde-dormir.jpg"
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
            <FilterSelect label={meta.filterLabel} options={[meta.filterAll, ...meta.filters]} />
            <span className="filter-divider" aria-hidden="true" />
            <FilterSelect label={meta.serviceLabel} options={[meta.serviceAll, ...meta.services]} />
          </FilterBar>

          {loading ? (
            <p className="note">Cargando alojamientos…</p>
          ) : error ? (
            <p className="auth-error">{error}</p>
          ) : places.length === 0 ? (
            <p className="empty">Todavía no hay alojamientos publicados.</p>
          ) : (
            <div className="listing-grid-v">
              {places.map((item) => (
                <ListingCard key={item.id} item={item} />
              ))}
            </div>
          )}

          <MapPanel title={meta.mapTitle} cta={meta.mapCta} to="/mapa" groups={['dormir']} />

          <div className="cross-section">
            <div className="section-head section-head--center">
              <p className="eyebrow">Artesanías y productos locales</p>
              <h2>{meta.relationTitle}</h2>
              <p>{meta.relationText}</p>
            </div>

            <div className="place-grid place-grid--two">
              {shops.map((item) => (
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
              <Button to="/donde-comprar" icon="arrow">
                {meta.relationCta}
              </Button>
            </div>
          </div>

          <HistoryBlock embedded />
        </div>
      </section>

      <PracticalInfo />
    </>
  )
}
