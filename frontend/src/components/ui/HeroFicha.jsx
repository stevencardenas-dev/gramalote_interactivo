import { Link } from 'react-router-dom'
import Placeholder from './Placeholder.jsx'
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
  variant = 'split',
  eyebrow,
  title,
  summary,
  social = [],
  dots = true,
  imageLabel,
  children,
}) {
  return (
    <section className={`ficha-hero ficha-hero--${variant}`}>
      <div className="container">
        <Breadcrumb items={breadcrumb} />
        <div className="ficha-hero__grid">
          {variant === 'split' ? (
            <Placeholder className="ficha-hero__media" label={imageLabel} />
          ) : null}

          <div className="ficha-hero__body">
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}

            {social.length ? (
              <div className="ficha-hero__social">
                {social.map((network) => (
                  <span key={network} className="social-dot" aria-hidden="true">
                    <Icon name={network} size={16} />
                  </span>
                ))}
              </div>
            ) : null}

            <h1>{title}</h1>
            <p>{summary}</p>

            {dots ? (
              <div className="ficha-hero__dots" aria-hidden="true">
                <span />
                <span className="is-active" />
              </div>
            ) : null}

            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
