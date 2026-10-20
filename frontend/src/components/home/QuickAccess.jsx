import { Link } from 'react-router-dom'
import Placeholder from '../ui/Placeholder.jsx'

const shortcuts = [
  { label: 'Qué hacer', to: '/que-hacer' },
  { label: 'Dónde comer', to: '/donde-comer' },
  { label: 'Dónde dormir', to: '/donde-dormir' },
  { label: 'Historia', to: '/historia' },
  { label: 'Dónde comprar', to: '/donde-comprar' },
]

export default function QuickAccess() {
  return (
    <section className="quick-access section" aria-labelledby="quick-title">
      <div className="container">
        <div className="quick-access__head">
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
              <Placeholder />
              <span className="quick-card__label">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
