import HeroFicha from '../components/ui/HeroFicha.jsx'
import InfoBar from '../components/ui/InfoBar.jsx'
import Placeholder from '../components/ui/Placeholder.jsx'
import Button from '../components/ui/Button.jsx'
import RelatedPlaces from '../components/cards/RelatedPlaces.jsx'

export default function EstablecimientoComer({ item }) {
  const features = item.features ?? [
    { title: item.type, text: item.summary },
    {
      title: 'Atención cercana',
      text: 'Un espacio pensado para visitantes y habitantes de Gramalote.',
    },
    {
      title: 'Sabores locales',
      text: 'Preparaciones que rescatan los ingredientes y las costumbres de la región.',
    },
  ]

  return (
    <>
      <HeroFicha
        variant="split"
        eyebrow={item.type}
        title={item.name}
        summary={item.summary}
        social={['instagram', 'facebook']}
        breadcrumb={[
          { label: 'Inicio', to: '/' },
          { label: 'Dónde ir', to: '/donde-ir' },
          { label: 'Dónde comer', to: '/donde-comer' },
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
            <h2>Nuestra oferta</h2>
            <p>{item.description}</p>
          </div>

          <div className="offer__grid">
            {features.map((feature) => (
              <article key={feature.title} className="offer-card">
                <Placeholder />
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
        </section>
      </div>

      <RelatedPlaces
        slugs={item.related}
        title="También puedes disfrutar en Gramalote"
        text="Explora otras opciones gastronómicas del municipio y descubre lugares donde disfrutar de sabores locales y diferentes propuestas para compartir."
      />
    </>
  )
}
