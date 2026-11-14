import { useEffect } from 'react'

// Aviso horizontal del panel: errores y mensajes de alerta. Se cierra solo a
// los ocho segundos y la barra inferior marca el tiempo que le queda.
const TONES = {
  error: 'is-error',
  warn: 'is-warn',
  ok: 'is-ok',
  info: '',
}

export default function AdminToast({ tone = 'error', title, message, onClose, seconds = 8 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, seconds * 1000)
    return () => clearTimeout(timer)
  }, [onClose, seconds])

  return (
    <div className={`admin-toast ${TONES[tone] ?? ''}`} role={tone === 'error' ? 'alert' : 'status'}>
      <span className="admin-toast__dot" aria-hidden="true" />
      <div className="admin-toast__body">
        {title ? <strong>{title}</strong> : null}
        {message ? <p>{message}</p> : null}
      </div>
      <button type="button" className="admin-toast__close" onClick={onClose} aria-label="Cerrar aviso">
        ✕
      </button>
      <span className="admin-toast__bar" style={{ animationDuration: `${seconds}s` }} aria-hidden="true" />
    </div>
  )
}
