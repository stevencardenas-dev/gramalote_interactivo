// Horario de apertura de una experiencia.
//
// La interfaz ofrece cuatro modos sencillos, pero todos escriben el mismo valor
// canónico ('always' solo queda en horarios antiguos y se edita como 'days'):
//
//   { mode: 'days' | 'days-close' | 'multi' | 'per-day',
//     days: { '1'..'7': [{ opensAt, closesAt }] } }
//
// Un día que no está en `days` está cerrado. Un día con lista vacía abre, pero
// sin hora fija. Cada lapso es un turno. Así la API y el resto del panel no
// necesitan saber qué modo eligió la persona: solo leen el mapa de días, y cada
// modo se limita a escribir en él (elegir días, un cierre común o turnos).
const DAY_KEYS = ['1', '2', '3', '4', '5', '6', '7']
const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const WEEKDAYS = ['1', '2', '3', '4', '5']
const DEFAULT_RANGE = { opensAt: '08:00', closesAt: '18:00' }
const DEFAULT_CLOSING = '18:00'
const MAX_RANGES = 3

// Del más simple al más detallado: cada modo solo enseña lo que necesita.
const MODES = [
  { key: 'days', label: 'Abre algunos días', hint: 'Elige los días (o «Todos»), sin hora.' },
  { key: 'days-close', label: 'Abre y cierra a una hora', hint: 'Elige los días y a qué hora abre y cierra.' },
  { key: 'multi', label: 'Varios turnos al día', hint: 'Los mismos turnos en los días que elijas.' },
  { key: 'per-day', label: 'Horario por día', hint: 'Cada día con su propio horario.' },
]

const hhmm = (value) => (typeof value === 'string' && /^\d{2}:\d{2}$/.test(value) ? value : '')

function formatTime(value) {
  const [hours, minutes] = hhmm(value).split(':').map(Number)
  if (!Number.isFinite(hours)) return ''
  const suffix = hours < 12 ? 'a. m.' : 'p. m.'
  const twelve = hours % 12 === 0 ? 12 : hours % 12
  return `${twelve}:${String(minutes).padStart(2, '0')} ${suffix}`
}

// Texto para la ficha, agrupando días consecutivos con el mismo horario.
function scheduleToText(schedule) {
  const days = schedule?.days ?? {}
  const rows = DAY_NAMES.map((name, index) => ({ name, index, ranges: days[DAY_KEYS[index]] }))
  const describe = (ranges) => {
    if (ranges.length === 0) return 'sin hora fija'
    if (ranges.every((range) => !hhmm(range.opensAt))) {
      return `cierra a las ${ranges.map((range) => formatTime(range.closesAt)).join(' y ')}`
    }
    return ranges.map((range) => `de ${formatTime(range.opensAt)} a ${formatTime(range.closesAt)}`).join(' y ')
  }

  const groups = []
  for (const row of rows) {
    if (!row.ranges) continue
    const text = describe(row.ranges)
    const last = groups.at(-1)
    if (last && last.text === text && last.to === row.index - 1) last.to = row.index
    else groups.push({ from: row.index, to: row.index, text })
  }

  const parts = groups.map(({ from, to, text }) => {
    const label = from === to ? DAY_NAMES[from] : `${DAY_NAMES[from]} a ${DAY_NAMES[to].toLowerCase()}`
    return `${label}, ${text}`
  })
  const closed = rows.filter((row) => !row.ranges).map((row) => row.name)
  if (closed.length) parts.push(`${closed.join(', ')}, cerrado`)
  return parts.join(' · ')
}

const cloneRanges = (ranges) => ranges.map((range) => ({ ...range }))

function allDaysWith(ranges) {
  return Object.fromEntries(DAY_KEYS.map((day) => [day, cloneRanges(ranges)]))
}

// El turno nuevo arranca una hora después de que cierra el anterior.
function nextRange(ranges) {
  const last = ranges.at(-1)
  const [hour] = hhmm(last?.closesAt).split(':').map(Number)
  if (!Number.isFinite(hour)) return { ...DEFAULT_RANGE }
  const opens = Math.min(hour + 1, 22)
  const pad = (value) => `${String(value).padStart(2, '0')}:00`
  return { opensAt: pad(opens), closesAt: pad(Math.min(opens + 4, 23)) }
}

