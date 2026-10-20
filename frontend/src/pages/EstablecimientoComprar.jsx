import HeroFicha from '../components/ui/HeroFicha.jsx'
import InfoBar from '../components/ui/InfoBar.jsx'
import Placeholder from '../components/ui/Placeholder.jsx'
import Button from '../components/ui/Button.jsx'
import RelatedPlaces from '../components/cards/RelatedPlaces.jsx'

export default function EstablecimientoComprar({ item }) {
  return (
    <>
      <HeroFicha
        variant="split"
        eyebrow={item.type}
        title={item.name}
        summary={item.description}
        social={['instagram', 'facebook']}
        dots={false}
        breadcrumb={[
          { label: 'Inicio', to: '/' },
          { label: 'Dónde ir', to: '/donde-ir' },
          { label: 'Dónde comprar', to: '/donde-comprar' },
          { label: item.name },
        ]}
      />

      <div className="container container--narrow">
        <InfoBar
          items={[
            { icon: 'clock', label: 'Horario', value: item.hours },
            { icon: 'pin', label: 'Dirección', value: item.address },
            { icon: 'lock', label: 'Métodos de pago', value: item.payment },
            { icon: 'phone', label: 'Teléfono', value: item.phone },
          ]}
        />

        <section className="offer">
          <div className="section-head section-head--center">
            <h2>Productos</h2>
            <p>
              Descubre detalles hechos a mano, desde amigurumis y velas
              artesanales hasta jabones, llaveros y regalos personalizados.
            </p>
          </div>

          <div className="product-grid">
            {item.products.map((product) => (
              <figure key={product} className="product-card">
                <Placeholder />
                <figcaption>{product}</figcaption>
              </figure>
            ))}
          </div>

          <div className="center-action">
            <Button to="/mapa" icon="arrow">
              Ver ubicación en el mapa
            </Button>
          </div>
        </section>
      </div>

      <RelatedPlaces slugs={item.related} />
    </>
  )
}
