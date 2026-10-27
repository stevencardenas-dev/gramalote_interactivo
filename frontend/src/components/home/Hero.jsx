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
        <p className="home-hero__text">
          Descubre qué hacer, dónde ir, dónde comer y dónde alojarte en
          Gramalote. Explora sus lugares, conoce su historia y planea tu visita.
        </p>
        <div className="home-hero__actions">
          <Link className="btn btn--primary" to="/que-hacer">
            Ver qué hacer
          </Link>
          <Link className="btn btn--outline-light" to="/donde-ir">
            Explorar lugares
          </Link>
        </div>
      </div>
    </section>
  )
}
