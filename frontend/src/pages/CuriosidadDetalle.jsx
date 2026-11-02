import { Link, useParams } from 'react-router-dom'
import PageHero from '../components/ui/PageHero.jsx'
import Photo from '../components/ui/Photo.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import PracticalInfo from '../components/home/PracticalInfo.jsx'
import { getCuriosity } from '../data/curiosities.js'
import { usePageTitle } from '../lib/usePageTitle.js'

function Paragraphs({ items }) {
  return items.map((paragraph, index) => <p key={`p-${index}`}>{paragraph}</p>)
}

function Row({ block }) {
  const row = (
    <div
      className={`story-row${block.side === 'right' ? ' story-row--reverse' : ''}${
        block.images.length > 1 ? ' story-row--duo' : ''
      }${block.tall ? ' story-row--tall' : ''}`}
    >
      <div className="story-row__media">
        {block.images.map((image) => (
          <Photo key={image.src} src={image.src} alt={image.alt} position={image.position} />
        ))}
      </div>
      <div className="story-row__body">
        {block.title ? <h2>{block.title}</h2> : null}
        <Paragraphs items={block.paragraphs} />
        {block.link ? (
          <Button to={block.link.to} className="btn--tone" icon="arrow">
            {block.link.label}
          </Button>
        ) : null}
      </div>
    </div>
  )

  if (!block.band) return <div className="container">{row}</div>
  return (
    <div className="story-band">
      <div className="container">{row}</div>
    </div>
  )
}

function Block({ block }) {
  switch (block.type) {
    case 'row':
      return <Row block={block} />

    case 'featured':
      return (
        <div className="container">
          <div className="story-date">
            <p className="story-date__eyebrow">{block.eyebrow}</p>
            <h2>{block.title}</h2>
            <p>{block.text}</p>
          </div>
        </div>
      )

    case 'collection':
      return (
        <section className="container story-collection">
          <h2>{block.title}</h2>
          <div className="story-collection__grid">
            {block.items.map((item) => (
              <article key={item.title}>
                <Photo src={item.src} alt={item.alt} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
      )

    case 'pair':
      return (
        <section className={`container story-pair${block.titleFirst ? ' story-pair--title-first' : ''}`}>
          {block.title ? <h2>{block.title}</h2> : null}
          <div className="story-pair__grid">
            {block.items.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <Photo src={item.src} alt={item.alt} />
                <p>{item.text}</p>
              </article>
            ))}
          </div>
          {block.note ? (
            <div className="story-pair__note">
              <h3>{block.note.title}</h3>
              <p>{block.note.text}</p>
            </div>
          ) : null}
        </section>
      )

    case 'related':
      return (
        <section className="story-related" aria-labelledby="related-title">
          <div className="container">
            <h2 id="related-title">También te puede interesar</h2>
            <div className="story-related__grid">
              {block.items.map((item) => (
                <article key={item.to} className="story-related__card">
                  <img src={item.photo} alt="" loading="lazy" />
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                    <Link className="btn btn--primary btn--sm" to={item.to}>
                      {item.cta} <Icon name="arrow" size={16} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )

    case 'strip':
      return (
        <div className="container story-strip">
          <Photo src={block.image.src} alt={block.image.alt} />
          <p>{block.text}</p>
        </div>
      )

    case 'overlay':
      return (
        <div className="container">
          <div className="story-overlay">
            <img src={block.image.src} alt={block.image.alt} loading="lazy" />
            <div className="story-overlay__body">
              <h2>{block.title}</h2>
              <Paragraphs items={block.paragraphs} />
            </div>
          </div>
        </div>
      )

    case 'card':
      return (
        <div className="container">
          <div className="story-card">
            <Photo src={block.image.src} alt={block.image.alt} />
            <div className="story-card__body">
              <h2>{block.title}</h2>
              <p>{block.text}</p>
            </div>
          </div>
        </div>
      )

    default:
      return null
  }
}

export default function CuriosidadDetalle() {
  const { slug } = useParams()
  const item = getCuriosity(slug)
  usePageTitle(item?.title ?? 'Curiosidad no encontrada')

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
    <div className={`story story--${item.tone}`}>
      <PageHero
        className="page-hero--story"
        image={item.hero}
        eyebrow={item.title}
        title={item.heading}
        breadcrumb={[
          { label: 'Inicio', to: '/' },
          { label: 'Curiosidades', to: '/curiosidades' },
          { label: item.title },
        ]}
      />

      <section className="story-intro">
        <div className="container">
          <p>{item.intro}</p>
        </div>
      </section>

      <div className="story__blocks">
        {item.blocks.map((block, index) => (
          <Block key={`${block.type}-${index}`} block={block} />
        ))}
      </div>

      <section className="story-closing" style={{ '--closing-image': `url(${item.closing.image})` }}>
        <div className="container">
          {item.closing.title ? <h2>{item.closing.title}</h2> : null}
          <Paragraphs items={item.closing.paragraphs} />
        </div>
      </section>

      <PracticalInfo />
    </div>
  )
}
