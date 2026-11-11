import ExperienceCard from '../cards/ExperienceCard.jsx'
import { PAGE_DEFAULTS } from '../../data/pages.js'
import { resolveLink } from '../../lib/pageContent.js'

// Tarjetas editables en Páginas › Inicio. Una tarjeta que enlaza a una ficha
// despublicada no se muestra.
export default function ExperiencesSection({ items = PAGE_DEFAULTS.inicio.experiences }) {
  const cards = items
    .map((item) => ({ ...item, ...resolveLink(item.link) }))
    .filter((item) => item.available)
  if (cards.length === 0) return null

  return (
    <section className="experiences" aria-labelledby="experiences-title">
      <div className="container">
        <div className="section-head section-head--center">
          <h2 id="experiences-title">Experiencias que no olvidarás</h2>
          <p>Gramalote se vive con los ojos, pies y el paladar</p>
        </div>

        <div className="experiences__grid">
          {cards.map((card, index) => (
            <ExperienceCard
              key={card.id}
              experience={{ title: card.title, description: card.text, photo: card.photo, to: card.to }}
              featured={index === 0}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
