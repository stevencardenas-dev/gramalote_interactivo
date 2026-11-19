import HeroFicha from '../components/ui/HeroFicha.jsx'
import InfoBar from '../components/ui/InfoBar.jsx'
import FichaHorario from '../components/ui/FichaHorario.jsx'
import OfferGrid from '../components/ui/OfferGrid.jsx'
import Button from '../components/ui/Button.jsx'
import { locationButtonProps } from '../lib/maps.js'
import { fichaInfoItems } from '../lib/fichaInfo.js'
import RelatedPlaces from '../components/cards/RelatedPlaces.jsx'
import { categories } from '../data/establishments.js'

const info = categories.comprar

export default function EstablecimientoComprar({ item }) {
  // Datos viejos traen productos como texto; del panel llegan como objetos.
  const products = (item.products ?? []).map((product) => (typeof product === 'string' ? { name: product } : product))

  return (
    <>
      <HeroFicha
        eyebrow={item.type}
        title={item.name}
        rating={{ kind: 'establecimiento', slug: item.slug }}
        summary={item.summary}
        image={item.hero ?? '/img/home/hero.jpg'}
        images={item.heroes}
        imageAlt={item.name}
        pillTone="gold"
        social={['share']}
        links={item.socialLinks}
        dots={false}
        breadcrumb={[
          { label: 'Inicio', to: '/' },
          { label: 'Dónde ir', to: '/donde-ir' },
          { label: 'Dónde comprar', to: '/donde-comprar' },
          { label: item.name },
        ]}
      />

      <div className="container">
        <InfoBar items={fichaInfoItems(item)} />
      </div>

      <FichaHorario item={item} />

      <section className="ficha-section ficha-section--comprar">
        <div className="container">
          <div className="section-head section-head--center">
            <h2>Nuestras creaciones</h2>
            <p>{item.description}</p>
          </div>

          <OfferGrid products={products} fallbackPhoto={item.photo} name={item.name} />

          <div className="center-action">
            <Button {...locationButtonProps(item)} icon="arrow">
              Ver ubicación en el mapa
            </Button>
          </div>
        </div>
      </section>

      <RelatedPlaces
        items={item.relatedItems}
        exclude={item.slug}
        category={item.category}
        title={info.relationTitle}
        text={info.relationText}
      />
    </>
  )
}
