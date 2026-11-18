import HeroFicha from '../components/ui/HeroFicha.jsx'
import InfoBar from '../components/ui/InfoBar.jsx'
import FichaHorario from '../components/ui/FichaHorario.jsx'
import Photo from '../components/ui/Photo.jsx'
import Button from '../components/ui/Button.jsx'
import { locationButtonProps } from '../lib/maps.js'
import { fichaInfoItems } from '../lib/fichaInfo.js'
import RelatedPlaces from '../components/cards/RelatedPlaces.jsx'
import { categories } from '../data/establishments.js'

const info = categories.comer

const money = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

// Rejilla de 6 pistas: filas de 3 (span 2) y, si sobran, filas de 2 (span 3).
// Así 2 → 2, 4 → 2+2, 5 → 3+2, 7 → 3+2+2, sin huecos al final.
function offerSpan(index, total) {
  if (total === 1) return 6
  const rest = total % 3
  if (rest === 1 && index >= total - 4) return 3
  if (rest === 2 && index >= total - 2) return 3
  return 2
}

// La oferta sale de «Productos» del panel; si la ficha aún no tiene, de las
// tarjetas destacadas y, por último, de tres tarjetas genéricas.
export default function EstablecimientoComer({ item }) {
  const offer = (item.products ?? []).map((product) => ({
    title: product.name,
    text: product.description,
    photo: product.photo,
    price: product.price,
  }))
  const features = (offer.length > 0 ? offer : item.features) ?? [
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

          <div className={`offer-grid${features.length === 1 ? ' offer-grid--single' : ''}`}>
            {features.map((feature, index) => (
              <article
                key={feature.title}
                className="offer-card"
                style={{ '--offer-span': offerSpan(index, features.length) }}
              >
                <Photo src={feature.photo ?? item.photo} alt={feature.title} />
                <h3>{feature.title}</h3>
                {feature.text ? <p>{feature.text}</p> : null}
                {feature.price ? <p className="offer-card__price">{money.format(feature.price)}</p> : null}
              </article>
            ))}
          </div>

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
