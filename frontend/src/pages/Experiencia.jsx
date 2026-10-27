import { useParams } from 'react-router-dom'
import HeroFicha from '../components/ui/HeroFicha.jsx'
import InfoBar from '../components/ui/InfoBar.jsx'
import Placeholder from '../components/ui/Placeholder.jsx'
import Button from '../components/ui/Button.jsx'
import { getExperience } from '../data/experiences.js'

export default function Experiencia() {
  const { slug } = useParams()
  const item = getExperience(slug)

  if (!item) {
    return (
      <section className="section">
        <div className="container">
          <h1>No encontramos esta experiencia</h1>
          <p className="page-intro">El contenido puede haber cambiado de dirección.</p>
          <Button to="/que-hacer">Volver a Qué hacer</Button>
        </div>
      </section>
    )
  }

  return (
    <>
      <HeroFicha
        variant="center"
        eyebrow={item.category}
        title={item.title}
        summary={item.summary}
        social={item.social}
        breadcrumb={[
          { label: 'Inicio', to: '/' },
          { label: 'Qué hacer', to: '/que-hacer' },
          { label: item.title },
        ]}
      />

      <div className="container container--narrow">
        <InfoBar
          items={[
            { icon: 'horario', label: 'Horario', value: item.hours },
            { icon: 'ubicacion', label: 'Dirección', value: item.address },
            { icon: 'carro', label: 'Parqueadero', value: item.parking },
            { icon: 'telefono', label: 'Teléfono', value: item.phone },
          ]}
        />

        <p className="detail-description">{item.description}</p>

        <div className="gallery gallery--experience">
          <Placeholder className="gallery__wide" />
          <Placeholder className="gallery__wide" />
          <Placeholder />
          <Placeholder />
          <Placeholder />
        </div>

        <div className="considerations">
          <h2>Ten en cuenta</h2>
          <div className="considerations__grid">
            {item.tips.map((tip) => (
              <article key={tip.title} className="consideration-card">
                <Placeholder />
                <h3>{tip.title}</h3>
                <p>{tip.text}</p>
              </article>
            ))}
          </div>
          <Button to="/informacion-practica#contactos" variant="secondary">
            Consultar información de acceso
          </Button>
        </div>
      </div>
    </>
  )
}
