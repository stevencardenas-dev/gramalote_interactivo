import { useEffect, useId, useRef, useState } from 'react'
import { usePageContent } from '../../lib/pageContent.js'
import SocialIcon from './SocialIcon.jsx'

const DEFAULT_PHONE = '573204177123'
const MESSAGE =
  '¿Necesitas información? Escríbenos por WhatsApp, estamos aquí para ayudarte a conocer Gramalote.'

// Número listo para wa.me: si es de Colombia (10 dígitos) se antepone 57.
function phoneDigits(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return DEFAULT_PHONE
  return digits.length === 10 ? `57${digits}` : digits
}

export default function WhatsAppHelp() {
  const { supportWhatsapp } = usePageContent('redes')
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const button = useRef(null)
  const panelId = useId()
  const phone = phoneDigits(supportWhatsapp)
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(MESSAGE)}`

  useEffect(() => {
    if (!open) return undefined
    const closeOutside = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false)
    }
    const closeWithEscape = (event) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      button.current?.focus()
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeWithEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeWithEscape)
    }
  }, [open])

  return (
    <div className="wa-help" ref={root}>
      {open ? (
        <div className="wa-help__card" id={panelId} role="dialog" aria-label="Ayuda por WhatsApp">
          <button
            type="button"
            className="wa-help__close"
            aria-label="Cerrar ayuda"
            onClick={() => {
              setOpen(false)
              button.current?.focus()
            }}
          >
            ×
          </button>
          <p>{MESSAGE}</p>
          <a className="wa-help__cta" href={href} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
            Abrir WhatsApp
          <span className="visually-hidden"> (se abre en una pestaña nueva)</span></a>
        </div>
      ) : null}
      <button
        type="button"
        ref={button}
        className="wa-help__button"
        aria-label="¿Necesitas información? Escríbenos por WhatsApp"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <SocialIcon name="whatsapp" size={27} />
      </button>
    </div>
  )
}
