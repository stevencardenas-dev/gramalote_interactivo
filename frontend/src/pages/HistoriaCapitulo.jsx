import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../components/ui/Icon.jsx'
import Button from '../components/ui/Button.jsx'
import Reveal from '../components/historia/Reveal.jsx'
import SectionNav from '../components/historia/SectionNav.jsx'
import { chapters, getChapter, getChapterIndex } from '../data/historia.js'
import { usePageTitle } from '../lib/usePageTitle.js'

export default function HistoriaCapitulo() {
  const { slug } = useParams()
  const chapter = getChapter(slug)
  const index = getChapterIndex(slug)
  const [progress, setProgress] = useState(0)

  usePageTitle(chapter ? chapter.title : 'Recorrido histórico')

  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [slug])

  if (!chapter) {
    return (
      <section className="section section--estado">
        <div className="container container--narrow">
          <p className="eyebrow">Recorrido histórico</p>
          <h1>Capítulo no encontrado</h1>
          <p className="page-intro">El capítulo que buscas no existe o cambió de dirección.</p>
          <Button to="/historia" icon="arrow">
            Volver a Conocer historia
          </Button>
        </div>
      </section>
    )
  }

  const previous = chapters[index - 1] ?? null
  const next = chapters[index + 1] ?? null
  const totalEvents = chapter.stages.reduce((sum, stage) => sum + stage.events.length, 0)

  return (
    <>
      <div className="his-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <header className="his-cap-hero">
        <div className="container his-cap-hero__grid">
          <Reveal className="his-cap-hero__text">
            <p className="eyebrow his-cap-hero__eyebrow">
              <span className="his-dot" aria-hidden="true" />
              Recorrido histórico · Capítulo {chapter.number}
            </p>
            <h1>{chapter.title}</h1>
            <p className="his-cap-hero__intro">{chapter.heroText}</p>
            <a className="btn btn--primary" href="#etapa-1">
              Desplázate hacia abajo
              <Icon name="chevron" className="btn__icon" />
            </a>
            <p className="his-cap-hero__meta">
              {chapter.stages.length} etapas · {totalEvents} acontecimientos
            </p>
          </Reveal>
          <Reveal className="his-cap-hero__media" delay={140}>
            <img src={chapter.heroImage} alt={`Imagen del capítulo ${chapter.title}`} />
          </Reveal>
        </div>
      </header>

      <SectionNav />

      <div className="his-story">
        <div className="container">
          {chapter.stages.map((stage, stageIndex) => (
            <section
              key={stage.kicker}
              className="his-stage"
              id={`etapa-${stageIndex + 1}`}
              aria-labelledby={`etapa-titulo-${stageIndex + 1}`}
            >
              <Reveal className="his-stage__band">
                <div className="his-stage__label">
                  <span className="his-stage__count">
                    Etapa {String(stageIndex + 1).padStart(2, '0')} / {String(chapter.stages.length).padStart(2, '0')}
                  </span>
                  <h2 id={`etapa-titulo-${stageIndex + 1}`}>{stage.title}</h2>
                </div>
                <p className="his-stage__note">{stage.kicker.split('·')[1]?.trim() || stage.kicker}</p>
              </Reveal>

              <ol className="his-events">
                {stage.events.map((event, eventIndex) => (
                  <Reveal
                    as="li"
                    key={`${stage.kicker}-${event.n}`}
                    className={`his-event${eventIndex % 2 === 1 ? ' his-event--reverse' : ''}`}
                  >
                    <span className="his-event__dot" aria-hidden="true" />
                    <figure className="his-event__media">
                      <img src={event.image} alt="" loading="lazy" />
                      <figcaption>
                        <span className="his-event__num">{String(event.n).padStart(2, '0')}</span>
                        <span className="his-event__date">{event.date}</span>
                      </figcaption>
                    </figure>
                    <div className="his-event__body">
                      <h3>{event.title}</h3>
                      <p>{event.text}</p>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>

      <section className="his-closing">
        <div className="container">
          <Reveal className="his-closing__card">
            <p className="eyebrow">Cierre del capítulo {chapter.number}</p>
            <h2>{chapter.closing.title}</h2>
            <p>{chapter.closing.text}</p>

            <div className="his-closing__nav">
              {previous ? (
                <Link className="his-closing__prev" to={`/historia/recorrido/${previous.slug}`}>
                  <span>Capítulo anterior</span>
                  <strong>
                    <Icon name="chevron" className="is-left" /> {previous.title}
                  </strong>
                </Link>
              ) : (
                <Link className="his-closing__prev" to="/historia">
                  <span>Volver</span>
                  <strong>
                    <Icon name="chevron" className="is-left" /> Conocer historia
                  </strong>
                </Link>
              )}

              {next ? (
                <Link className="his-closing__next" to={`/historia/recorrido/${next.slug}`}>
                  <span>Siguiente capítulo</span>
                  <strong>
                    {next.title}
                    <Icon name="arrow" />
                  </strong>
                </Link>
              ) : (
                <Link className="his-closing__next" to="/historia/patrimonio">
                  <span>Sigue explorando</span>
                  <strong>
                    Explorar patrimonio
                    <Icon name="arrow" />
                  </strong>
                </Link>
              )}
            </div>

            {next ? null : (
              <Link className="his-closing__back" to="/historia">
                <Icon name="chevron" className="is-left" />
                Volver a Conocer historia
              </Link>
            )}
          </Reveal>
        </div>
      </section>
    </>
  )
}
