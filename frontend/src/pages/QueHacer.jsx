import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHero from '../components/ui/PageHero.jsx'
import Photo from '../components/ui/Photo.jsx'
import Icon from '../components/ui/Icon.jsx'
import PhotoBanner from '../components/ui/PhotoBanner.jsx'
import PracticalInfo from '../components/home/PracticalInfo.jsx'
import { FilterToggle } from '../components/ui/FilterBar.jsx'
import { MapExplorer } from '../components/ui/MapPanel.jsx'
import { activities } from '../data/experiences.js'

export default function QueHacer() {
  const [openToday, setOpenToday] = useState(false)
  const visible = openToday ? activities.filter((item) => item.openDaily) : activities

  return (
    <>
      <PageHero
        image="/img/que-hacer/hero.jpg"
        title="Qué hacer"
        breadcrumb={[
          { label: 'Inicio', to: '/' },
          { label: 'Qué hacer' },
        ]}
      />

      <section className="intro-band">
        <div className="container">
          <p>
            Descubre experiencias, lugares naturales y actividades para
            disfrutar Gramalote. Encuentra información útil para planear tu
            visita y conocer qué puedes hacer en el municipio.
          </p>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="filter-bar filter-bar--compact">
            <FilterToggle label="Abierto hoy" active={openToday} onChange={setOpenToday} />
          </div>

          <div className="activity-grid" aria-live="polite">
            {visible.map((item) => (
              <article key={item.slug} className="activity-card">
                <Photo src={item.photo} alt={item.title} />
                <div className="activity-card__body">
                  <span className={`tag tag--${item.category === 'Naturaleza' ? 'leaf' : 'brown'}`}>
                    {item.category}
                  </span>
                  <h2>{item.title}</h2>
                  <p>{item.text}</p>
                  <p className="activity-card__meta">{item.meta}</p>
                  <Link className="activity-card__link" to={`/que-hacer/${item.slug}`}>
                    Ver más <Icon name="arrow" size={16} />
                    <span className="visually-hidden"> sobre {item.title}</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <MapExplorer
            title="Explora Gramalote en el mapa"
            text="Descubre todos los lugares de interés en un solo mapa: restaurantes, hospedajes, artesanos y más."
            cta="Ver todos los lugares en el mapa"
          />
        </div>
      </section>

      <PhotoBanner
        image="/img/que-hacer/historia-banner.jpg"
        title="Conoce nuestra historia"
        text="Descubre la memoria de Gramalote, los acontecimientos que marcaron al municipio y las historias de su territorio."
        cta="Conocer historia"
        to="/historia"
      />

      <PracticalInfo />
    </>
  )
}
