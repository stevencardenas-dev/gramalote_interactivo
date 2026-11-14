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
import { arrange, usePageContent } from '../lib/pageContent.js'
import { matchesPriceRange, usePagedList } from '../lib/listing.js'

export default function DondeComprar() {
  const meta = categories.comprar
  const [type, setType] = useState(meta.filterAll)
  const [price, setPrice] = useState(meta.priceAll)
  const { data: shops, loading, error } = useEstablishments('comprar')
  // Orden y fotos de las tarjetas y de las referencias: Páginas › Dónde comprar.
  const page = usePageContent('donde-comprar')
  const places = arrange(shops, page.order, page.covers)
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
            <p className="auth-error" role="alert">{error}</p>
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
              {page.platos.images.slice(0, 3).map((image, index) => (
                <Photo
                  key={image.id ?? index}
                  src={image.photo}
                  alt={image.alt ?? ''}
                  className={index === 0 ? 'photo-collage__tall' : undefined}
                />
              ))}
            </div>
          </div>

          <div className="split-feature split-feature--reverse">
            <div className="split-feature__body">
              <h2>Encuentra dónde comer</h2>
              <p>
                Explora los restaurantes, cafeterías y otros establecimientos
                gastronómicos de Gramalote en el mapa interactivo.
              </p>
              <Button to="/mapa?categoria=comer" icon="arrow">
                Ver restaurantes en el mapa
              </Button>
            </div>
            <Photo src={page.mapa.photo} alt={page.mapa.alt ?? ''} className="split-feature__media" />
          </div>
        </div>
      </section>

      <PracticalInfo />
    </>
  )
}
