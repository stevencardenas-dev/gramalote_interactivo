import PageHero from '../components/ui/PageHero.jsx'
import Placeholder from '../components/ui/Placeholder.jsx'
import Button from '../components/ui/Button.jsx'
import { curiositySections } from '../data/curiosities.js'

export default function Curiosidades() {
  return (
    <>
      <PageHero
        title="Curiosidades"
        breadcrumb={[
          { label: 'Inicio', to: '/' },
          { label: 'Curiosidades' },
        ]}
      />

      <section className="section section--intro">
        <div className="container container--narrow">
          <h2 className="curiosities-title">Lo que hace único a Gramalote</h2>
          <div className="curiosities-quote">
            <p>
              Cada territorio guarda historias, tradiciones y detalles que
              permiten conocerlo más allá de sus paisajes. En Gramalote, los
              símbolos que lo representan, las celebraciones de su gente, los
              sabores de su cocina y la riqueza de su naturaleza hacen parte de
              una identidad construida a través del tiempo.
            </p>
          </div>
          <p className="curiosities-subtitle">
            Explora estas cuatro facetas del municipio y descubre las historias,
            costumbres y elementos que conectan a Gramalote con su gente y su
            territorio.
          </p>
        </div>
      </section>

      <div className="curiosity-list">
        {curiositySections.map((section, index) => (
          <section
            key={section.slug}
            className={`curiosity-row${index % 2 === 1 ? ' curiosity-row--reverse' : ''}`}
          >
            <div className="container">
              <div className="curiosity-row__body">
                <h2>{section.title}</h2>
                <p>{section.summary}</p>
                <Button
                  to={`/curiosidades/${section.slug}`}
                  variant="secondary"
                  size="sm"
                >
                  {section.cta}
                </Button>
              </div>
              <Placeholder className="curiosity-row__media" />
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
