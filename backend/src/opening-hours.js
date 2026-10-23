const TIME_ZONE = 'America/Bogota'

const WEEKDAY = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
}

const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function localNow(date = new Date()) {
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  )
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    dayOfWeek: WEEKDAY[parts.weekday] ?? null,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  }
}

function toMinutes(value) {
  if (!value) return null
  const [hours, minutes] = String(value).split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

function isWithin(minutes, opensAt, closesAt) {
  const opens = toMinutes(opensAt)
  const closes = toMinutes(closesAt)
  if (opens === null || closes === null) return false
  if (opens === closes) return true
  if (opens < closes) return minutes >= opens && minutes < closes
  return minutes >= opens || minutes < closes
}

function matchesSlot(slot, minutes) {
  if (slot.is_closed) return false
  return isWithin(minutes, slot.opens_at, slot.closes_at)
}

export function calculateOpenNow(hours, exceptions, date = new Date()) {
  if (!Array.isArray(hours) || hours.length === 0) return null

  const now = localNow(date)
  const exception = (exceptions ?? []).find(
    (item) => item.exception_date === now.date,
  )

  if (exception) {
    return Boolean(matchesSlot(exception, now.minutes))
  }

  const today = hours.filter((item) => item.day_of_week === now.dayOfWeek)
  if (today.length === 0) return null

  return today.some((slot) => matchesSlot(slot, now.minutes))
}

export { TIME_ZONE }
