import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { fetchRating, sendRating } from '../../lib/ratingsApi.js'

const STAR = 'M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.2 1.2-6.5L2.5 9.5l6.6-.9z'
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const LABELS = ['', 'Podría mejorar', 'Regular', 'Bueno', 'Muy bueno', 'Excelente']

function Star({ fill = 1 }) {
  return (
    <span className="stars__star" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d={STAR} />
      </svg>
      <span className="stars__fill" style={{ width: `${Math.round(fill * 100)}%` }}>
        <svg viewBox="0 0 24 24">
          <path d={STAR} />
        </svg>
      </span>
    </span>
  )
}

// Estrellas fijas (sin interacción): también sirven de muestra en el buscador.
export function StarsRow({ value = 0 }) {
  return (
    <span className="stars__row">
      {[0, 1, 2, 3, 4].map((index) => (
        <Star key={index} fill={Math.min(Math.max(value - index, 0), 1)} />
      ))}
    </span>
  )
}

function RatingDialog({ kind, slug, title, confirm, onClose, onSaved }) {
  const titleId = useId()
  const nameRef = useRef(null)
  const [stars, setStars] = useState(0)
  const [hover, setHover] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit(event) {
    event.preventDefault()
    if (!stars) return setError('Elige de 1 a 5 estrellas.')
    if (name.trim().length < 2) return setError('Escribe tu nombre.')
    if (!EMAIL.test(email.trim())) return setError('Escribe un correo válido.')
    setError('')
    setBusy(true)
    try {
      const stats = await sendRating(kind, slug, {
        name: name.trim(),
        email: email.trim(),
        stars,
      })
      onSaved(stats)
      setPending(Boolean(stats?.pending))
      setDone(true)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  const shown = hover || stars

  return createPortal(
    <div
      className="rating-modal"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="rating-modal__card" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button type="button" className="rating-modal__close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        {done ? (
          <div className="rating-modal__done">
            {pending ? (
              <>
                <h2 id={titleId}>Revisa tu correo</h2>
                <p>
                  Te enviamos un enlace a <strong>{email.trim()}</strong>. Ábrelo para que tu
                  calificación de {stars} {stars === 1 ? 'estrella' : 'estrellas'} cuente para {title}.
                  Si no lo ves en unos minutos, busca en spam o promociones.
                </p>
              </>
            ) : (
              <>
                <h2 id={titleId}>¡Gracias por calificar!</h2>
                <p>
                  Tu calificación de {stars} {stars === 1 ? 'estrella' : 'estrellas'} ya cuenta para{' '}
                  {title}.
                </p>
              </>
            )}
            <button type="button" className="btn btn--primary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <h2 id={titleId}>Califica {title}</h2>
            <p className="rating-modal__hint">
              Toca una estrella. No se reciben comentarios.
              {confirm ? ' Te enviaremos un correo para confirmar tu voto.' : ''}
            </p>
            <div
              className="rating-modal__stars"
              role="radiogroup"
              aria-label="Calificación"
              onMouseLeave={() => setHover(0)}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={stars === value}
                  aria-label={`${value} ${value === 1 ? 'estrella' : 'estrellas'}`}
                  className={value <= shown ? 'is-on' : undefined}
                  onMouseEnter={() => setHover(value)}
                  onClick={() => {
                    setStars(value)
                    nameRef.current?.focus()
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d={STAR} />
                  </svg>
                </button>
              ))}
            </div>
            <p className="rating-modal__label" aria-live="polite">
              {LABELS[shown]}
            </p>
            <label className="rating-modal__field">
              Nombre
              <input
                ref={nameRef}
                type="text"
                value={name}
                maxLength={80}
                autoComplete="name"
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="rating-modal__field">
              Correo electrónico
              <input
                type="email"
                value={email}
                maxLength={160}
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            {error ? (
              <p className="rating-modal__error" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="btn btn--primary" disabled={busy}>
              {busy ? 'Enviando…' : 'Enviar calificación'}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default function RatingStars({ kind, slug, title }) {
  const [stats, setStats] = useState(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetchRating(kind, slug, controller.signal)
      .then(setStats)
      .catch(() => setStats({ average: 0, votes: 0 }))
    return () => controller.abort()
  }, [kind, slug])

  const votes = stats?.votes ?? 0
  const average = stats?.average ?? 0
  const label = votes ? average.toFixed(1).replace('.', ',') : ''

  return (
    <div className="stars">
      <button
        type="button"
        className={`stars__button${votes ? '' : ' is-empty'}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`${votes ? `Calificación ${average.toFixed(1)} de 5. ` : ''}Toca para calificar`}
      >
        <StarsRow value={average} />
        {label ? <span className="stars__text">{label}</span> : null}
      </button>
      <button type="button" className="stars__cta" onClick={() => setOpen(true)}>
        Toca para calificar
      </button>
      {open ? (
        <RatingDialog
          kind={kind}
          slug={slug}
          title={title}
          confirm={Boolean(stats?.confirm)}
          onClose={() => setOpen(false)}
          onSaved={(next) => setStats((current) => ({ ...current, ...next }))}
        />
      ) : null}
    </div>
  )
}
