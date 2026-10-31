import PageHero from '../components/ui/PageHero.jsx'
import Placeholder from '../components/ui/Placeholder.jsx'
import Button from '../components/ui/Button.jsx'
import Photo from '../components/ui/Photo.jsx'
import { CarouselArrows, CarouselDots } from '../components/ui/Carousel.jsx'
import { useCarousel } from '../lib/useCarousel.js'
import { MapExplorer } from '../components/ui/MapPanel.jsx'
import { heroNuevo } from '../data/heroImages.js'
import { experiences } from '../data/experiences.js'

const historySlides = [
  { src: '/img/home/historia.jpg', alt: 'Gramalote y su historia' },
  { src: '/img/home/historia-banner.jpg', alt: 'Panorámica de Gramalote' },
]

export default function QueHacer() {
  const featured = useCarousel(experiences.length)
  const story = useCarousel(historySlides.length)
  const experience = experiences[featured.index]
  const slide = historySlides[story.index]

  return (
    <>
      <PageHero
        image={heroNuevo.src}
        credit={heroNuevo.credit}
        title="Qué hacer"
        breadcrumb={[
          { label: 'Inicio', to: '/' },
          { label: 'Qué hacer' },
        ]}
      />

      <section className="section section--intro">
        <div className="container">
          <p className="page-intro">
            Descubre experiencias, lugares naturales y actividades para
            disfrutar Gramalote. Encuentra información útil para planear tu
            visita y conocer qué puedes hacer en el municipio.
          </p>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="featured-experience">
            <div className="featured-experience__media">
              <Photo src={experience.photo} alt={experience.title} />
              <CarouselArrows
                count={experiences.length}
                onPrev={featured.prev}
                onNext={featured.next}
              />
              <CarouselDots
                overlay
                count={experiences.length}
                index={featured.index}
                onGo={featured.go}
              />
            </div>
            <div className="featured-experience__body" aria-live="polite">
              <p className="eyebrow">{experience.category}</p>
              <h2>{experience.title}</h2>
              <p>{experience.description}</p>
              <Button to={experience.to} variant="secondary">
                Ver más
              </Button>
            </div>
          </div>

          <article className="promo-panel">
            <div className="promo-panel__body">
              <p className="eyebrow">Parque</p>
              <h2>Café Marquetalia</h2>
              <p>
                Consulta la información de este establecimiento y descubre qué
                ofrece para complementar tu visita a Gramalote.
              </p>
              <Button to="/que-hacer/cafe-marquetalia" variant="secondary">
                Ver más
              </Button>
            </div>
          </article>

          <div className="split-feature">
            <div className="split-feature__body">
              <p className="eyebrow">Por definir</p>
              <h2>Otro sitio</h2>
              <p>
                Atractivos, naturaleza, gastronomía, eventos y la memoria del
                municipio en una sola guía pensada para el celular: qué hay para
                hacer y cómo llegar a cada lugar.
              </p>
              <Button to="/que-hacer/otro-sitio" variant="secondary">
                Ver más
              </Button>
            </div>
            <div className="photo-collage photo-collage--right">
              <Placeholder className="photo-collage__tall" />
              <Placeholder />
              <Placeholder />
            </div>
          </div>

          <MapExplorer
            title="Explora Gramalote en el mapa"
            text="Descubre todos los lugares de interés en un solo mapa: restaurantes, hospedajes, artesanías y más."
            cta="Ver todos los lugares en el mapa"
          />

          <div className="story-block">
            <div className="section-head section-head--center">
              <h2>Conoce nuestra historia</h2>
              <p>
                Descubre la memoria de Gramalote, los acontecimientos que
                marcaron al municipio y las historias de su territorio.
              </p>
              <Button to="/historia" variant="secondary">
                Ver más
              </Button>
            </div>

            <div className="story-block__media">
              <Photo src={slide.src} alt={slide.alt} />
              <CarouselArrows
                count={historySlides.length}
                onPrev={story.prev}
                onNext={story.next}
              />
            </div>
            <CarouselDots count={historySlides.length} index={story.index} onGo={story.go} />
          </div>
        </div>
      </section>
    </>
  )
}
