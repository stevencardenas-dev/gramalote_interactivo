import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'

function Breadcrumb({ items = [] }) {
  return (
    <nav aria-label="Migas de pan">
      <ol className="breadcrumb">
        {items.map((item, index) => {
          const current = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} aria-current={current ? 'page' : undefined}>
              {current || !item.to ? item.label : <Link to={item.to}>{item.label}</Link>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default function HeroFicha({
  breadcrumb,
  eyebrow,
  title,
  summary,
  image,
  imageAlt = '',
  pillTone = 'olive',
  social = ['instagram', 'share'],
  dots = true,
}) {
  const icons = Array.isArray(social) ? social : social ? ['instagram', 'share'] : []

  return (
    <section className="ficha-hero">
      <div className="ficha-hero__bg">
        {image ? <img src={image} alt={imageAlt} /> : null}
      </div>

      <div className="container ficha-hero__inner">
        <Breadcrumb items={breadcrumb} />

        <div className="ficha-hero__center">
          {icons.length ? (
            <div className="ficha-hero__social">
              {icons.includes('instagram') ? (
                <a
                  className="social-dot"
                  href="https://www.instagram.com/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                >
                  <Icon name="instagram" />
                </a>
              ) : null}
              {icons.includes('share') ? (
                <a className="social-dot" href="#compartir" aria-label="Compartir">
                  <Icon name="share" />
                </a>
              ) : null}
            </div>
          ) : null}

          {eyebrow ? (
            <span className={`ficha-hero__pill ficha-hero__pill--${pillTone}`}>{eyebrow}</span>
          ) : null}

          <h1>{title}</h1>

          {summary ? <p className="ficha-hero__summary">{summary}</p> : null}

          {dots ? (
            <div className="ficha-hero__dots" aria-hidden="true">
              <span className="is-active" />
              <span />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
