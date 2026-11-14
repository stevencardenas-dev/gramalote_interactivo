import { useModalFocus } from '../../lib/useModalFocus.js'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { fetchRating, formatAverage, formatVotes, sendRating } from '../../lib/ratingsApi.js'

const STAR = 'M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.2 1.2-6.5L2.5 9.5l6.6-.9z'
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const LABELS = ['', 'Podría mejorar', 'Regular', 'Bueno', 'Muy bueno', 'Excelente']
const CONFETTI = ['gold', 'coral', 'green', 'navy', 'gold', 'brick', 'green', 'coral']

const plural = (value) => `${value} ${value === 1 ? 'estrella' : 'estrellas'}`

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


// Resumen que se ve al enviar: colores y figuras en lugar de un párrafo.
function RatingResult({ titleId, title, email, stars, pending, before, after, onClose }) {
  const votesBefore = before?.votes ?? 0
  const averageBefore = before?.average ?? 0
  const shown = pending ? before : after
  const average = shown?.average ?? 0
  const votes = shown?.votes ?? 0
  const gainedVote = !pending && votes > votesBefore
  const delta = Math.round((average - averageBefore) * 10) / 10

  let trend = null
  if (!pending) {
    if (votesBefore === 0) trend = { tone: 'gold', icon: '★', text: '¡Primer voto!' }
    else if (delta > 0) trend = { tone: 'green', icon: '▲', text: `+${formatAverage(delta)}` }
    else if (delta < 0) trend = { tone: 'brick', icon: '▼', text: `−${formatAverage(Math.abs(delta))}` }
    else trend = { tone: 'navy', icon: '＝', text: 'Se mantiene' }
  }

  return (
    <div className="rating-result">
      <div className={`rating-result__badge${pending ? ' is-pending' : ''}`} aria-hidden="true">
        {CONFETTI.map((tone, index) => (
          <i key={index} className={`rating-result__bit rating-result__bit--${tone}`} style={{ '--i': index }} />
        ))}
        <span className="rating-result__core">
          {pending ? (
            <svg viewBox="0 0 24 24">
              <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5zm1.8.6v.2l7.2 5 7.2-5v-.2zm14.4 2.6-6.8 4.7a.7.7 0 0 1-.8 0L4.8 9.7v7.8h14.4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24">
              <path d={STAR} />
            </svg>
          )}
        </span>
      </div>

      <h2 id={titleId}>{pending ? '¡Casi listo! Revisa tu correo' : '¡Gracias por calificar!'}</h2>
      <p className="rating-result__lead">
        {pending ? (
          <>
            Te enviamos un enlace a <strong>{email}</strong>. Ábrelo y tu voto contará para{' '}
            <strong>{title}</strong>. Si no llega, mira en spam o promociones. Ya verificado ese correo,
            tus próximas calificaciones contarán al instante.
          </>
        ) : (
          <>
            Tu voto ya cuenta para <strong>{title}</strong>.
          </>
        )}
      </p>

      <div className="rating-result__mine" role="img" aria-label={`Tu voto: ${plural(stars)}`}>
        <StarsRow value={stars} />
        <span>{pending ? 'Tu voto · por confirmar' : 'Tu voto'}</span>
      </div>

      <div className="rating-result__stats">
        <div className="rating-result__stat rating-result__stat--avg">
          <small>{pending ? 'Promedio actual' : 'Nuevo promedio'}</small>
          <strong>
            {votes ? formatAverage(average) : '—'}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={STAR} />
            </svg>
          </strong>
          {trend ? (
            <em className={`rating-result__tag rating-result__tag--${trend.tone}`}>
              <span aria-hidden="true">{trend.icon}</span> {trend.text}
            </em>
          ) : null}
        </div>
        <div className="rating-result__stat rating-result__stat--votes">
          <small>{pending ? 'Votos actuales' : 'Votos en total'}</small>
          <strong>{votes}</strong>
          {gainedVote ? (
            <em className="rating-result__tag rating-result__tag--coral">
              <span aria-hidden="true">＋</span> 1 nuevo
            </em>
          ) : pending ? (
            <em className="rating-result__tag rating-result__tag--gold">
              <span aria-hidden="true">⏳</span> Falta el tuyo
            </em>
          ) : (
            <em className="rating-result__tag rating-result__tag--navy">Voto actualizado</em>
          )}
        </div>
      </div>

      <button type="button" className="btn btn--primary" onClick={onClose}>
        Listo
      </button>
    </div>
  )
}

function RatingDialog({ kind, slug, title, confirm, before, onClose, onSaved }) {
  const titleId = useId()
  const nameRef = useRef(null)
  const [stars, setStars] = useState(0)
  const [hover, setHover] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)
  const [after, setAfter] = useState(null)

  const panelRef = useModalFocus(onClose)

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
        comment: comment.trim(),
      })
      onSaved(stats)
      setAfter(stats)
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
      <div className="rating-modal__card" ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button type="button" className="rating-modal__close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        {done ? (
          <RatingResult
            titleId={titleId}
            title={title}
            email={email.trim()}
            stars={stars}
            pending={pending}
            before={before}
            after={after}
            onClose={onClose}
          />
        ) : (
          <form onSubmit={submit} noValidate>
            <h2 id={titleId}>Califica {title}</h2>
            <p className="rating-modal__hint">
              Toca una estrella y, si quieres, cuéntanos qué te pareció.
              {confirm
                ? ' La primera vez confirmas tu voto con un correo; después, tus calificaciones con ese mismo correo cuentan al instante.'
                : ''}
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
            <label className="rating-modal__field">
              Comentario (opcional)
              <textarea
                value={comment}
                maxLength={1000}
                rows={3}
                placeholder="¿Qué te pareció? Lo leerá el equipo del sitio."
                onChange={(event) => setComment(event.target.value)}
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
  const label = votes ? formatAverage(average) : ''

  return (
    <div className="stars">
      <button
        type="button"
        className={`stars__button${votes ? '' : ' is-empty'}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`${votes ? `Calificación ${formatAverage(average)} de 5 con ${formatVotes(votes)}. ` : ''}Toca para calificar`}
      >
        <StarsRow value={average} />
        {label ? <span className="stars__text">{label}</span> : null}
        {votes ? <span className="stars__votes">{formatVotes(votes)}</span> : null}
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
          before={stats}
          onClose={() => setOpen(false)}
          onSaved={(next) => setStats((current) => ({ ...current, ...next }))}
        />
      ) : null}
    </div>
  )
}
