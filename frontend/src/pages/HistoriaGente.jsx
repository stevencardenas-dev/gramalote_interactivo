import { useState } from 'react'
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
          <img src={story.image} alt="" loading="lazy" />
        </div>
      </div>
    </Reveal>
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

      <section className="his-quotes">
        <div className="container">
          <div className="his-quotes__grid">
            {quotes.map((quote, index) => (
              <Reveal as="blockquote" key={quote.text} className="his-quote" delay={index * 110}>
                <p>«{quote.text}»</p>
                <footer>{quote.author}</footer>
              </Reveal>
            ))}
          </div>
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
