import { Link } from 'react-router-dom'
import Photo from '../ui/Photo.jsx'

const shortcuts = [
  { label: 'Que hacer', to: '/que-hacer', photo: '/img/home/que-hacer.jpg' },
  { label: 'Dónde comer', to: '/donde-comer', photo: '/img/home/comer.jpg' },
  { label: 'Dónde dormir', to: '/donde-dormir', photo: '/img/home/dormir.jpg' },
  { label: 'Su historia', to: '/historia', photo: '/img/home/historia.jpg' },
  { label: 'Dónde comprar', to: '/donde-comprar', photo: '/img/home/comprar.jpg' },
]

export default function QuickAccess() {
  return (
    <section className="quick-access" aria-labelledby="quick-title">
      <div className="container">
        <div className="section-head section-head--center">
          <h2 id="quick-title">Accede rápido</h2>
          <p>
            Explora Gramalote Nuevo y Gramalote Viejo en el mapa. Filtra por
            categoría, encuentra lugares de interés y consulta sus fichas. Los
            sitios naturales se muestran como referencia, sin rutas detalladas.
          </p>
        </div>

        <div className="quick-grid">
          {shortcuts.map((item) => (
            <Link key={item.to} className="quick-card" to={item.to}>
              <Photo src={item.photo} alt={item.label} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
