import PageHero from '../components/ui/PageHero.jsx'
import Photo from '../components/ui/Photo.jsx'
import Button from '../components/ui/Button.jsx'
import PracticalInfo from '../components/home/PracticalInfo.jsx'
import { curiositySections } from '../data/curiosities.js'

export default function Curiosidades() {
  return (
    <>
      <PageHero
        image="/img/curiosidades/hero.jpg"
        title="Curiosidades"
        breadcrumb={[
          { label: 'Inicio', to: '/' },
          { label: 'Curiosidades' },
        ]}
      />

      <section className="section section--intro curiosities-intro">
        <div className="container container--narrow">
          <h2>Lo que hace único a Gramalote</h2>
          <p>
            Cada territorio guarda historias, tradiciones y detalles que
            permiten conocerlo más allá de sus paisajes. En Gramalote, los
            símbolos que lo representan, las celebraciones de su gente, los
            sabores de su cocina y la riqueza de su naturaleza hacen parte de
            una identidad construida a través del tiempo.
          </p>
          <hr />
          <p>
            Explora estas cuatro facetas del municipio y descubre las historias,
            costumbres y elementos que conectan a Gramalote con su gente y su
            territorio.
          </p>
        </div>
      </section>

      {curiositySections.map((section, index) => (
        <section key={section.slug} className={`facet facet--${section.tone}`}>
          <div className={`container facet__card${index % 2 === 1 ? ' facet__card--reverse' : ''}`}>
            <div className="facet__body">
              <h2>{section.title}</h2>
              <p>{section.summary}</p>
              <Button to={`/curiosidades/${section.slug}`} className="btn--tone">
                {section.cta}
              </Button>
            </div>
            <Photo className="facet__media" src={section.photo} alt={section.alt} />
          </div>
        </section>
      ))}

      <PracticalInfo />
    </>
  )
}