function RangeInputs({ label, range, onChange, onRemove }) {
  return (
    <span className="admin-schedule__range">
      <input
        type="time"
        aria-label={`${label}: abre`}
        value={hhmm(range.opensAt)}
        onChange={(event) => onChange({ opensAt: event.target.value })}
      />
      <span aria-hidden="true">a</span>
      <input
        type="time"
        aria-label={`${label}: cierra`}
        value={hhmm(range.closesAt)}
        onChange={(event) => onChange({ closesAt: event.target.value })}
      />
      {onRemove ? (
        <button type="button" aria-label={`Quitar turno de ${label}`} onClick={onRemove}>
          ×
        </button>
      ) : null}
    </span>
  )
}

export default function ScheduleEditor({ value, fallbackDaily = false, onChange, onUseText }) {
  // «Abre todos los días» era lo mismo que «Abre algunos días» con los siete
  // marcados: los horarios guardados con ese modo se muestran así.
  const schedule =
    value ?? (fallbackDaily ? { mode: 'days', days: allDaysWith([]) } : { mode: 'days', days: {} })
  const mode = !schedule.mode || schedule.mode === 'always' ? 'days' : schedule.mode
  const days = schedule.days ?? {}
  const selected = DAY_KEYS.filter((day) => day in days)

  // Los modos que comparten un mismo horario entre días guardan el suyo en el
  // primer día elegido y lo reparten al resto: una sola pieza reutilizable.
  const shared = days[selected[0]] ?? []
  const closing = hhmm(shared[0]?.closesAt) || DEFAULT_CLOSING
  const opening = hhmm(shared[0]?.opensAt) || DEFAULT_RANGE.opensAt
  const sharedRange = { opensAt: opening, closesAt: closing }

  const emit = (nextDays, nextMode = mode) => onChange({ mode: nextMode, days: nextDays })

  function applyToSelected(ranges) {
    const nextDays = { ...days }
    selected.forEach((day) => {
      nextDays[day] = cloneRanges(ranges)
    })
    emit(nextDays)
  }

  function toggleDay(day) {
    const nextDays = { ...days }
    if (day in nextDays) {
      delete nextDays[day]
    } else if (mode === 'days-close') {
      nextDays[day] = [{ ...sharedRange }]
    } else if (mode === 'multi') {
      nextDays[day] = cloneRanges(shared.length ? shared : [DEFAULT_RANGE])
    } else {
      nextDays[day] = []
    }
    emit(nextDays)
  }

  function selectDays(list) {
    const nextDays = {}
    for (const day of list) {
      nextDays[day] =
        mode === 'days-close'
          ? [{ ...sharedRange }]
          : mode === 'multi'
            ? cloneRanges(shared.length ? shared : [DEFAULT_RANGE])
            : cloneRanges(days[day] ?? [])
    }
    emit(nextDays)
  }

  // Cambiar de modo no borra lo que ya había: completa lo que falte.
  function setMode(next) {
    const base = selected.length ? selected : WEEKDAYS
    const nextDays = {}
    for (const day of base) {
      const current = days[day] ?? []
      if (next === 'days-close') nextDays[day] = [{ ...sharedRange }]
      else if (next === 'multi') nextDays[day] = cloneRanges(shared.length ? shared : [DEFAULT_RANGE])
      else if (next === 'per-day') nextDays[day] = cloneRanges(current.filter((range) => hhmm(range.closesAt)))
      else nextDays[day] = []
    }
    emit(nextDays, next)
  }

  function updateRange(day, index, patch) {
    const ranges = (days[day] ?? []).map((range, position) =>
      position === index ? { ...range, ...patch } : range,
    )
    emit({ ...days, [day]: ranges })
  }

  function addRange(day) {
    const ranges = days[day] ?? []
    if (ranges.length >= MAX_RANGES) return
    emit({ ...days, [day]: [...ranges, nextRange(ranges)] })
  }

  function removeRange(day, index) {
    emit({ ...days, [day]: (days[day] ?? []).filter((_range, position) => position !== index) })
  }

  const text = scheduleToText({ mode, days })
  const hiddenDays = DAY_KEYS.filter((day) => !(day in days))

  return (
    <div className="admin-schedule">
      <p className="note">
        Con este horario el sitio decide si la ficha aparece en «Abierto hoy» y puedes escribir el
        texto de la ficha de un clic. Los días marcados sin horas cuentan como abiertos.
      </p>

      <div className="admin-schedule__modes" role="radiogroup" aria-label="Cómo abre">
        {MODES.map((item) => (
          <label
            key={item.key}
            className={`admin-schedule__mode${mode === item.key ? ' is-active' : ''}`}
          >
            <input
              type="radio"
              name="schedule-mode"
              checked={mode === item.key}
              onChange={() => setMode(item.key)}
            />
            <span>
              <strong>{item.label}</strong>
              <small>{item.hint}</small>
            </span>
          </label>
        ))}
      </div>

      <div className="admin-schedule__days" role="group" aria-label="Días que abre">
        {DAY_KEYS.map((day, index) => (
          <button
            key={day}
            type="button"
            className={`admin-schedule__day${day in days ? ' is-on' : ''}`}
            aria-pressed={day in days}
            aria-label={DAY_NAMES[index]}
            title={DAY_NAMES[index]}
            onClick={() => toggleDay(day)}
          >
            {DAY_LETTERS[index]}
          </button>
        ))}
        <button type="button" className="admin-schedule__quick" onClick={() => selectDays(WEEKDAYS)}>
          Lunes a viernes
        </button>
        <button type="button" className="admin-schedule__quick" onClick={() => selectDays(DAY_KEYS)}>
          Todos
        </button>
      </div>

      {!selected.length ? (
        <p className="admin-schedule__empty">Elige al menos un día para continuar.</p>
      ) : null}

      {mode === 'days-close' && selected.length ? (
        <div className="admin-schedule__shared">
          <RangeInputs
            label="Horario"
            range={sharedRange}
            onChange={(patch) => applyToSelected([{ ...sharedRange, ...patch }])}
          />
          <p className="note">Se aplica a los días elegidos.</p>
        </div>
      ) : null}

      {mode === 'multi' && selected.length ? (
        <div className="admin-schedule__shared">
          <div className="admin-schedule__ranges">
            {(shared.length ? shared : []).map((range, index) => (
              <RangeInputs
                key={index}
                label={`Turno ${index + 1}`}
                range={range}
                onChange={(patch) =>
                  applyToSelected(
                    shared.map((item, position) =>
                      position === index ? { ...item, ...patch } : item,
                    ),
                  )
                }
                onRemove={
                  shared.length > 1
                    ? () => applyToSelected(shared.filter((_item, position) => position !== index))
                    : undefined
                }
              />
            ))}
            {shared.length < MAX_RANGES ? (
              <button
                type="button"
                className="admin-schedule__add"
                onClick={() => applyToSelected([...shared, nextRange(shared)])}
              >
                + Turno
              </button>
            ) : null}
          </div>
          <p className="note">Los mismos turnos en todos los días elegidos.</p>
        </div>
      ) : null}

      {mode === 'per-day' && selected.length ? (
        <div className="admin-schedule__perday">
          {selected.map((day) => {
            const index = DAY_KEYS.indexOf(day)
            const ranges = days[day] ?? []
            return (
              <div key={day} className="admin-schedule__perday-row">
                <strong>{DAY_NAMES[index]}</strong>
                <div className="admin-schedule__ranges">
                  {ranges.length ? (
                    ranges.map((range, position) => (
                      <RangeInputs
                        key={position}
                        label={DAY_NAMES[index]}
                        range={range}
                        onChange={(patch) => updateRange(day, position, patch)}
                        onRemove={
                          ranges.length > 1 ? () => removeRange(day, position) : undefined
                        }
                      />
                    ))
                  ) : (
                    <span className="admin-schedule__empty">Sin hora fija</span>
                  )}
                  {ranges.length < MAX_RANGES ? (
                    <button type="button" className="admin-schedule__add" onClick={() => addRange(day)}>
                      + Turno
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      <div className="admin-hours__tools">
        <button type="button" disabled={!text} onClick={() => onUseText?.(text)}>
          Usar como texto de la ficha
        </button>
        {hiddenDays.length ? (
          <button
            type="button"
            onClick={() => {
              const nextDays = { ...days }
              hiddenDays.forEach((day) => {
                nextDays[day] = []
              })
              emit(nextDays)
            }}
          >
            Abrir también los días cerrados
          </button>
        ) : null}
      </div>
      {text ? <p className="admin-hours__preview">Vista previa: {text}</p> : null}
      <p className="note">
        Si cierra después de medianoche, pon la hora de cierre menor que la de apertura.
      </p>
    </div>
  )
}
