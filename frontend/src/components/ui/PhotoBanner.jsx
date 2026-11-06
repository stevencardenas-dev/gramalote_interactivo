import Button from './Button.jsx'

// Foto a todo el ancho con una tarjeta crema al centro (Curiosidades en los
// listados, Conoce nuestra historia en Qué hacer).
export default function PhotoBanner({ image, eyebrow, title, text, cta, to }) {
  return (
    <section className="curio-banner" style={{ '--banner-image': `url(${image})` }}>
      <div className="curio-banner__card">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        <p>{text}</p>
        <Button to={to}>{cta}</Button>
      </div>
    </section>
  )
}
