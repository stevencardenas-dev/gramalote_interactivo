// Campo de latitud o longitud del panel: se escribe y se ve con coma decimal
// (7,9174), que es como escribe la gente aquí. Hacia el formulario sale con punto
// (7.9174), que es lo que entiende la API; si alguien teclea el punto, se muestra
// como coma. `onChange` recibe el texto normalizado ('' si está vacío).
//
// Al pegar se leen los números del texto: con uno solo se rellena este campo y con
// dos (como los copia Google Maps: «7.8923, -72.7879») se rellenan latitud y
// longitud a la vez si la pantalla pasa `onPair(lat, lng)`.
//
// kind: 'lat' | 'lng' (cambia solo el ejemplo del campo).
const EXAMPLES = { lat: '7,9174', lng: '-72,7879' }
// Rango de Norte de Santander (el mismo que valida el servidor, backend/src/coordinates.js).
const BOUNDS = { lat: { min: 6.9, max: 9.3 }, lng: { min: -73.7, max: -72.0 } }
const comma = (number) => String(number).replace('.', ',')
const NUMBER = /-?\d+(?:[.,]\d+)?/g

function toValue(token) {
  return token.replace(',', '.')
}

export default function CoordinateInput({ value, onChange, onPair, kind = 'lat', ...rest }) {
  const shown = value === null || value === undefined ? '' : String(value).replace('.', ',')

  function handleChange(event) {
    const typed = event.target.value.replace(/\./g, ',')
    // Solo cifras, un signo menos al inicio y una coma.
    if (typed !== '' && !/^-?\d*,?\d*$/.test(typed)) return
    onChange(toValue(typed))
  }

  function handlePaste(event) {
    const numbers = (event.clipboardData?.getData('text') ?? '').match(NUMBER)
    if (!numbers || numbers.length === 0) return
    event.preventDefault()
    if (numbers.length >= 2 && onPair) onPair(toValue(numbers[0]), toValue(numbers[1]))
    else onChange(toValue(numbers[kind === 'lng' && numbers.length >= 2 ? 1 : 0]))
  }

  const number = Number(value)
  const { min, max } = BOUNDS[kind]
  const outside = shown !== '' && Number.isFinite(number) && (number < min || number > max)

  return (
    <>
      <input
        {...rest}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={shown}
        onChange={handleChange}
        onPaste={handlePaste}
        aria-invalid={outside || undefined}
        placeholder={`Ej. ${EXAMPLES[kind]}`}
        title="Escribe los decimales con coma, por ejemplo 7,9174. También puedes pegar «lat, lng» de Google Maps."
      />
      {outside ? (
        <small className="admin-hint admin-hint--error" role="alert">
          Debe estar entre {comma(min)} y {comma(max)} (Norte de Santander). ¿Están cambiadas la latitud y la longitud?
        </small>
      ) : null}
    </>
  )
}
