import HeroFicha from '../components/ui/HeroFicha.jsx'
import InfoBar from '../components/ui/InfoBar.jsx'
import Photo from '../components/ui/Photo.jsx'
import Button from '../components/ui/Button.jsx'
import RelatedPlaces from '../components/cards/RelatedPlaces.jsx'
import { categories } from '../data/establishments.js'

const info = categories.comprar

export default function EstablecimientoComprar({ item }) {
  const products = item.products ?? []

  return (
    <>
      <HeroFicha
        eyebrow={item.type}
        title={item.name}
        summary={item.summary}
        image={item.hero ?? '/img/home/hero.jpg'}
        imageAlt={item.name}
        pillTone="gold"
        social={['instagram']}
        dots={false}
        breadcrumb={[
          { label: 'Inicio', to: '/' },
          { label: 'Dónde ir', to: '/donde-ir' },
          { label: 'Dónde comprar', to: '/donde-comprar' },
          { label: item.name },
        ]}
      />

      <div className="container">
        <InfoBar
          items={[
            { icon: 'horario', label: 'Horario', value: item.hours },
            { icon: 'ubicacion', label: 'Ubicación', value: item.address },
            { icon: 'billetera', label: 'Precios', value: item.priceRange },
            { icon: 'telefono', label: 'Teléfono', value: item.phone },
          ]}
        />
      </div>

      <section className="ficha-section ficha-section--comprar">
        <div className="container">
          <div className="section-head section-head--center">
            <h2>Nuestras creaciones</h2>
            <p>{item.description}</p>
          </div>

          <div className="product-grid">
            {products.map((product, index) => {
              const src = typeof product === 'string' ? item.photo : product.photo
              const alt = typeof product === 'string' ? product : product.name
              return <Photo key={`${alt}-${index}`} src={src ?? item.photo} alt={alt} />
            })}
          </div>

          <div className="center-action">
            <Button to="/mapa" icon="arrow">
              Ver ubicación en el mapa
            </Button>
          </div>
        </div>
      </section>

      <RelatedPlaces
        items={item.relatedItems}
        title={info.relationTitle}
        text={info.relationText}
      />
    </>
  )
}
