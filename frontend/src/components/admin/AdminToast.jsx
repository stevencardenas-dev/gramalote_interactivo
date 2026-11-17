import { useEffect, useRef } from 'react'

// Aviso horizontal del panel: errores y mensajes de alerta. Se cierra solo a
// los segundos indicados y la barra inferior marca el tiempo que le queda.
//
// La barra se mueve desde JavaScript y no con una animación CSS: la hoja global
// deja las animaciones en 0.01 ms cuando el sistema pide «reducir movimiento» y,
// en ese caso, la barra se agotaba al instante y el aviso desaparecía sin
// avisar. Así el recorrido es el mismo para todos y coincide con el temporizador.
const TONES = {
  error: 'is-error',
  warn: 'is-warn',
  ok: 'is-ok',
  info: '',
}
const TICK_MS = 100

export default function AdminToast({ tone = 'error', title, message, onClose, seconds = 8 }) {
  const barRef = useRef(null)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    const total = Math.max(1, seconds) * 1000
    const start = Date.now()
    const paint = () => {
      const left = Math.max(0, 1 - (Date.now() - start) / total)
      if (barRef.current) barRef.current.style.transform = `scaleX(${left})`
    }

    paint()
    const tick = setInterval(paint, TICK_MS)
    const timer = setTimeout(() => closeRef.current?.(), total)
    return () => {
      clearInterval(tick)
      clearTimeout(timer)
    }
  }, [seconds])

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
      <span className="admin-toast__track" aria-hidden="true">
        <span ref={barRef} className="admin-toast__bar" />
      </span>
    </div>
  )
}
