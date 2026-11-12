import { useId, useState } from 'react'

// Sección plegable del panel (misma apariencia que en las fichas de establecimientos).
export default function AdminSection({ title, hint, defaultOpen = false, signal = { n: 0, open: true }, children }) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = useId()

  const [seen, setSeen] = useState(signal.n)
  if (seen !== signal.n) {
    setSeen(signal.n)
    setOpen(signal.open)
  }

  return (
    <section className={`admin-section ${open ? 'is-open' : 'is-closed'}`}>
      <div className="admin-section__bar">
        <h2>
          <button
            type="button"
            className="admin-section__toggle"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="admin-section__title">
              {title}
              {hint ? <small>{hint}</small> : null}
            </span>
            <span className="admin-section__chevron" aria-hidden="true" />
          </button>
        </h2>
      </div>
      <div
        id={bodyId}
        className="admin-section__body"
        hidden={!open}
        style={{ display: open ? undefined : 'none' }}
        onInvalidCapture={() => setOpen(true)}
      >
        {children}
      </div>
    </section>
  )
}
