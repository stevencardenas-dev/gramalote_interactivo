import { useParams } from 'react-router-dom'
import PageHero from '../components/ui/PageHero.jsx'
import Placeholder from '../components/ui/Placeholder.jsx'
import Button from '../components/ui/Button.jsx'
import { getCuriosity } from '../data/curiosities.js'

function Paragraphs({ items }) {
  return items.map((paragraph, index) => (
    <p key={`paragraph-${index}`}>{paragraph}</p>
  ))
}

function RowMedia({ count = 1 }) {
  if (count > 1) {
    return (
      <div className="curiosity-detail__media-group">
        {Array.from({ length: count }, (_, index) => (
          <Placeholder key={`media-${index}`} />
        ))}
      </div>
    )
  }

  return <Placeholder className="curiosity-detail__media" />
}

function ContentBlock({ block }) {
  if (block.type === 'feature') {
    return (
      <article className="curiosity-feature">
        <Placeholder className="curiosity-feature__media" />
        <div className="curiosity-feature__body">
          <h2>{block.title}</h2>
          <Paragraphs items={block.paragraphs} />
        </div>
      </article>
    )
  }

  if (block.type === 'featured') {
    return (
      <div className="curiosity-featured">
        <div className="curiosity-featured__body">
          <span className="eyebrow">{block.eyebrow}</span>
          <h2>{block.title}</h2>
          <p>{block.text}</p>
        </div>
        <Placeholder className="curiosity-featured__media" />
      </div>
    )
  }

  if (block.type === 'collection') {
    return (
      <section className="curiosity-collection">
        <h2>{block.title}</h2>
        <div
          className="curiosity-collection__grid"
          style={{ '--curiosity-columns': block.columns ?? 3 }}
        >
          {block.items.map((item) => (
            <figure key={item.label} className="curiosity-collection__item">
              <Placeholder />
              <figcaption>{item.label}</figcaption>
              {item.text ? <p>{item.text}</p> : null}
            </figure>
          ))}
        </div>
        <Paragraphs items={block.paragraphs} />
      </section>
    )
  }

  return (
    <div
      className={`curiosity-detail__row${
        block.mediaSide === 'right' ? ' is-reverse' : ''
      }`}
    >
      <RowMedia count={block.mediaCount} />
      <div className="curiosity-detail__body">
        {block.title ? <h2>{block.title}</h2> : null}
        <Paragraphs items={block.paragraphs} />
      </div>
    </div>
  )
}

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
          {item.content.map((block, index) => (
            <ContentBlock key={`${block.type}-${index}`} block={block} />
          ))}

          <div
            className={`curiosity-closing${
              item.closingMediaSide === 'right' ? ' is-reverse' : ''
            }`}
          >
            <Placeholder className="curiosity-closing__media" />
            <div className="curiosity-closing__body">
              {item.closingTitle ? <h2>{item.closingTitle}</h2> : null}
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
