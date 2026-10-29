import HeroFicha from '../components/ui/HeroFicha.jsx'
import InfoBar from '../components/ui/InfoBar.jsx'
import Photo from '../components/ui/Photo.jsx'
import Button from '../components/ui/Button.jsx'
import RelatedPlaces from '../components/cards/RelatedPlaces.jsx'
import { categories } from '../data/establishments.js'

const info = categories.comer

export default function EstablecimientoComer({ item }) {
  const features = item.features ?? [
    { title: item.type, text: item.summary, photo: item.photo },
    {
      title: 'Atención cercana',
      text: 'Un espacio pensado para visitantes y habitantes de Gramalote.',
      photo: item.photo,
    },
    {
      title: 'Sabores locales',
      text: 'Preparaciones que rescatan los ingredientes y las costumbres de la región.',
      photo: item.photo,
    },
  ]

  return (
    <>
      <HeroFicha
        eyebrow={item.type}
        title={item.name}
        summary={item.summary}
        image={item.hero ?? '/img/home/hero.jpg'}
        imageAlt={item.name}
        social={['instagram', 'share']}
        breadcrumb={[
          { label: 'Inicio', to: '/' },
          { label: 'Dónde ir', to: '/donde-ir' },
          { label: 'Dónde comer', to: '/donde-comer' },
          { label: item.name },
        ]}
      />

      <div className="container">
        <InfoBar
          items={[
            { icon: 'horario', label: 'Horario', value: item.hours },
            { icon: 'ubicacion', label: 'Ubicación', value: item.address },
            { icon: 'billetera', label: 'Métodos de pago', value: item.payment },
            { icon: 'telefono', label: 'Teléfono', value: item.phone },
          ]}
        />
      </div>

      <section className="ficha-section ficha-section--comer">
        <div className="container">
          <div className="section-head section-head--center">
            <h2>Nuestra oferta</h2>
            <p>{item.description}</p>
          </div>

          <div className="offer-grid">
            {features.map((feature) => (
              <article key={feature.title} className="offer-card">
                <Photo src={feature.photo ?? item.photo} alt={feature.title} />
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
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
