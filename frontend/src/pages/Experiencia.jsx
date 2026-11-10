import { useParams } from 'react-router-dom'
import HeroFicha from '../components/ui/HeroFicha.jsx'
import InfoBar from '../components/ui/InfoBar.jsx'
import Photo from '../components/ui/Photo.jsx'
import IconMask from '../components/ui/IconMask.jsx'
import Button from '../components/ui/Button.jsx'
import PracticalInfo from '../components/home/PracticalInfo.jsx'
import { getActivity } from '../data/experiences.js'
import { useActivity } from '../lib/contentApi.js'
import { usePageTitle } from '../lib/usePageTitle.js'

const INFO_FIELDS = [
  { key: 'access', icon: 'huellas', label: 'Cómo llegar' },
  { key: 'difficulty', icon: 'camino', label: 'Dificultad' },
  { key: 'hours', icon: 'horario', label: 'Horario' },
  { key: 'location', icon: 'ubicacion', label: 'Ubicación' },
  { key: 'fee', icon: 'billetera', label: 'Tarifa' },
  { key: 'phone', icon: 'telefono', label: 'Teléfono' },
]

export default function Experiencia() {
  const { slug } = useParams()
  const { data: item, loading } = useActivity(slug, getActivity(slug))
  usePageTitle(item?.title ?? (loading ? 'Qué hacer' : 'Experiencia no encontrada'))

  if (!item && loading) return <section className="section"><div className="container">Cargando…</div></section>

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

  const info = INFO_FIELDS.filter((field) => item.info[field.key]).map((field) => ({
    icon: field.icon,
    label: field.label,
    value: item.info[field.key],
  }))
  const gallery = item.gallery ?? []

  return (
    <>
      <HeroFicha
        eyebrow={item.category}
        pillTone={item.category === 'Naturaleza' ? 'leaf' : 'brown'}
        title={item.title}
        rating={{ kind: 'experiencia', slug: item.slug }}
        summary={item.summary ?? item.text}
        image={item.hero ?? item.photo}
        social={[]}
        dots={false}
        breadcrumb={[
          { label: 'Inicio', to: '/' },
          { label: 'Qué hacer', to: '/que-hacer' },
          { label: item.title },
        ]}
      />

      <div className="container experience">
        {info.length ? <InfoBar items={info} /> : null}

        {item.description ? <p className="experience__description">{item.description}</p> : null}

        {gallery.length ? (
          <div className="experience-gallery">
            {gallery.map((photo) => (
              <Photo key={photo.src} src={photo.src} alt={photo.alt} />
            ))}
          </div>
        ) : null}

        <section className="tips" aria-labelledby="tips-title">
          <h2 id="tips-title">Ten en cuenta</h2>
          <div className="tips__grid">
            {item.tips.map((tip) => (
              <article key={tip.title} className="tip">
                <IconMask icon={`icono-${tip.icon}`} size={64} className="tip__icon" />
                <h3>{tip.title}</h3>
                <p>{tip.text}</p>
              </article>
            ))}
          </div>
          <Button to="/informacion-practica#como-llegar">Consultar información de acceso</Button>
        </section>
      </div>

      <PracticalInfo />
    </>
  )
}
