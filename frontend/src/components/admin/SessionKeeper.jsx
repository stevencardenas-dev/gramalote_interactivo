import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { expireSession, getSessionTiming, refreshSession } from '../../lib/auth.js'

const TICK_MS = 15_000
const WARN_MS = 2 * 60 * 1000 // aviso de inactividad: 2 min antes del cierre
const KEEP_MS = 5 * 60 * 1000 // con actividad, se renueva al faltar 5 min
const END_WARN_MS = 10 * 60 * 1000 // aviso de duración máxima: 10 min antes

function clock(ms) {
  return new Date(ms).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
}

function countdown(ms) {
  const seconds = Math.max(Math.ceil(ms / 1000), 0)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

// Vigila la sesión del panel. La API es la que cierra (30 min sin uso, 8 h como
// máximo); aquí solo se renueva cuando hay actividad y se avisa antes del
// cierre para no perder lo que se esté editando.
export default function SessionKeeper() {
  const navigate = useNavigate()
  const lastActivity = useRef(Date.now())
  const [warning, setWarning] = useState(null)
  const [now, setNow] = useState(Date.now())
  const endNoticeShown = useRef(false)

  useEffect(() => {
    const mark = () => {
      lastActivity.current = Date.now()
    }
    const events = ['pointerdown', 'keydown', 'wheel', 'touchstart']
    events.forEach((name) => window.addEventListener(name, mark, { passive: true }))
    return () => events.forEach((name) => window.removeEventListener(name, mark))
  }, [])

  useEffect(() => {
    async function tick() {
      const timing = getSessionTiming()
      const current = Date.now()
      setNow(current)
      if (!timing) {
        setWarning(null)
        return
      }

      if (current >= timing.endsAt) {
        setWarning(null)
        expireSession('La sesión llegó a su duración máxima de 8 horas; vuelve a iniciar sesión.')
        navigate('/acceder', { replace: true })
        return
      }
      if (current >= timing.expiresAt) {
        setWarning(null)
        expireSession('Tu sesión se cerró por inactividad; vuelve a iniciar sesión.')
        navigate('/acceder', { replace: true })
        return
      }

      const active = lastActivity.current > timing.renewedAt
      const left = timing.expiresAt - current
      const canExtend = timing.expiresAt < timing.endsAt

      // Hubo actividad desde la última renovación: se renueva sin molestar.
      if (active && left <= KEEP_MS && canExtend) {
        await refreshSession()
        setWarning(null)
        return
      }

      if (timing.endsAt - current <= END_WARN_MS && !endNoticeShown.current) {
        endNoticeShown.current = true
        setWarning({ kind: 'end' })
        return
      }

      if (!active && left <= WARN_MS && canExtend) {
        setWarning((value) => (value?.kind === 'idle' ? value : { kind: 'idle' }))
      } else if (warning?.kind === 'idle') {
        setWarning(null)
      }
    }

    tick()
    const timer = window.setInterval(tick, TICK_MS)
    return () => window.clearInterval(timer)
  }, [navigate, warning])

  // Durante el aviso de inactividad, la cuenta regresiva avanza cada segundo.
  useEffect(() => {
    if (warning?.kind !== 'idle') return undefined
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [warning])

  if (!warning) return null
  const timing = getSessionTiming()
  if (!timing) return null

  async function stay() {
    lastActivity.current = Date.now()
    await refreshSession()
    setWarning(null)
  }

  const idle = warning.kind === 'idle'
  return (
    <div className="admin-dialog" role="presentation">
      <div className="admin-dialog__panel nearby" role="alertdialog" aria-modal="true" aria-labelledby="session-title" aria-describedby="session-text">
        <div className="nearby__head">
          <span className="nearby__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 7v5l3 2" />
              <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" />
            </svg>
          </span>
          <div>
            <h2 className="nearby__title" id="session-title">
              {idle ? 'Tu sesión está por cerrarse' : 'Tu sesión terminará pronto'}
            </h2>
            <p className="nearby__text" id="session-text">
              {idle
                ? `Por seguridad se cierra tras ${timing.idleMinutes} minutos sin usar el panel. Se cerrará en ${countdown(timing.expiresAt - now)}.`
                : `Las sesiones duran como máximo 8 horas. La tuya termina a las ${clock(timing.endsAt)}: guarda tus cambios antes.`}
            </p>
          </div>
        </div>
        <div className="admin-dialog__actions nearby__actions">
          {idle ? (
            <button type="button" className="admin-btn admin-btn--primary" onClick={stay} autoFocus>
              Seguir conectado
            </button>
          ) : (
            <button type="button" className="admin-btn admin-btn--primary" onClick={() => setWarning(null)} autoFocus>
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
