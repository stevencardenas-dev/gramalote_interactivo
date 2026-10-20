import PageHero from '../components/ui/PageHero.jsx'
import Placeholder from '../components/ui/Placeholder.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import { MapExplorer } from '../components/ui/MapPanel.jsx'

export default function QueHacer() {
  return (
    <>
      <PageHero
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
              <Placeholder />
              <button className="carousel-arrow carousel-arrow--left" type="button" aria-label="Anterior">
                <Icon name="chevron" />
              </button>
              <button className="carousel-arrow carousel-arrow--right" type="button" aria-label="Siguiente">
                <Icon name="chevron" />
              </button>
              <div className="carousel-dots" aria-hidden="true">
                <span className="is-active" />
                <span />
                <span />
              </div>
            </div>
            <div className="featured-experience__body">
              <p className="eyebrow">Naturaleza</p>
              <h2>Cascadas Arco Iris</h2>
              <p>
                Las Cascadas Arcoíris destacan por sus arcoíris naturales y el
                avistamiento nocturno de golondrinas en Gramalote.
              </p>
              <Button to="/que-hacer/cascadas-arco-iris" variant="secondary">
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
              <Placeholder />
              <button className="carousel-arrow carousel-arrow--left" type="button" aria-label="Anterior">
                <Icon name="chevron" />
              </button>
              <button className="carousel-arrow carousel-arrow--right" type="button" aria-label="Siguiente">
                <Icon name="chevron" />
              </button>
            </div>
            <div className="carousel-dots" aria-hidden="true">
              <span />
              <span className="is-active" />
              <span />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
