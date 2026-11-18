import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon.jsx'
import Reveal from '../components/historia/Reveal.jsx'
import SectionNav from '../components/historia/SectionNav.jsx'
import { genteHero, people, quotes, stories } from '../data/historia.js'
import { usePageTitle } from '../lib/usePageTitle.js'

function Person({ person, index }) {
  const [open, setOpen] = useState(false)

  return (
    <Reveal as="article" className={`his-person${open ? ' is-open' : ''}`} delay={index * 60}>
      <span className="his-person__num">{person.n}</span>
      <div className="his-person__body">
        <h3>{person.name}</h3>
        <p className="his-person__cat">{person.category}</p>
        <p>{person.intro}</p>
        <div className="his-person__more" hidden={!open}>
          {person.body.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
          <p className="his-source">{person.source}</p>
        </div>
        <button type="button" className="his-more" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          {open ? 'Leer menos' : 'Leer más'}
          <Icon name={open ? 'chevron' : 'arrow'} size={15} className={open ? 'is-up' : ''} />
        </button>
      </div>
    </Reveal>
  )
}

function Story({ story, index }) {
  const [open, setOpen] = useState(false)

  return (
    <Reveal as="article" className={`his-story-card${open ? ' is-open' : ''}`} delay={index * 60}>
      <button type="button" className="his-story-card__head" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="his-story-card__num">{story.n}</span>
        <span className="his-story-card__title">
          {story.title}
          <span className={`his-type his-type--${story.type.toLowerCase()}`}>{story.type}</span>
        </span>
        <Icon name="chevron" className={`his-story-card__chevron${open ? ' is-up' : ''}`} />
      </button>
      <div className="his-story-card__body" hidden={!open}>
        <p className="his-story-card__intro">{story.intro}</p>
        <div className="his-story-card__cols">
          <div>
            {story.body.map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
            <p className="his-source">{story.source}</p>
          </div>
        </div>
      </div>
    </Reveal>
  )
}

// Fondos del carrusel: las fotos que antes acompañaban a las leyendas.
const quoteImages = [...new Set(stories.map((story) => story.image).filter(Boolean))]

function QuoteCarousel() {
  const [active, setActive] = useState(0)
  const go = (step) => setActive((value) => (value + step + quotes.length) % quotes.length)

  // Avanza solo cada 6 s; tocar una flecha o un punto reinicia la cuenta.
  useEffect(() => {
    if (quotes.length < 2) return undefined
    const timer = window.setTimeout(() => setActive((value) => (value + 1) % quotes.length), 6000)
    return () => window.clearTimeout(timer)
  }, [active])

  return (
    <div className="his-quote-slider" role="region" aria-roledescription="carrusel" aria-label="Frases">
      {quotes.map((quote, index) => (
        <figure
          key={quote.text}
          className={`his-quote-slide${index === active ? ' is-active' : ''}`}
          aria-hidden={index !== active}
        >
          <img
            src={quoteImages[index % quoteImages.length]}
            alt=""
            loading="lazy"
            style={index === 0 ? { objectPosition: 'center 15%' } : undefined}
          />
          <blockquote>
            <p>“{quote.text.replace(/\.$/, '')}”</p>
            <footer>{quote.author}</footer>
          </blockquote>
        </figure>
      ))}
      <button type="button" className="his-quote-slider__arrow is-prev" aria-label="Frase anterior" onClick={() => go(-1)}>
        <Icon name="arrow" size={18} />
      </button>
      <button type="button" className="his-quote-slider__arrow is-next" aria-label="Frase siguiente" onClick={() => go(1)}>
        <Icon name="arrow" size={18} />
      </button>
      <div className="his-quote-slider__dots">
        {quotes.map((quote, index) => (
          <button
            key={quote.text}
            type="button"
            className={index === active ? 'is-active' : ''}
            aria-label={`Frase ${index + 1} de ${quotes.length}`}
            aria-current={index === active}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
    </div>
  )
}

export default function HistoriaGente() {
  usePageTitle('Gente y leyendas')

  return (
    <>
      <header className="his-hero his-hero--page his-hero--gente">
        <img className="his-hero__img" src="/img/historia/gente-hero.jpg" alt="" />
        <div className="his-hero__veil" aria-hidden="true" />
        <div className="container his-hero__inner">
          <p className="eyebrow">{genteHero.eyebrow}</p>
          <h1>{genteHero.title}</h1>
          <p className="his-hero__intro">{genteHero.intro}</p>
        </div>
      </header>

      <SectionNav />

      <section className="section his-gente">
        <div className="container">
          <Reveal as="h2" className="his-gente__title">
            Gente
          </Reveal>
          <div className="his-gente__grid">
            {people.map((person, index) => (
              <Person key={person.name} person={person} index={index} />
            ))}
          </div>

          <Reveal as="h2" className="his-gente__title his-gente__title--gap">
            Leyendas
          </Reveal>
          <Reveal as="p" className="his-gente__lead">
            Algunas historias tienen respaldo en documentos; otras son lo que un pueblo cuenta de sí mismo.
          </Reveal>
          <div className="his-stories">
            {stories.map((story, index) => (
              <Story key={story.title} story={story} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="his-quotes his-quotes--slider">
        <div className="container">
          <QuoteCarousel />
        </div>
      </section>

      <section className="section his-explore his-explore--tight">
        <div className="container">
          <Reveal className="his-nextup">
            <div>
              <p className="eyebrow">Sigue explorando</p>
              <h2>Patrimonio</h2>
              <p>Descubre los espacios que conservan la memoria del pueblo.</p>
            </div>
            <Link className="btn btn--primary" to="/historia/patrimonio">
              Explorar patrimonio
              <Icon name="arrow" className="btn__icon" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  )
}
