import PageHero from '../components/ui/PageHero.jsx'
import Placeholder from '../components/ui/Placeholder.jsx'
import { heroViejo } from '../data/heroImages.js'

const blocks = [
  {
    title: 'Un pueblo que renació',
    text: 'Gramalote, en Norte de Santander, reconstruyó su historia tras el deslizamiento que transformó el municipio. Su memoria se conserva en la palabra de sus habitantes y en los lugares que hoy lo conforman.',
  },
  {
    title: 'Memoria y reconstrucción',
    text: 'El proyecto reúne acontecimientos, relatos y fotografías que documentan el antes y el después de Gramalote, para que visitantes y habitantes comprendan su proceso.',
  },
  {
    title: 'Patrimonio y cultura',
    text: 'La historia del municipio se expresa también en sus oficios, su gastronomía y sus expresiones culturales.',
  },
]

export default function Historia() {
  return (
    <>
      <PageHero
        image={heroViejo.src}
        credit={heroViejo.credit}
        eyebrow="Memoria del municipio"
        title="Su historia"
        intro="Conoce los acontecimientos y la memoria de Gramalote, un pueblo que renació entre las montañas."
        breadcrumb={[
          { label: 'Inicio', to: '/' },
          { label: 'Su historia' },
        ]}
      />

      <section className="section">
        <div className="container container--narrow">
          {blocks.map((block, index) => (
            <article
              key={block.title}
              className={`curiosity-detail__row${index % 2 === 1 ? ' is-reverse' : ''}`}
            >
              <Placeholder className="curiosity-detail__media" />
              <div className="curiosity-detail__body">
                <h2>{block.title}</h2>
                <p>{block.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
