import { contactLines } from './contact.js'
import { hoursToText, weekRows } from './openingHours.js'

// Texto limpio o null, para no dejar líneas vacías en la barra.
function clean(value) {
  const text = value === null || value === undefined ? '' : String(value).trim()
  return text === '' ? null : text
}

function lines(...values) {
  const list = values.map(clean).filter(Boolean)
  if (list.length === 0) return null
  return list.length === 1 ? list[0] : list
}

// Barra de datos común a las fichas de establecimiento (Dónde comer, Dónde
// dormir y Dónde comprar): mismas etiquetas en todas. «Horario» reúne el
// horario y, en alojamientos, la entrada y la salida; «Pagos» reúne los
// métodos de pago y el rango de precios.
export function fichaInfoItems(item) {
  // Con horario por día, el panel «Horario» (FichaHorario) ya lo muestra
  // completo; repetirlo aquí como resumen sobra y puede contradecirlo.
  const hasWeek = weekRows(item.openingHours).some((row) => row.mode !== 'unknown')
  return [
    hasWeek
      ? null
      : { icon: 'horario', label: 'Horario', value: lines(item.hours || hoursToText(item.openingHours), item.checkin) },
    { icon: 'ubicacion', label: 'Ubicación', value: clean(item.address) },
    { icon: 'billetera', label: 'Pagos', value: lines(item.payment, item.priceRange) },
    { icon: 'telefono', label: 'Contacto', value: contactLines(item) },
  ].filter(Boolean)
}
