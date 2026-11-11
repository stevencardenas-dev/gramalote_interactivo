import PracticalInfo from '../components/home/PracticalInfo.jsx'
import PageHero from '../components/ui/PageHero.jsx'
import Photo from '../components/ui/Photo.jsx'
import Button from '../components/ui/Button.jsx'
import PlaceCard from '../components/cards/PlaceCard.jsx'
import { MapExplorer } from '../components/ui/MapPanel.jsx'
import { useEstablishments } from '../lib/contentApi.js'
import { pickRelated, usePageContent } from '../lib/pageContent.js'
import { RELATED_COUNT } from '../data/pages.js'

export default function DondeIr() {
  const { data: dormir, loading: loadingDormir, error: errorDormir } = useEstablishments('dormir')
  const { data: comprar, loading: loadingComprar, error: errorComprar } = useEstablishments('comprar')

  // Textos, fotos y fichas de cada bloque: Páginas › Dónde ir, en el panel.
  const page = usePageContent('donde-ir')
  const lodging = pickRelated(dormir, page.dormir, RELATED_COUNT['donde-ir.dormir'])
  const shops = pickRelated(comprar, page.comprar, RELATED_COUNT['donde-ir.comprar'])
  const collage = page.comer.images

  const loading = loadingDormir || loadingComprar
  const error = errorDormir || errorComprar

  return (
    <>
      <PageHero
        image="/img/home/hero-donde-ir.jpg"
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
              {page.comer.eyebrow ? <p className="eyebrow">{page.comer.eyebrow}</p> : null}
              <h2>{page.comer.title}</h2>
              {page.comer.text ? <p>{page.comer.text}</p> : null}
              <Button to="/donde-comer" variant="secondary">
                Ver restaurantes
              </Button>
            </div>
            <div className="photo-collage photo-collage--right">
              {collage.slice(0, 3).map((image, index) => (
                <Photo
                  key={image.id ?? index}
                  src={image.photo}
                  alt={image.alt ?? ''}
                  className={index === 0 ? 'photo-collage__tall' : undefined}
                />
              ))}
            </div>
          </div>

          <div className="section-head section-head--center lodging-head">
            {page.dormir.eyebrow ? <p className="eyebrow">{page.dormir.eyebrow}</p> : null}
            <h2>{page.dormir.title}</h2>
          </div>

          {error ? <p className="auth-error">{error}</p> : null}

          {loading ? (
            <p className="note">Cargando alojamientos…</p>
          ) : (
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
          )}

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
                  photo={shops[0].photo}
                />
              ) : null}
            </div>

            <div className="shops-block__intro">
              {page.comprar.eyebrow ? <p className="eyebrow">{page.comprar.eyebrow}</p> : null}
              <h2>{page.comprar.title}</h2>
              {page.comprar.text ? <p>{page.comprar.text}</p> : null}
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
                  photo={item.photo}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <PracticalInfo />
    </>
  )
}
