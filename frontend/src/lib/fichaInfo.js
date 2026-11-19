import { contactLines } from './contact.js'

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
// horario y, en alojamientos, la entrada y la salida; los métodos de pago y
// el rango de precios van por separado.
export function fichaInfoItems(item) {
  const location = { icon: 'ubicacion', label: 'Ubicación', value: clean(item.address) }
  const contact = { icon: 'telefono', label: 'Contacto', value: contactLines(item) }
  // Siempre cuatro datos. Con el horario como cuadro por días, este va en su
  // propio panel (FichaHorario) y los pagos se separan en dos.
  if (item.hoursDisplay === 'table') {
    return [
      location,
      { icon: 'billetera', label: 'Métodos de pago', value: clean(item.payment) },
      { icon: 'bolso', label: 'Precios', value: clean(item.priceRange) },
      contact,
    ]
  }
  return [
    { icon: 'horario', label: 'Horario', value: lines(item.hours, item.checkin) },
    location,
    { icon: 'billetera', label: 'Pagos', value: lines(item.payment, item.priceRange) },
    contact,
  ]
}
