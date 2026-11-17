import { useEffect, useState } from 'react'
import { onOutbox } from '../../lib/outbox.js'

// Aviso breve cuando la cola sin conexión logra (o no) reenviar lo guardado.
export default function OutboxNotice() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    let timer = 0
    const off = onOutbox((detail) => {
      if (!detail || (!detail.sent && !detail.rejected)) return
      window.clearTimeout(timer)
      if (detail.pending > 0) {
        setMessage(
          detail.sent > 0
            ? `Enviamos ${detail.sent} de tus envíos guardados. Los demás se reintentarán cuando vuelva la señal.`
            : 'Todavía no hay señal. Tus envíos siguen guardados en este dispositivo.',
        )
      } else if (detail.rejected > 0 && !detail.sent) {
        setMessage('No pudimos reenviar un envío guardado. Revisa los datos e inténtalo de nuevo.')
      } else {
        setMessage(
          detail.sent === 1
            ? 'Ya enviamos lo que habías guardado sin conexión. ¡Gracias!'
            : `Ya enviamos los ${detail.sent} envíos que habías guardado sin conexión. ¡Gracias!`,
        )
      }
      timer = window.setTimeout(() => setMessage(''), 8000)
    })
    return () => {
      off()
      window.clearTimeout(timer)
    }
  }, [])

  if (!message) return null

  return (
    <p className="outbox-toast" role="status">
      {message}
    </p>
  )
}
