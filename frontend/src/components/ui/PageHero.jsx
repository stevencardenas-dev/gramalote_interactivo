import { Link } from 'react-router-dom'

function Breadcrumb({ items }) {
  if (!items?.length) return null

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

export default function PageHero({
  title,
  intro,
  eyebrow,
  center = true,
  breadcrumb,
  children,
  className = '',
}) {
  const trail = breadcrumb ?? [{ label: 'Inicio', to: '/' }, { label: title }]

  return (
    <section className={`page-hero${center ? ' page-hero--center' : ''} ${className}`.trim()}>
      <div className="container">
        <Breadcrumb items={trail} />
        <div className="page-hero__inner">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          {intro ? <p className="page-hero__intro">{intro}</p> : null}
          {children}
        </div>
      </div>
    </section>
  )
}
