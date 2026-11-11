const DESTINATION = 'Gramalote, Norte de Santander, Colombia'
const directions = (origin) =>
  `https://www.google.com/maps/dir/?api=1${
    origin ? `&origin=${encodeURIComponent(origin)}` : ''
  }&destination=${encodeURIComponent(DESTINATION)}`

export const accessRoutes = [
  {
    title: 'Desde Cúcuta',
    text: 'Consulta el recorrido hasta Gramalote.',
    photo: '/img/info/cucuta.jpg',
    alt: 'Vista aérea de Cúcuta',
    href: directions('Cúcuta, Norte de Santander'),
  },
  {
    title: 'Desde Pamplona',
    text: 'Consulta el recorrido hasta Gramalote.',
    photo: '/img/info/pamplona.jpg',
    alt: 'Pamplona entre montañas',
    href: directions('Pamplona, Norte de Santander'),
  },
  {
    title: 'Otros municipios',
    text: 'Consulta cómo llegar desde tu ubicación.',
    photo: '/img/info/otros-municipios.jpg',
    alt: 'Municipio en el valle entre montañas',
    // Sin origen, Google Maps usa la ubicación de quien consulta.
    href: directions(),
  },
]

export const transportOptions = [
  {
    title: 'Vehículo particular',
    text: 'Consulta el recorrido por carretera y revisa las condiciones de las vías.',
    icon: 'carro',
  },
  {
    title: 'Transporte público',
    text: 'Verifica las alternativas disponibles y sus horarios antes de viajar.',
    icon: 'bus',
  },
]

export const safetyTips = [
  {
    title: 'Sigue las indicaciones locales',
    text: 'Respeta las normas y recomendaciones de las autoridades.',
    icon: 'ubicacion',
  },
  {
    title: 'Precaución en senderos',
    text: 'Consulta las condiciones del camino antes de realizar caminatas.',
    icon: 'huellas',
  },
  {
    title: 'Zonas y acompañamiento',
    text: 'Verifica si el lugar tiene restricciones o requiere guía.',
    icon: 'usuario',
  },
  {
    title: 'Consulta el clima',
    text: 'Revisa las condiciones meteorológicas antes de salir.',
    icon: 'clima',
  },
  {
    title: 'Cuida el entorno',
    text: 'Respeta la naturaleza y las indicaciones de cada lugar.',
    icon: 'naturaleza',
  },
]

export const preparationTips = [
  {
    title: 'Horarios',
    text: 'Confirma los horarios de los lugares que deseas visitar.',
    photo: '/img/info/horarios.jpg',
    alt: 'Fachada de un local con mesas al aire libre',
  },
  {
    title: 'Clima',
    text: 'Consulta el pronóstico y considera las condiciones de las vías.',
    photo: '/img/info/clima.jpg',
    alt: 'Montañas bajo un cielo despejado',
  },
  {
    title: 'Qué llevar',
    text: 'Prepara agua, ropa cómoda y lo necesario según tu actividad.',
    photo: '/img/info/que-llevar.jpg',
    alt: 'Caminantes con morral y bastones',
  },
  {
    title: 'Conectividad',
    text: 'Guarda la información importante por si tienes poca señal.',
    photo: '/img/info/conectividad.jpg',
    alt: 'Manos sosteniendo un celular',
  },
]

export const usefulContacts = [
  {
    kind: 'Información institucional',
    title: 'Alcaldía de Gramalote',
    text: 'Información y orientación sobre servicios y actividades del municipio.',
    phone: '3204204077',
    logo: '/img/info/logo-alcaldia.png',
  },
  {
    kind: 'Seguridad ciudadana',
    title: 'Policía Nacional',
    text: 'Apoyo y orientación en situaciones relacionadas con la seguridad ciudadana.',
    phone: '3133795756',
    logo: '/img/info/logo-policia.png',
  },
  {
    kind: 'Prevención y emergencias',
    title: 'Defensa Civil',
    text: 'Apoyo en la prevención y atención de emergencias.',
    phone: '3112585373',
    logo: '/img/info/logo-defensa-civil.png',
  },
  {
    kind: 'Atención médica y urgencias',
    title: 'Hospital San Vicente de Paúl',
    text: 'Atención médica y orientación sobre servicios de salud y urgencias.',
    phone: '3112585373',
    logo: '/img/info/logo-hospital.png',
  },
]
