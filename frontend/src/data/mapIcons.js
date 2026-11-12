// Iconos ilustrados del mapa (entrega "ICONOS Final Version", 10 de noviembre).
// Una sola versión por icono: /img/mapa/iconos/<icono>.svg.
// Debe coincidir con backend/src/map-icons.js.
export const MAP_ICON_DIR = '/img/mapa/iconos'

// `group` ordena el selector del panel.
export const MAP_ICONS = [
  { key: 'restaurante', label: 'Restaurante', group: 'Comer' },
  { key: 'comidas-caseras', label: 'Comidas caseras', group: 'Comer' },
  { key: 'comidas-ejecutivas', label: 'Comidas ejecutivas', group: 'Comer' },
  { key: 'comidas-rapidas', label: 'Comidas rápidas', group: 'Comer' },
  { key: 'cafeteria', label: 'Cafetería', group: 'Comer' },
  { key: 'heladeria', label: 'Heladería', group: 'Comer' },
  { key: 'postres', label: 'Postres', group: 'Comer' },
  { key: 'plaza-de-mercado', label: 'Plaza de mercado', group: 'Comer' },
  { key: 'hotel', label: 'Hotel', group: 'Dormir' },
  { key: 'hostal', label: 'Hostal', group: 'Dormir' },
  { key: 'cabana', label: 'Cabaña', group: 'Dormir' },
  { key: 'glamping', label: 'Glamping', group: 'Dormir' },
  { key: 'artesanias', label: 'Artesanías', group: 'Comprar' },
  { key: 'experiencias', label: 'Experiencias', group: 'Lugares y experiencias' },
  { key: 'parque-principal', label: 'Parque principal', group: 'Lugares y experiencias' },
  { key: 'parque', label: 'Parque', group: 'Lugares y experiencias' },
  { key: 'cascada', label: 'Cascadas', group: 'Lugares y experiencias' },
  { key: 'puentes', label: 'Puentes', group: 'Lugares y experiencias' },
  { key: 'ruinas', label: 'Ruinas', group: 'Lugares y experiencias' },
  { key: 'pueblo-nuevo', label: 'Pueblo Nuevo', group: 'Lugares y experiencias' },
  { key: 'pueblo-viejo', label: 'Pueblo Viejo', group: 'Lugares y experiencias' },
  { key: 'monumento', label: 'Monumentos', group: 'Lugares y experiencias' },
  { key: 'templo', label: 'Templo', group: 'Lugares y experiencias' },
  { key: 'capilla', label: 'Capillas', group: 'Lugares y experiencias' },
  { key: 'cementerio', label: 'Cementerio', group: 'Lugares y experiencias' },
  { key: 'casa-cultural', label: 'Casa cultural', group: 'Servicios y comunidad' },
  { key: 'alcaldia', label: 'Alcaldía', group: 'Servicios y comunidad' },
  { key: 'banco', label: 'Banco', group: 'Servicios y comunidad' },
  { key: 'policia', label: 'Policía', group: 'Servicios y comunidad' },
  { key: 'hospital', label: 'Hospital', group: 'Servicios y comunidad' },
  { key: 'colegio', label: 'Colegios', group: 'Servicios y comunidad' },
  { key: 'casa-de-abuelos', label: 'Casa de abuelos', group: 'Servicios y comunidad' },
  { key: 'polideportivo', label: 'Polideportivo', group: 'Servicios y comunidad' },
  { key: 'cancha', label: 'Cancha', group: 'Servicios y comunidad' },
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
  ['mercado', 'plaza-de-mercado'],
  ['casera', 'comidas-caseras'],
  ['tipica', 'comidas-caseras'],
  ['glamping', 'glamping'],
  ['caban', 'cabana'],
  ['hostal', 'hostal'],
  ['hotel', 'hotel'],
]
const BY_GROUP = { comer: 'restaurante', dormir: 'hotel', comprar: 'artesanias', experiencia: 'experiencias' }
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

export const mapIconUrl = (icon) => `${MAP_ICON_DIR}/${icon}.svg`
