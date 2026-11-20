import { useEffect, useId, useRef, useState } from 'react'
import { TEXT_LEVELS, useAccessibility } from '../../lib/accessibility.js'
import { useModalFocus } from '../../lib/useModalFocus.js'

// Menú de accesibilidad: botón flotante a la izquierda y panel con las ayudas del
// visitante. Se abre también con Ctrl+U. Las preferencias se guardan en el navegador.

const ICONS = {
  contrast: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0v18m0-18a9 9 0 0 1 0 18',
  links: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1',
  text: 'M4 7V5h10v2M9 5v14M7 19h4M14 11V9h7v2M17.5 9v10M16 19h3',
  spacing: 'M3 6v12M21 6v12M7 12h10M7 12l3-3M7 12l3 3M17 12l-3-3M17 12l-3 3',
  motion: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM10 9v6M14 9v6',
  images: 'M4 5h16v14H4V5Zm0 11 4.5-4.5 3.5 3.5 2.5-2.5L20 16M9 9.5v.01M3 3l18 18',
  font: 'M5 19 10 5l5 14M7 14h6M17 9h4M19 9v10',
  cursor: 'M6 3l12 8-5.2 1.3L16 19l-2.6 1.2-3.2-6.6L6 17V3Z',
}

function Glyph({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  )
}

function Panel({ onClose }) {
  const titleId = useId()
  const panelRef = useModalFocus(onClose)
  const { prefs, active, toggle, cycleText, reset } = useAccessibility()
  const [message, setMessage] = useState('')

  const options = [
    { key: 'contrast', label: 'Contraste alto', help: 'Colores más oscuros y bordes marcados' },
    { key: 'links', label: 'Resaltar enlaces', help: 'Subraya y destaca los enlaces' },
    { key: 'spacing', label: 'Espaciado de texto', help: 'Más aire entre letras, palabras y líneas' },
    { key: 'motion', label: 'Detener animaciones', help: 'Sin movimiento ni transiciones' },
    { key: 'images', label: 'Ocultar imágenes', help: 'Deja solo el texto' },
    { key: 'font', label: 'Fuente legible', help: 'Letra con formas más distinguibles' },
    { key: 'cursor', label: 'Cursor grande', help: 'Puntero más fácil de ver' },
  ]

  function onToggle(option) {
    toggle(option.key)
    setMessage(`${option.label}: ${prefs[option.key] ? 'desactivado' : 'activado'}`)
  }

  function onText() {
    cycleText()
    setMessage(`Tamaño del texto: ${TEXT_LEVELS[(prefs.text + 1) % TEXT_LEVELS.length]}`)
  }

  function onReset() {
    reset()
    setMessage('Preferencias restablecidas')
  }

  return (
    <div ref={panelRef} className="a11y-panel" role="dialog" aria-labelledby={titleId}>
      <div className="a11y-panel__head">
        <h2 id={titleId}>Menú de accesibilidad</h2>
        <button type="button" className="a11y-panel__close" aria-label="Cerrar el menú de accesibilidad" onClick={onClose}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <ul className="a11y-grid">
        <li>
          <button type="button" className={`a11y-opt${prefs.text > 0 ? ' is-on' : ''}`} aria-pressed={prefs.text > 0} onClick={onText}>
            <Glyph name="text" />
            <span className="a11y-opt__label">Agrandar texto</span>
            <span className="a11y-opt__help">{TEXT_LEVELS[prefs.text]}</span>
          </button>
        </li>
        {options.map((option) => (
          <li key={option.key}>
            <button type="button" className={`a11y-opt${prefs[option.key] ? ' is-on' : ''}`} aria-pressed={prefs[option.key]} onClick={() => onToggle(option)}>
              <Glyph name={option.key} />
              <span className="a11y-opt__label">{option.label}</span>
              <span className="a11y-opt__help">{option.help}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="a11y-panel__foot">
        <button type="button" className="a11y-reset" disabled={!active} onClick={onReset}>
          Restablecer
        </button>
        <p className="a11y-panel__tip">Atajo: Ctrl + U</p>
      </div>
      <p className="visually-hidden" role="status" aria-live="polite">
        {message}
      </p>
    </div>
  )
}

export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false)
  const { active } = useAccessibility()
  const buttonRef = useRef(null)

  useEffect(() => {
    function onKeyDown(event) {
      if (event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey && event.key.toLowerCase() === 'u') {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`a11y-fab${active ? ' is-active' : ''}`}
        aria-label="Menú de accesibilidad"
        aria-expanded={open}
        aria-keyshortcuts="Control+U"
        title="Accesibilidad (Ctrl + U)"
        onClick={() => setOpen((value) => !value)}
      >
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="4.5" r="1.8" />
          <path d="M5 8.5l7 1.5 7-1.5M12 10v4.5m0 0-3 5.5m3-5.5 3 5.5" />
        </svg>
      </button>
      {open ? <Panel onClose={() => setOpen(false)} /> : null}
    </>
  )
}
