import { useParams } from 'react-router-dom'
import PageHero from '../components/ui/PageHero.jsx'
import Placeholder from '../components/ui/Placeholder.jsx'
import Button from '../components/ui/Button.jsx'
import { getCuriosity } from '../data/curiosities.js'

export default function CuriosidadDetalle() {
  const { slug } = useParams()
  const item = getCuriosity(slug)

  if (!item) {
    return (
      <section className="section">
        <div className="container">
          <h1>No encontramos esta curiosidad</h1>
          <p className="page-intro">El contenido puede haber cambiado de dirección.</p>
          <Button to="/curiosidades">Volver a Curiosidades</Button>
        </div>
      </section>
    )
  }

  return (
    <>
      <PageHero
        title={item.title}
        breadcrumb={[
          { label: 'Inicio', to: '/' },
          { label: 'Curiosidades', to: '/curiosidades' },
          { label: item.title },
        ]}
      />

      <section className="section section--intro">
        <div className="container container--narrow">
          <h2 className="curiosity-detail__heading">{item.introTitle}</h2>
          <p className="curiosity-detail__intro">{item.introText}</p>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container container--narrow">
          {item.text ? (
            <div className="curiosity-detail__row">
              <Placeholder className="curiosity-detail__media" />
              <div className="curiosity-detail__body">
                <h2>{item.introTitle}</h2>
                <p>{item.text}</p>
                {item.extra ? <p>{item.extra}</p> : null}
              </div>
            </div>
          ) : null}

          {item.featured ? (
            <div className="curiosity-featured">
              <div className="curiosity-featured__body">
                <span className="eyebrow">{item.featured.eyebrow}</span>
                <h2>{item.featured.title}</h2>
                <p>
                  Una fecha que marcaba el comienzo de la temporada festiva.
                </p>
              </div>
              <Placeholder className="curiosity-featured__media" />
            </div>
          ) : null}

          {item.blocks.map((block, index) => (
            <div
              key={block.title}
              className={`curiosity-detail__row${
                item.layout === 'text-left' || index % 2 === 1 ? ' is-reverse' : ''
              }`}
            >
              <Placeholder className="curiosity-detail__media" />
              <div className="curiosity-detail__body">
                <h2>{block.title}</h2>
                {block.text.split('\n\n').map((paragraph, paragraphIndex) => (
                  <p key={`${block.title}-${paragraphIndex}`}>{paragraph}</p>
                ))}
              </div>
            </div>
          ))}

          {item.naturalItems ? (
            <div className="curiosity-natural">
              <h2>{item.naturalTitle}</h2>
              <div className="curiosity-natural__grid">
                {item.naturalItems.map((natural) => (
                  <figure key={natural.title} className="curiosity-natural__item">
                    <Placeholder />
                    <figcaption>{natural.title}</figcaption>
                  </figure>
                ))}
              </div>
              <p>{item.naturalText}</p>
            </div>
          ) : null}

          <div className="curiosity-closing">
            <Placeholder className="curiosity-closing__media" />
            <div className="curiosity-closing__body">
              <h2>{item.closingTitle}</h2>
              {item.closingText.split('\n\n').map((paragraph, paragraphIndex) => (
                <p key={`cierre-${paragraphIndex}`}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
