import Button from '../ui/Button.jsx'
import { site } from '../../data/site.js'

export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__inner container">
        <p className="hero__eyebrow">{site.place}</p>
        <div>
          <h1 id="hero-title">Gramalote te espera entre montañas y memoria</h1>
          <p className="hero__text">
            Descubre qué hacer, dónde ir, dónde comer y dónde alojarte en
            Gramalote. Explora sus lugares, conoce su historia y planea tu
            visita.
          </p>
        </div>
        <div className="hero__actions">
          <Button to="/que-hacer" icon="arrow">
            Ver qué hacer
          </Button>
          <Button to="/donde-ir" variant="ghost">
            Explorar lugares
          </Button>
        </div>
      </div>
    </section>
  )
}
