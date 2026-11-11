import PracticalInfo from '../components/home/PracticalInfo.jsx'
import PageHero from '../components/ui/PageHero.jsx'
import Button from '../components/ui/Button.jsx'
import ListingCard from '../components/cards/ListingCard.jsx'
import PlaceCard from '../components/cards/PlaceCard.jsx'
import FilterBar, { FilterSelect } from '../components/ui/FilterBar.jsx'
import MapPanel from '../components/ui/MapPanel.jsx'
import HistoryBlock from '../components/home/HistoryBlock.jsx'
import { categories } from '../data/establishments.js'
import { useState } from 'react'
import { useEstablishments } from '../lib/contentApi.js'
import { arrange, pickRelated, usePageContent } from '../lib/pageContent.js'
import { RELATED_COUNT } from '../data/pages.js'
import { usePagedList } from '../lib/listing.js'

export default function DondeDormir() {
  const meta = categories.dormir
  const [type, setType] = useState(meta.filterAll)
  const [service, setService] = useState(meta.serviceAll)
  const { data: lodging, loading, error } = useEstablishments('dormir')
  // Orden, fotos y referencia a Dónde comprar: Páginas › Dónde dormir.
  const page = usePageContent('donde-dormir')
  const places = arrange(lodging, page.order, page.covers)
  const filtered = places.filter(
    (item) =>
      (type === meta.filterAll || item.filterGroup === type) &&
      (service === meta.serviceAll || item.services.includes(service)),
  )
  const { visible, hasMore, loadMore } = usePagedList(filtered, `${type}|${service}`)
  const { data: comprar } = useEstablishments('comprar')
  const shops = pickRelated(comprar, page.related, RELATED_COUNT['donde-dormir'])

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
            <FilterSelect
              label={meta.filterLabel}
              options={[meta.filterAll, ...meta.filters]}
              value={type}
              onChange={setType}
            />
            <span className="filter-divider" aria-hidden="true" />
            <FilterSelect
              label={meta.serviceLabel}
              options={[meta.serviceAll, ...meta.services]}
              value={service}
              onChange={setService}
            />
          </FilterBar>

          {loading ? (
            <p className="note">Cargando alojamientos…</p>
          ) : error ? (
            <p className="auth-error">{error}</p>
          ) : places.length === 0 ? (
            <p className="empty">Todavía no hay alojamientos publicados.</p>
          ) : filtered.length === 0 ? (
            <p className="empty">Ningún alojamiento coincide con los filtros elegidos.</p>
          ) : (
            <div className="listing-grid-v">
              {visible.map((item) => (
                <ListingCard key={item.id} item={item} />
              ))}
            </div>
          )}

          {hasMore ? (
            <div className="center-action">
              <Button variant="secondary" onClick={loadMore}>
                Cargar más
              </Button>
            </div>
          ) : null}

          <MapPanel title={meta.mapTitle} cta={meta.mapCta} to="/mapa" groups={['dormir']} />

          <div className="cross-section">
            <div className="section-head section-head--center">
              {page.related.eyebrow ? <p className="eyebrow">{page.related.eyebrow}</p> : null}
              <h2>{page.related.title}</h2>
              {page.related.text ? <p>{page.related.text}</p> : null}
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
