import { exceptionText, todayIndex, upcomingExceptions, weekRows } from '../../lib/openingHours.js'

// Detalle del horario por día en la ficha: la semana completa, con el día de
// hoy destacado, el estado de ahora mismo y las próximas excepciones. Solo se
// pinta cuando la ficha tiene horario por día o entrada/salida que mostrar.
export default function FichaHorario({ item }) {
  const rows = weekRows(item.openingHours)
  const exceptions = upcomingExceptions(item.openingHoursExceptions)
  const checkin = item.checkin?.trim()
  const hasWeek = rows.some((row) => row.mode !== 'unknown')
  if (!hasWeek && !checkin && exceptions.length === 0) return null

  const today = todayIndex()
  const status =
    item.openNow === null
      ? null
      : item.openNow
        ? { key: 'open', label: 'Abierto ahora' }
        : { key: 'closed', label: 'Cerrado ahora' }

  return (
    <div className="ficha-hours">
      <div className="container">
        <div className="ficha-hours__card">
          <div className="ficha-hours__head">
            <h2 id="ficha-horario">Horario</h2>
            {status ? (
              <span className={`ficha-hours__status is-${status.key}`}>{status.label}</span>
            ) : null}
          </div>

          {hasWeek ? (
            <ul className="ficha-hours__week" aria-labelledby="ficha-horario">
              {rows.map((row) => (
                <li
                  key={row.day}
                  className={`ficha-hours__day${row.day === today ? ' is-today' : ''}`}
                  data-mode={row.mode}
                >
                  <span className="ficha-hours__day-name">
                    {row.label}
                    {row.day === today ? <em>Hoy</em> : null}
                  </span>
                  <span className="ficha-hours__day-value">
                    {row.text ?? 'Sin dato'}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          {exceptions.length > 0 ? (
            <ul className="ficha-hours__notes">
              {exceptions.map((exception) => (
                <li key={exception.date}>{exceptionText(exception)}</li>
              ))}
            </ul>
          ) : null}

          {checkin ? (
            <p className="ficha-hours__extra">
              <strong>Entrada y salida:</strong> {checkin}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
