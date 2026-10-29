import HeroFicha from '../components/ui/HeroFicha.jsx'
import InfoBar from '../components/ui/InfoBar.jsx'
import Photo from '../components/ui/Photo.jsx'
import Button from '../components/ui/Button.jsx'
import RelatedPlaces from '../components/cards/RelatedPlaces.jsx'
import { categories } from '../data/establishments.js'

const info = categories.dormir

export default function EstablecimientoDormir({ item }) {
  const gallery = (item.gallery ?? (item.photo ? [item.photo] : [])).slice(0, 5)

  return (
    <>
      <HeroFicha
        eyebrow={item.type}
        title={item.name}
        summary={item.summary}
        image={item.hero ?? '/img/home/hero.jpg'}
        imageAlt={item.name}
        pillTone="brick"
        social={['instagram']}
        breadcrumb={[
          { label: 'Inicio', to: '/' },
          { label: 'Dónde ir', to: '/donde-ir' },
          { label: 'Dónde dormir', to: '/donde-dormir' },
          { label: item.name },
        ]}
      />

      <div className="container">
        <InfoBar
          items={[
            { icon: 'horario', label: 'Llegada / Salida', value: item.checkin },
            { icon: 'ubicacion', label: 'Ubicación', value: item.address },
            { icon: 'billetera', label: 'Precios', value: item.priceRange },
            { icon: 'telefono', label: 'Teléfono', value: item.phone },
          ]}
        />
      </div>

      <section className="ficha-section ficha-section--dormir">
        <div className="container">
          <div className="section-head section-head--center">
            <h2>Instalaciones</h2>
            <p>{item.description}</p>
          </div>

          {gallery.length >= 5 ? (
            <div className="ficha-gallery">
              <div className="ficha-gallery__top">
                {gallery.slice(0, 2).map((photo, index) => (
                  <Photo key={`top-${index}`} src={photo} alt={`${item.name} ${index + 1}`} />
                ))}
              </div>
              <div className="ficha-gallery__row">
                {gallery.slice(2, 5).map((photo, index) => (
                  <Photo key={`row-${index}`} src={photo} alt={`${item.name} ${index + 3}`} />
                ))}
              </div>
            </div>
          ) : (
            <div className="ficha-gallery__single">
              <Photo
                src={gallery[0] ?? item.photo}
                alt={item.name}
                ratio="21 / 9"
              />
            </div>
          )}

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
