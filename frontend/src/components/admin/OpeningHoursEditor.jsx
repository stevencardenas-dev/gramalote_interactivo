// Horario por día y excepciones (festivos, cierres). Es lo que usa la API para
// calcular "Abierto hoy"; el texto de la ficha se puede generar desde aquí.
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DEFAULT_SLOT = { opensAt: '08:00', closesAt: '18:00' }

const hhmm = (value) => (value ? String(value).slice(0, 5) : '')

// Un día sin filas es "sin dato": la API no sabe si está abierto.
function dayMode(slots) {
  if (slots.length === 0) return 'unknown'
  return slots.every((slot) => slot.closed) ? 'closed' : 'open'
}

// sort_order es único por día: se renumera cada vez que cambia algo.
function normalize(hours) {
  const counters = {}
  return [...hours]
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((slot) => {
      counters[slot.dayOfWeek] = (counters[slot.dayOfWeek] ?? -1) + 1
      return { ...slot, sortOrder: counters[slot.dayOfWeek] }
    })
}

function formatTime(value) {
  const [hours, minutes] = hhmm(value).split(':').map(Number)
  if (!Number.isFinite(hours)) return ''
  const suffix = hours < 12 ? 'a. m.' : 'p. m.'
  const twelve = hours % 12 === 0 ? 12 : hours % 12
  return `${twelve}:${String(minutes).padStart(2, '0')} ${suffix}`
}

// "Lunes a viernes, de 8:00 a. m. a 6:00 p. m. · Domingo, cerrado"
function hoursToText(hours) {
  const byDay = DAYS.map((_label, index) =>
    hours.filter((slot) => slot.dayOfWeek === index + 1),
  )
  const describe = (slots) => {
    const mode = dayMode(slots)
    if (mode === 'unknown') return null
    if (mode === 'closed') return 'cerrado'
    return slots
      .filter((slot) => !slot.closed)
      .map((slot) => `de ${formatTime(slot.opensAt)} a ${formatTime(slot.closesAt)}`)
      .join(' y ')
  }

  const groups = []
  byDay.forEach((slots, index) => {
    const text = describe(slots)
    const last = groups.at(-1)
    if (text && last && last.text === text && last.to === index - 1) last.to = index
    else if (text) groups.push({ from: index, to: index, text })
  })

  return groups
    .map(({ from, to, text }) => {
      const days =
        from === to
          ? DAYS[from]
          : `${DAYS[from]} a ${DAYS[to].toLowerCase()}`
      return `${days}, ${text}`
    })
    .join(' · ')
}

