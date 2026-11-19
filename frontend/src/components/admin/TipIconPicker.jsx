import { useEffect, useId, useRef, useState } from 'react'
import IconMask from '../ui/IconMask.jsx'

const LABELS = {
  huellas: 'Huellas',
  camino: 'Camino',
  bolso: 'Bolso',
  info: 'Información',
  alerta: 'Alerta',
  horario: 'Horario',
  ubicacion: 'Ubicación',
  billetera: 'Billetera',
  telefono: 'Teléfono',
}

// Selector de icono de «Ten en cuenta»: muestra el icono además del nombre,
// en el botón y en cada opción de la lista.
export default function TipIconPicker({ icons, value, onChange }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return
      if (event.type === 'mousedown' && root.current?.contains(event.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  return (
    <div className="tip-icon-picker" ref={root}>
      <button
        type="button"
        className="tip-icon-picker__button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Icono: ${LABELS[value] ?? value}`}
        onClick={() => setOpen((current) => !current)}
      >
        <IconMask icon={`icono-${value}`} size={22} />
        <span>{LABELS[value] ?? value}</span>
      </button>
      {open ? (
        <ul id={listId} className="tip-icon-picker__list" role="listbox" aria-label="Iconos">
          {icons.map((icon) => (
            <li key={icon}>
              <button
                type="button"
                role="option"
                aria-selected={icon === value}
                className={icon === value ? 'is-active' : ''}
                onClick={() => {
                  onChange(icon)
                  setOpen(false)
                }}
              >
                <IconMask icon={`icono-${icon}`} size={22} />
                <span>{LABELS[icon] ?? icon}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
