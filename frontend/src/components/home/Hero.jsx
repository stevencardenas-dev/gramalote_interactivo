import { Link } from 'react-router-dom'

export default function Hero() {
  return (
    <section className="home-hero" aria-labelledby="hero-title">
      <div className="home-hero__bg">
        <img
          src="/img/home/hero.jpg"
          alt="Vista de Gramalote Nuevo entre las montañas de Norte de Santander"
          fetchPriority="high"
          decoding="async"
        />
      </div>

      <div className="container home-hero__inner">
        <p className="home-hero__eyebrow">Gramalote · Norte de Santander</p>
        <h1 id="hero-title">Gramalote te espera entre montañas y memoria</h1>
        <div className="home-hero__actions">
          <Link className="btn btn--primary home-hero__cta" to="/donde-ir">
            Explorar lugares
          </Link>
        </div>
      </div>
    </section>
  )
}
