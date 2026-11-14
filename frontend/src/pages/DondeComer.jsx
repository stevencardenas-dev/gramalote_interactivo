import PracticalInfo from '../components/home/PracticalInfo.jsx'
import PageHero from '../components/ui/PageHero.jsx'
import Button from '../components/ui/Button.jsx'
import ListingCard from '../components/cards/ListingCard.jsx'
import PlaceCard from '../components/cards/PlaceCard.jsx'
import FilterBar, { FilterSelect, FilterToggle } from '../components/ui/FilterBar.jsx'
import MapPanel from '../components/ui/MapPanel.jsx'
import PhotoBanner from '../components/ui/PhotoBanner.jsx'
import { categories } from '../data/establishments.js'
import { useState } from 'react'
import { useEstablishments } from '../lib/contentApi.js'
import { arrange, pickRelated, usePageContent } from '../lib/pageContent.js'
import { RELATED_COUNT } from '../data/pages.js'
import { usePagedList } from '../lib/listing.js'

export default function DondeComer() {
  const meta = categories.comer
  const [type, setType] = useState(meta.filterAll)
  const [openOnly, setOpenOnly] = useState(false)
  const { data: comer, loading, error } = useEstablishments('comer')
  const { data: dormir } = useEstablishments('dormir')

  // Orden, fotos y referencia a Dónde dormir: Páginas › Dónde comer.
  const page = usePageContent('donde-comer')
  const places = arrange(comer, page.order, page.covers)

  const filtered = places.filter(
    (item) =>
      (type === meta.filterAll || item.filterGroup === type) &&
      (!openOnly || item.openNow),
  )
  const { visible, hasMore, loadMore } = usePagedList(filtered, `${type}|${openOnly}`)

  const lodging = pickRelated(dormir, page.related, RELATED_COUNT['donde-comer'])

  return (
    <>
      <PageHero
        image="/img/home/hero-donde-comer.jpg"
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
            <FilterToggle label="Abierto hoy" active={openOnly} onChange={setOpenOnly} />
            <span className="filter-divider" aria-hidden="true" />
            <FilterSelect
              label="Tipo"
              options={[meta.filterAll, ...meta.filters]}
              value={type}
              onChange={setType}
            />
          </FilterBar>

          {loading ? (
            <p className="note">Cargando establecimientos…</p>
          ) : error ? (
            <p className="auth-error" role="alert">{error}</p>
          ) : places.length === 0 ? (
            <p className="empty">Todavía no hay establecimientos publicados.</p>
          ) : filtered.length === 0 ? (
            <p className="empty">Ningún establecimiento coincide con los filtros elegidos.</p>
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

          <MapPanel
            title={meta.mapTitle}
            cta={meta.mapCta}
            to="/mapa"
            groups={['comer']}
          />

          <div className="cross-section">
            <div className="section-head section-head--center">
              {page.related.eyebrow ? <p className="eyebrow">{page.related.eyebrow}</p> : null}
              <h2>{page.related.title}</h2>
              {page.related.text ? <p>{page.related.text}</p> : null}
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
        </div>
      </section>

      <PhotoBanner
        image="/img/home/curiosidades-banner.jpg"
        eyebrow="Descubre Gramalote"
        title="Curiosidades"
        text="Conoce las tradiciones, la naturaleza, la gastronomía y los detalles que hacen único a Gramalote."
        cta="Ver curiosidades"
        to="/curiosidades"
      />

      <PracticalInfo />
    </>
  )
}