export default function OpeningHoursEditor({ hours, exceptions, onChange, onExceptionsChange, onUseText }) {
  const setHours = (next) => onChange(normalize(next))

  function setMode(day, mode) {
    const others = hours.filter((slot) => slot.dayOfWeek !== day)
    if (mode === 'unknown') setHours(others)
    if (mode === 'closed') setHours([...others, { dayOfWeek: day, closed: true }])
    if (mode === 'open') setHours([...others, { dayOfWeek: day, closed: false, ...DEFAULT_SLOT }])
  }

  function updateSlot(target, patch) {
    setHours(hours.map((slot) => (slot === target ? { ...slot, ...patch } : slot)))
  }

  // El turno nuevo empieza una hora después de que cierra el anterior.
  function addSlot(day) {
    const last = hours.filter((slot) => slot.dayOfWeek === day).at(-1)
    const [hour] = hhmm(last?.closesAt || '12:00').split(':').map(Number)
    const opens = Math.min(hour + 1, 22)
    const pad = (value) => `${String(value).padStart(2, '0')}:00`
    setHours([
      ...hours,
      { dayOfWeek: day, closed: false, opensAt: pad(opens), closesAt: pad(Math.min(opens + 4, 23)), sortOrder: 99 },
    ])
  }

  // Copia el horario del lunes al resto de días hábiles.
  function copyMonday() {
    const monday = hours.filter((slot) => slot.dayOfWeek === 1)
    const rest = hours.filter((slot) => slot.dayOfWeek > 5)
    const weekdays = [2, 3, 4, 5].flatMap((day) => monday.map((slot) => ({ ...slot, dayOfWeek: day })))
    setHours([...monday, ...weekdays, ...rest])
  }

  function updateException(index, patch) {
    onExceptionsChange(exceptions.map((item, position) => (position === index ? { ...item, ...patch } : item)))
  }

  const text = hoursToText(hours)

  return (
    <div className="admin-hours">
      <p className="note">
        Con este horario el sitio calcula “Abierto hoy” (hora de Colombia). Un día “sin dato”
        no cuenta ni como abierto ni como cerrado. Si cierra después de medianoche, pon la hora
        de cierre menor que la de apertura.
      </p>

      <div className="admin-hours__week">
        {DAYS.map((label, index) => {
          const day = index + 1
          const slots = hours.filter((slot) => slot.dayOfWeek === day)
          const mode = dayMode(slots)
          return (
            <div key={day} className="admin-hours__day">
              <strong>{label}</strong>
              <select
                aria-label={`Estado del ${label.toLowerCase()}`}
                value={mode}
                onChange={(event) => setMode(day, event.target.value)}
              >
                <option value="open">Abierto</option>
                <option value="closed">Cerrado</option>
                <option value="unknown">Sin dato</option>
              </select>
              <div className="admin-hours__slots">
                {mode === 'open'
                  ? slots.map((slot, position) => (
                      <span key={position} className="admin-hours__slot">
                        <input
                          type="time"
                          aria-label={`${label}: abre`}
                          value={hhmm(slot.opensAt)}
                          onChange={(event) => updateSlot(slot, { opensAt: event.target.value })}
                        />
                        <span aria-hidden="true">a</span>
                        <input
                          type="time"
                          aria-label={`${label}: cierra`}
                          value={hhmm(slot.closesAt)}
                          onChange={(event) => updateSlot(slot, { closesAt: event.target.value })}
                        />
                        {slots.length > 1 ? (
                          <button
                            type="button"
                            aria-label={`Quitar turno del ${label.toLowerCase()}`}
                            onClick={() => setHours(hours.filter((item) => item !== slot))}
                          >
                            ×
                          </button>
                        ) : null}
                      </span>
                    ))
                  : null}
                {mode === 'open' && slots.length < 3 ? (
                  <button type="button" className="admin-hours__add" onClick={() => addSlot(day)}>
                    + Turno
                  </button>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      <div className="admin-hours__tools">
        <button type="button" onClick={copyMonday}>
          Copiar el lunes de martes a viernes
        </button>
        <button type="button" disabled={!text} onClick={() => onUseText(text)}>
          Usar como texto de la ficha
        </button>
      </div>
      {text ? <p className="admin-hours__preview">Vista previa: {text}</p> : null}

      <h3 className="admin-hours__subtitle">Excepciones (festivos y cierres)</h3>
      {exceptions.map((item, index) => (
        <div key={index} className="admin-hours__exception">
          <input
            type="date"
            aria-label="Fecha"
            value={String(item.date ?? '').slice(0, 10)}
            onChange={(event) => updateException(index, { date: event.target.value })}
          />
          <select
            aria-label="Estado ese día"
            value={item.closed ? 'closed' : 'open'}
            onChange={(event) =>
              updateException(
                index,
                event.target.value === 'closed'
                  ? { closed: true }
                  : { closed: false, opensAt: item.opensAt ?? DEFAULT_SLOT.opensAt, closesAt: item.closesAt ?? DEFAULT_SLOT.closesAt },
              )
            }
          >
            <option value="closed">Cerrado</option>
            <option value="open">Horario especial</option>
          </select>
          {item.closed ? null : (
            <span className="admin-hours__slot">
              <input
                type="time"
                aria-label="Abre"
                value={hhmm(item.opensAt)}
                onChange={(event) => updateException(index, { opensAt: event.target.value })}
              />
              <span aria-hidden="true">a</span>
              <input
                type="time"
                aria-label="Cierra"
                value={hhmm(item.closesAt)}
                onChange={(event) => updateException(index, { closesAt: event.target.value })}
              />
            </span>
          )}
          <input
            placeholder="Nota (p. ej. Navidad)"
            value={item.note ?? ''}
            onChange={(event) => updateException(index, { note: event.target.value })}
          />
          <button
            type="button"
            onClick={() => onExceptionsChange(exceptions.filter((_item, position) => position !== index))}
          >
            Quitar
          </button>
        </div>
      ))}
      <button
        type="button"
        className="admin-hours__add"
        onClick={() => onExceptionsChange([...exceptions, { date: '', closed: true, note: '' }])}
      >
        + Excepción
      </button>
    </div>
  )
}
