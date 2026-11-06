import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import SocialIcon from './SocialIcon.jsx'

const NETWORKS = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  x: 'X',
}

function ShareButton({ title }) {
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // El usuario canceló o el navegador bloqueó el portapapeles.
    }
  }

  return (
    <button
      type="button"
      className="social-dot"
      onClick={share}
      aria-label={copied ? 'Enlace copiado' : 'Compartir'}
      title={copied ? 'Enlace copiado' : 'Compartir'}
    >
      <Icon name="share" />
    </button>
  )
}

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
  social = ['share'],
  links = [],
  dots = true,
}) {
  const canShare = Array.isArray(social) ? social.includes('share') : Boolean(social)
  const networks = links.filter((link) => NETWORKS[link.platform] && link.url)

  return (
    <section className="ficha-hero">
      <div className="ficha-hero__bg">
        {image ? <img src={image} alt={imageAlt} /> : null}
      </div>

      <div className="container ficha-hero__inner">
        <Breadcrumb items={breadcrumb} />

        <div className="ficha-hero__center">
          {networks.length || canShare ? (
            <div className="ficha-hero__social">
              {networks.map((link) => (
                <a
                  key={link.platform}
                  className="social-dot"
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={NETWORKS[link.platform]}
                  title={NETWORKS[link.platform]}
                >
                  <SocialIcon name={link.platform} />
                </a>
              ))}
              {canShare ? <ShareButton title={title} /> : null}
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
