import HeroFicha from '../components/ui/HeroFicha.jsx'
import InfoBar from '../components/ui/InfoBar.jsx'
import Placeholder from '../components/ui/Placeholder.jsx'
import Button from '../components/ui/Button.jsx'
import RelatedPlaces from '../components/cards/RelatedPlaces.jsx'

export default function EstablecimientoDormir({ item }) {
  return (
    <>
      <HeroFicha
        variant="center"
        eyebrow={item.type}
        title={item.name}
        summary={item.description}
        breadcrumb={[
          { label: 'Inicio', to: '/' },
          { label: 'Dónde ir', to: '/donde-ir' },
          { label: 'Dónde dormir', to: '/donde-dormir' },
          { label: item.name },
        ]}
      />

      <div className="container container--narrow">
        <InfoBar
          items={[
            { icon: 'clock', label: 'Check-in / Check-out', value: item.checkin },
            { icon: 'pin', label: 'Ubicación', value: item.address },
            { icon: 'car', label: 'Precio', value: item.priceRange },
            { icon: 'phone', label: 'Teléfono', value: item.phone },
          ]}
        />

        <section className="offer">
          <div className="section-head section-head--center">
            <h2>Instalaciones</h2>
            <p>
              Disfruta de una estancia rodeada de naturaleza, con desayuno,
              servicio de domicilios, salón social para eventos y parqueadero.
            </p>
          </div>

          <div className="gallery gallery--lodging">
            <Placeholder className="gallery__wide" />
            <Placeholder className="gallery__wide" />
            <Placeholder />
            <Placeholder />
            <Placeholder />
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
