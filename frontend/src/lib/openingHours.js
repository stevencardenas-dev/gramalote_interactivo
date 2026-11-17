// Horario por día: un solo formato para el panel y para las fichas públicas.
// Así el resumen que se genera en el panel y el que se ve en el sitio no
// pueden decir cosas distintas.

export const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

// Valor de un <input type="time"> (HH:MM) a partir de lo que guarda la API.
export const hhmm = (value) => (value ? String(value).slice(0, 5) : '')

export function dayMode(slots) {
  const list = slots ?? []
  if (list.length === 0) return 'unknown'
  return list.every((slot) => slot.closed) ? 'closed' : 'open'
}

export function formatTime(value) {
  const [hours, minutes] = hhmm(value).split(':').map(Number)
  if (!Number.isFinite(hours)) return ''
  // Espacio duro dentro de «a. m.» / «p. m.»: la hora no se parte en la tarjeta.
  const suffix = hours < 12 ? 'a. m.' : 'p. m.'
  const twelve = hours % 12 === 0 ? 12 : hours % 12
  return `${twelve}:${String(minutes).padStart(2, '0')} ${suffix}`
}

// Turnos abiertos de un día: "8:00 a. m. – 12:00 m. · 2:00 p. m. – 6:00 p. m."
function slotsText(slots) {
  return slots
    .filter((slot) => !slot.closed)
    .map((slot) => [formatTime(slot.opensAt), formatTime(slot.closesAt)])
    .filter(([opens, closes]) => opens && closes)
    .map(([opens, closes]) => `${opens} – ${closes}`)
    .join(' · ')
}

// Lo que se lee en la tarjeta del día; null cuando no hay datos.
export function dayText(slots) {
  const mode = dayMode(slots)
  if (mode === 'closed') return 'Cerrado'
  if (mode === 'unknown') return null
  return slotsText(slots) || null
}

// Resumen de una línea para la franja de datos:
// "Lunes a viernes, de 8:00 a. m. a 6:00 p. m. · Domingo, cerrado"
export function hoursToText(hours) {
  const byDay = DAYS.map((_label, index) =>
    (hours ?? []).filter((slot) => slot.dayOfWeek === index + 1),
  )
  const describe = (slots) => {
    const mode = dayMode(slots)
    if (mode === 'unknown') return null
    if (mode === 'closed') return 'cerrado'
    return slots
      .filter((slot) => !slot.closed && hhmm(slot.opensAt) && hhmm(slot.closesAt))
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

  const parts = groups.map(({ from, to, text }) => {
    const days = from === to ? DAYS[from] : `${DAYS[from]} a ${DAYS[to].toLowerCase()}`
    return `${days}, ${text}`
  })
  const unknown = byDay
    .map((slots, index) => (dayMode(slots) === 'unknown' ? DAYS[index] : null))
    .filter(Boolean)
  if (unknown.length && parts.length) parts.push(`${unknown.join(', ')}, sin dato`)
  return parts.join(' · ')
}

// Una fila por día, lista para pintar la semana en la ficha.
export function weekRows(hours) {
  return DAYS.map((label, index) => {
    const day = index + 1
    const slots = (hours ?? []).filter((slot) => slot.dayOfWeek === day)
    return { day, label, mode: dayMode(slots), text: dayText(slots) }
  })
}

// 1 = lunes … 7 = domingo (la API numera los días igual).
export function todayIndex(date = new Date()) {
  return ((date.getDay() + 6) % 7) + 1
}

export function formatDate(value) {
  const [year, month, day] = String(value ?? '').split('-').map(Number)
  if (!year || !month || !day) return String(value ?? '')
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(
    new Date(year, month - 1, day),
  )
}

function dateOf(value) {
  const [year, month, day] = String(value ?? '').split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

// Excepciones que todavía no pasan (festivos, cierres puntuales).
export function upcomingExceptions(exceptions, limit = 3) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return (exceptions ?? [])
    .map((item) => ({ item, date: dateOf(item.date) }))
    .filter((row) => row.date && row.date >= start)
    .sort((a, b) => a.date - b.date)
    .slice(0, limit)
    .map((row) => row.item)
}

// "22 nov: cerrado (Feria)" / "24 dic: 8:00 a. m. – 12:00 m."
export function exceptionText(item) {
  const when = formatDate(item.date)
  const note = item.note ? ` (${item.note})` : ''
  if (item.closed) return `${when}: cerrado${note}`
  const range = [formatTime(item.opensAt), formatTime(item.closesAt)].filter(Boolean).join(' – ')
  return `${when}: ${range || 'horario especial'}${note}`
}
