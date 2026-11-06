// Iconos ilustrados del mapa (entrega "Iconos mapa", 1 de noviembre). Cada uno
// tiene dos versiones: -1 (fondo oscuro) y -2 (fondo claro).
// Debe coincidir con backend/src/map-icons.js.
export const MAP_ICON_DIR = '/img/mapa/iconos'

export const MAP_ICONS = [
  { key: 'restaurante', label: 'Restaurante' },
  { key: 'comidas-caseras', label: 'Comidas caseras' },
  { key: 'comidas-ejecutivas', label: 'Comidas ejecutivas' },
  { key: 'comidas-rapidas', label: 'Comidas rápidas' },
  { key: 'cafeteria', label: 'Cafetería' },
  { key: 'heladeria', label: 'Heladería' },
  { key: 'postres', label: 'Postres' },
  { key: 'hotel', label: 'Hotel' },
  { key: 'hostal', label: 'Hostal' },
  { key: 'cabana', label: 'Cabaña' },
  { key: 'glamping', label: 'Glamping' },
  { key: 'artesanias', label: 'Artesanías' },
  { key: 'banco', label: 'Banco' },
  { key: 'hospital', label: 'Hospital' },
  { key: 'colegio', label: 'Colegio' },
  { key: 'capilla', label: 'Capilla' },
  { key: 'templo', label: 'Templo' },
  { key: 'monumento', label: 'Monumento' },
  { key: 'parque-principal', label: 'Parque principal' },
  { key: 'parque', label: 'Parque' },
  { key: 'cascada', label: 'Cascada' },
  { key: 'puentes', label: 'Puentes' },
  { key: 'ruinas', label: 'Ruinas' },
  { key: 'pueblo-nuevo', label: 'Pueblo Nuevo' },
  { key: 'pueblo-viejo', label: 'Pueblo Viejo' },
]

const KEYS = new Set(MAP_ICONS.map((icon) => icon.key))

// Palabras del tipo (sin tildes) -> icono, para fichas sin icono elegido.
// Gana la primera que aparezca.
const BY_TYPE = [
  ['cafeter', 'cafeteria'],
  ['helad', 'heladeria'],
  ['postre', 'postres'],
  ['rapida', 'comidas-rapidas'],
  ['ejecutiv', 'comidas-ejecutivas'],
  ['casera', 'comidas-caseras'],
  ['tipica', 'comidas-caseras'],
  ['glamping', 'glamping'],
  ['caban', 'cabana'],
  ['hostal', 'hostal'],
  ['hotel', 'hotel'],
]
const BY_GROUP = { comer: 'restaurante', dormir: 'hotel', comprar: 'artesanias' }
// Las experiencias no tienen tipo ni icono en la base: se eligen por su ficha.
const BY_SLUG = {
  'cascadas-arco-iris': 'cascada',
  'cafe-marquetalia': 'parque',
  'pueblo-viejo': 'pueblo-viejo',
  'ruinas-antiguo-gramalote': 'ruinas',
  'nuevo-gramalote': 'pueblo-nuevo',
}

const plain = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

// Icono de un lugar: el elegido en el panel o, si no hay, el que sugiere su tipo.
export function resolveMapIcon({ mapIcon, slug, type, group }) {
  if (KEYS.has(mapIcon)) return mapIcon
  if (BY_SLUG[slug]) return BY_SLUG[slug]
  const words = plain(type)
  const match = BY_TYPE.find(([word]) => words.includes(word))
  return match ? match[1] : BY_GROUP[group] ?? 'parque-principal'
}

export const mapIconUrl = (icon, version = 1) => `${MAP_ICON_DIR}/${icon}-${version}.svg`
