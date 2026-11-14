import { useModalFocus } from '../../lib/useModalFocus.js'
import { useEffect, useId, useRef } from 'react'

// Popup genérico del sitio y del panel: una sola caja para avisos y para
// confirmaciones, en lugar del alert/confirm del navegador. Se abre desde
// useDialog(); Escape, «Cancelar» y el clic fuera cierran sin hacer nada.
export default function Dialog({
  kind = 'confirm',
  title,
  message,
  hint,
  confirmLabel,
  cancelLabel = 'Cancelar',
  danger = false,
  onClose,
}) {
  const titleId = useId()
  const confirmRef = useRef(null)
  const panelRef = useModalFocus()
  const isAlert = kind === 'alert'

  useEffect(() => {
    confirmRef.current?.focus()

    function onKeyDown(event) {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      onClose(false)
    }

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [onClose])

  return (
    <div className="app-dialog" role="presentation" onClick={() => onClose(false)}>
      <div
        ref={panelRef}
        className="app-dialog__panel"
        role={isAlert ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? `${titleId}-text` : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        {title ? (
          <h2 id={titleId} className="app-dialog__title">
            {title}
          </h2>
        ) : null}
        {message ? (
          <p id={`${titleId}-text`} className="app-dialog__text">
            {message}
          </p>
        ) : null}
        {hint ? <p className="app-dialog__hint">{hint}</p> : null}
        <div className="app-dialog__actions">
          {isAlert ? null : (
            <button type="button" className="app-dialog__btn" onClick={() => onClose(false)}>
              {cancelLabel}
            </button>
          )}
          <button
            ref={confirmRef}
            type="button"
            className={`app-dialog__btn app-dialog__btn--primary${danger ? ' is-danger' : ''}`}
            onClick={() => onClose(true)}
          >
            {confirmLabel ?? (isAlert ? 'Entendido' : 'Confirmar')}
          </button>
        </div>
      </div>
    </div>
  )
}
