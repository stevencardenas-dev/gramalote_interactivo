// Textos fijos de cada categoría (encabezados y relacionados). Las fichas, sus
// fotos y sus datos vienen de la API (lib/contentApi.js).
export const categories = {
  comer: {
    label: 'Dónde comer',
    eyebrow: 'Gastronomía local',
    to: '/donde-comer',
    intro:
      'Descubre dónde comer en Gramalote. Consulta restaurantes, cafeterías y otros establecimientos gastronómicos para planear tu visita.',
    filterLabel: 'Tipo',
    filterAll: 'Todos los tipos',
    filters: ['Restaurantes', 'Cafeterías', 'Comida típica', 'Postres'],
    mapTitle: 'Mapa de establecimientos gastronómicos',
    mapCta: 'Ver restaurantes en el mapa',
    relationTitle: 'También puedes disfrutar en Gramalote',
    relationText:
      'Explora otras opciones gastronómicas del municipio y descubre lugares donde disfrutar de sabores locales y diferentes propuestas para compartir.',
  },
  dormir: {
    label: 'Dónde dormir',
    eyebrow: 'Alojamientos en Gramalote',
    to: '/donde-dormir',
    intro:
      'Encuentra alojamientos en Gramalote, conoce sus servicios y consulta la información necesaria para planear tu estadía.',
    filterLabel: 'Tipo de alojamiento',
    filterAll: 'Todos los tipos',
    filters: ['Glamping', 'Hostal', 'Hotel', 'Cabañas'],
    serviceLabel: 'Servicios',
    serviceAll: 'Todos los servicios',
    services: ['Desayuno', 'Parqueadero', 'Piscina', 'Wi-Fi'],
    mapTitle: 'Mapa de alojamientos en Gramalote',
    mapCta: 'Ver alojamientos en el mapa',
    relationTitle: 'Lugares relacionados',
    relationText:
      'También puedes conocer otras opciones de alojamiento en Gramalote y elegir la que mejor se adapte a tu visita.',
  },
  comprar: {
    label: 'Dónde comprar',
    eyebrow: 'Artesanías y productos locales',
    to: '/donde-comprar',
    intro:
      'Descubre las artesanías y creaciones locales de Gramalote. Encuentra productos hechos a mano, conoce a sus creadores y consulta cómo contactarlos.',
    filterLabel: 'Tipo de producto',
    filterAll: 'Todos los productos',
    filters: ['Artesanía', 'Otro'],
    priceLabel: 'Precio',
    priceAll: 'Todos los precios',
    prices: ['Hasta $50.000', '$50.000 - $150.000', 'Más de $150.000'],
    mapTitle: 'Mapa de artesanos y establecimientos',
    mapCta: 'Ver artesanos en el mapa',
    relationTitle: 'Más artesanías de Gramalote',
    relationText:
      'Descubre otras creaciones locales y encuentra piezas únicas hechas por artesanos del municipio.',
  },
}
