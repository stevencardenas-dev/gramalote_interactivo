import { useId } from 'react'
import { useModalFocus } from '../../lib/useModalFocus.js'


// Aviso modal del panel. Se usa cuando faltan datos obligatorios o cuando la API
// rechaza un guardado, para que el mensaje no pase desapercibido en el pie.
export default function AdminDialog({
  title,
  message,
  items = [],
  hint,
  onClose,
  actionLabel = 'Entendido',
}) {
  const titleId = useId()

  const panelRef = useModalFocus(onClose)

  return (
    <div className="admin-dialog" role="presentation" onClick={onClose}>
      <div
        className="admin-dialog__panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="admin-dialog__title">
          {title}
        </h2>
        {message ? <p className="admin-dialog__text">{message}</p> : null}
        {items.length ? (
          <ul className="admin-dialog__list">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
        {hint ? <p className="note">{hint}</p> : null}
        <div className="admin-dialog__actions">
          <button type="button" className="admin-btn admin-btn--primary" onClick={onClose} autoFocus>
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
