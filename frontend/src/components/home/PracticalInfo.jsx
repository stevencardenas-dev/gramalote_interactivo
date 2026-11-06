import { Link } from 'react-router-dom'
import { site } from '../../data/site.js'
import IconMask from '../ui/IconMask.jsx'

export default function PracticalInfo() {
  return (
    <section className="practical" aria-labelledby="practical-title">
      <div className="container">
        <div className="section-head section-head--center">
          <p className="eyebrow">Información práctica</p>
          <h2 id="practical-title">¿Qué debes saber si vas a visitar Gramalote?</h2>
        </div>

        <div className="practical-grid">
          {site.practical.map((item) => (
            <Link key={item.title} className="feature-card" to={item.to}>
              {item.illustration ? (
                <img className="feature-card__art" src={item.illustration} alt="" loading="lazy" />
              ) : (
                <span className="feature-card__icon">
                  <IconMask icon={`icono-${item.brandIcon}`} size={58} />
                </span>
              )}
              <h3 className="feature-card__title">{item.title}</h3>
              <p>{item.text}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
