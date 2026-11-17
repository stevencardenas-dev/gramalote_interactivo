import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon.jsx'
import Button from '../components/ui/Button.jsx'
import PracticalInfo from '../components/home/PracticalInfo.jsx'
import Reveal from '../components/historia/Reveal.jsx'
import SectionNav from '../components/historia/SectionNav.jsx'
import { chapters, historiaInicio, timeline, timelineResumen } from '../data/historia.js'
import { usePageTitle } from '../lib/usePageTitle.js'

function TimelineRow({ event, index }) {
  return (
    <Reveal
      as="li"
      delay={(index % 4) * 60}
      className={`his-tl__row${index % 2 === 1 ? ' his-tl__row--reverse' : ''}${event.image ? '' : ' his-tl__row--text'}`}
    >
      <span className="his-tl__dot" aria-hidden="true" />
      <div className="his-tl__body">
        <span className="his-tl__date">{event.date}</span>
        <h3>{event.title}</h3>
        <p>{event.text}</p>
      </div>
      {event.image ? (
        <div className="his-tl__media">
          <img src={event.image} alt="" loading="lazy" />
        </div>
      ) : null}
    </Reveal>
  )
}

export default function Historia() {
  usePageTitle('Conocer historia')
  const [expanded, setExpanded] = useState(false)
  // En móvil la línea del tiempo es un carrusel horizontal con los 16 hitos:
  // no se resume ni se esconde detrás de «Ver completa».
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 760px)').matches)
  const resumen = timeline.filter((event) => timelineResumen.includes(event.n))
  const visibles = compact || expanded ? timeline : resumen

  useEffect(() => {
    const query = window.matchMedia('(max-width: 760px)')
    const update = () => setCompact(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return (
    <>
      <header className="his-hero">
        <img
          className="his-hero__img"
          src="/img/historia/inicio-hero.jpg"
          alt="Vista del casco urbano de Gramalote entre las montañas"
        />
        <div className="his-hero__veil" aria-hidden="true" />
        <div className="container his-hero__inner">
          <p className="eyebrow">{historiaInicio.eyebrow}</p>
          <h1>{historiaInicio.title}</h1>
          <p className="his-hero__intro">{historiaInicio.intro}</p>
          <a className="btn btn--primary his-hero__cta" href="#recorrido">
            {historiaInicio.cta}
            <Icon name="arrow" className="btn__icon" />
          </a>
        </div>
      </header>

      <SectionNav />

      <section className="his-franja">
        <div className="container his-franja__inner">
          <Reveal as="h2" className="his-franja__title">
            {historiaInicio.franja.title}
          </Reveal>
          <Reveal as="p" className="his-franja__text" delay={120}>
            {historiaInicio.franja.text}
          </Reveal>
        </div>
      </section>

      <section className="section his-chapters" id="recorrido">
        <div className="container">
          <Reveal className="his-head">
            <div>
              <h2>Recorre la historia de Gramalote</h2>
              <p>Explora su historia en tres grandes capítulos, desde sus orígenes hasta la reconstrucción del pueblo.</p>
            </div>
            <Button to={`/historia/recorrido/${chapters[0].slug}`} variant="ghost" icon="arrow">
              Comenzar recorrido
            </Button>
          </Reveal>

          <div className="his-chapters__grid">
            {chapters.map((chapter, index) => (
              <Reveal as="article" key={chapter.slug} className="his-card" delay={index * 110}>
                <Link className="his-card__link" to={`/historia/recorrido/${chapter.slug}`}>
                  <div className="his-card__media">
                    <img src={chapter.cardImage} alt="" loading="lazy" />
                    <span className="his-card__period">{chapter.cardPeriod}</span>
                  </div>
                  <div className="his-card__body">
                    <span className="his-card__num">Capítulo {chapter.number}</span>
                    <h3>{chapter.cardTitle}</h3>
                    <p>{chapter.cardText}</p>
                    <span className="his-card__cta">
                      Conocer más
                      <Icon name="arrow" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="his-timeline">
        <div className="container">
          <Reveal className="his-timeline__card">
            <div className="his-timeline__head">
              <div>
                <p className="eyebrow">Línea del tiempo</p>
                <h2>Gramalote a través del tiempo</h2>
                <p className="his-timeline__intro">
                  Principales acontecimientos que marcaron la historia del municipio.
                </p>
              </div>
              <span className="his-timeline__count">
                <Icon name="clock" size={18} />
                16 acontecimientos
              </span>
            </div>

            <div className={`his-timeline__body${expanded ? ' is-expanded' : ''}`} id="linea-del-tiempo">
              <ol className="his-tl" aria-label="Línea del tiempo de Gramalote">
                {visibles.map((event, index) => (
                  <TimelineRow key={event.n} event={event} index={index} />
                ))}
              </ol>
            </div>

            {compact ? null : (
              <div className="his-timeline__foot">
                <button
                  type="button"
                  className="his-toggle"
                  onClick={() => setExpanded((value) => !value)}
                  aria-expanded={expanded}
                  aria-controls="linea-del-tiempo"
                >
                  {expanded ? 'Ver menos' : 'Ver línea de tiempo completa'}
                  <Icon name={expanded ? 'chevron' : 'arrow'} className={expanded ? 'is-up' : ''} />
                </button>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      <section className="section his-explore">
        <div className="container">
          <Reveal as="h2" className="his-explore__title">
            Sigue explorando
          </Reveal>
          <div className="his-explore__grid">
            <Reveal as="article" className="his-explore__card">
              <Link to="/historia/patrimonio">
                <img src="/img/historia/sigue-patrimonio.jpg" alt="" loading="lazy" />
                <div className="his-explore__body">
                  <span className="his-explore__eyebrow">Espacios y memoria</span>
                  <h3>Patrimonio</h3>
                  <p>Lugares que puedes visitar y que cuentan la historia viva del pueblo.</p>
                  <span className="his-explore__cta">
                    Ver patrimonio
                    <Icon name="arrow" />
                  </span>
                </div>
              </Link>
            </Reveal>
            <Reveal as="article" className="his-explore__card" delay={120}>
              <Link to="/historia/gente-y-leyendas">
                <img src="/img/historia/sigue-gente.jpg" alt="" loading="lazy" />
                <div className="his-explore__body">
                  <span className="his-explore__eyebrow">Tradición oral</span>
                  <h3>Gente y leyendas</h3>
                  <p>Personajes, relatos y tradiciones que forman parte de la identidad de Gramalote.</p>
                  <span className="his-explore__cta">
                    Conocer siguiente
                    <Icon name="arrow" />
                  </span>
                </div>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      <PracticalInfo />
    </>
  )
}
