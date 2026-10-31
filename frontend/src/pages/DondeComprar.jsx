import PracticalInfo from '../components/home/PracticalInfo.jsx'
import PageHero from '../components/ui/PageHero.jsx'
import Photo from '../components/ui/Photo.jsx'
import Button from '../components/ui/Button.jsx'
import ListingCard from '../components/cards/ListingCard.jsx'
import FilterBar, { FilterSelect } from '../components/ui/FilterBar.jsx'
import MapPanel from '../components/ui/MapPanel.jsx'
import { categories } from '../data/establishments.js'
import { useState } from 'react'
import { useEstablishments } from '../lib/contentApi.js'
import { matchesPriceRange, usePagedList } from '../lib/listing.js'

export default function DondeComprar() {
  const meta = categories.comprar
  const [type, setType] = useState(meta.filterAll)
  const [price, setPrice] = useState(meta.priceAll)
  const { data: places, loading, error } = useEstablishments('comprar')
  const priceIndex = meta.prices.indexOf(price)
  const filtered = places.filter(
    (item) =>
      (type === meta.filterAll || item.filterGroup === type) &&
      (priceIndex < 0 || matchesPriceRange(item.priceRange, priceIndex)),
  )
  const { visible, hasMore, loadMore } = usePagedList(filtered, `${type}|${price}`)

  return (
    <>
      <PageHero
        image="/img/home/hero-donde-comprar.jpg"
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
              label={meta.priceLabel}
              options={[meta.priceAll, ...meta.prices]}
              value={price}
              onChange={setPrice}
            />
          </FilterBar>

          {loading ? (
            <p className="note">Cargando artesanías…</p>
          ) : error ? (
            <p className="auth-error">{error}</p>
          ) : places.length === 0 ? (
            <p className="empty">Todavía no hay artesanías publicadas.</p>
          ) : filtered.length === 0 ? (
            <p className="empty">Ninguna artesanía coincide con los filtros elegidos.</p>
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

          <MapPanel title={meta.mapTitle} cta={meta.mapCta} to="/mapa" groups={['comprar']} />

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
              <Photo src="/img/home/platos-1.jpg" alt="Sopa tradicional" className="photo-collage__tall" />
              <Photo src="/img/home/platos-2.jpg" alt="Arepas" />
              <Photo src="/img/home/platos-3.jpg" alt="Café y pan" />
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
            <Photo src="/img/home/donde-comer-bar.jpg" alt="Barra de un restaurante de Gramalote" className="split-feature__media" />
          </div>
        </div>
      </section>

      <PracticalInfo />
    </>
  )
}
