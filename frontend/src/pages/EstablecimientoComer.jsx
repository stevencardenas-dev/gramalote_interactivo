import HeroFicha from '../components/ui/HeroFicha.jsx'
import InfoBar from '../components/ui/InfoBar.jsx'
import FichaHorario from '../components/ui/FichaHorario.jsx'
import OfferGrid from '../components/ui/OfferGrid.jsx'
import Button from '../components/ui/Button.jsx'
import { locationButtonProps } from '../lib/maps.js'
import { fichaInfoItems } from '../lib/fichaInfo.js'
import RelatedPlaces from '../components/cards/RelatedPlaces.jsx'
import { categories } from '../data/establishments.js'

const info = categories.comer

// La oferta sale solo de «Productos» del panel; sin productos no se muestra.
export default function EstablecimientoComer({ item }) {
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
        social={['share']}
        links={item.socialLinks}
        breadcrumb={[
          { label: 'Inicio', to: '/' },
          { label: 'Dónde ir', to: '/donde-ir' },
          { label: 'Dónde comer', to: '/donde-comer' },
          { label: item.name },
        ]}
      />

      <div className="container">
        <InfoBar items={fichaInfoItems(item)} />
      </div>

      <FichaHorario item={item} />

      <section className="ficha-section ficha-section--comer">
        <div className="container">
          <div className="section-head section-head--center">
            <h2>Nuestra oferta</h2>
            <p>{item.description}</p>
          </div>

          <OfferGrid products={item.products} fallbackPhoto={item.photo} name={item.name} />

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
