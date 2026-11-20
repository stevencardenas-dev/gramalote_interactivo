import { ApiError } from './http.js'

// Rango de Norte de Santander. Es el mismo para todo el panel: un punto fuera de
// aquí casi siempre es un error de tecleo (latitud y longitud cambiadas, o falta
// el signo menos), y en el mapa quedaría muy lejos de Gramalote.
//
// OJO: hay una copia de este rango en el frontend, en
// frontend/src/components/admin/CoordinateInput.jsx (BOUNDS), que solo avisa en
// pantalla. Si cambia aquí, hay que cambiarlo allí también. El servidor es el que manda.
export const NORTE_DE_SANTANDER = {
  lat: { min: 6.9, max: 9.3 },
  lng: { min: -73.7, max: -72.0 },
}

const comma = (number) => String(number).replace('.', ',')

// kind: 'lat' | 'lng'. Acepta la coma decimal (7,9) además del punto.
export function parseCoordinate(value, kind, label) {
  const parsed = Number(typeof value === 'string' ? value.trim().replace(',', '.') : value)
  if (value === null || value === undefined || value === '' || !Number.isFinite(parsed)) {
    throw new ApiError(400, 'VALIDATION', `${label} no es una coordenada válida (un solo número, p. ej. 7,9 o -73,3)`)
  }
  const { min, max } = NORTE_DE_SANTANDER[kind]
  if (parsed < min || parsed > max) {
    throw new ApiError(
      400,
      'VALIDATION',
      `${label} debe estar entre ${comma(min)} y ${comma(max)} (Norte de Santander). Revisa que no estén cambiadas la latitud y la longitud.`,
    )
  }
  return parsed
}
