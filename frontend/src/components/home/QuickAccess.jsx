import { Link } from 'react-router-dom'
import Photo from '../ui/Photo.jsx'
import { PAGE_DEFAULTS } from '../../data/pages.js'

// Las cinco secciones son fijas; desde el panel solo cambia su foto.
export default function QuickAccess({ items = PAGE_DEFAULTS.inicio.quickAccess }) {
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
          {items.map((item) => (
            <Link key={item.id} className="quick-card" to={item.to}>
              <Photo src={item.photo} alt={item.label} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
