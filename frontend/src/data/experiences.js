// Tarjetas de "Experiencias que no olvidarás" en Inicio.
export const experiences = [
  {
    id: 'cascadas-escondidas',
    slug: 'cascadas-arco-iris',
    title: 'Cascadas escondidas entre la niebla',
    category: 'Naturaleza',
    description:
      'El sonido del agua te guía por el sendero. Al final, la recompensa es fría y transparente.',
    photo: '/img/home/exp-1.jpg',
    to: '/que-hacer/cascadas-arco-iris',
  },
  {
    id: 'sabores-de-gramalote',
    slug: 'sabores-de-gramalote',
    title: 'Sabores de Gramalote',
    category: 'Gastronomía',
    description:
      'Descubre la gastronomía local y los sabores tradicionales del municipio.',
    photo: '/img/home/exp-2b.jpg',
    to: '/donde-comer',
  },
  {
    id: 'artesanias-con-identidad-local',
    slug: 'artesanias-con-identidad-local',
    title: 'Artesanías con identidad local',
    category: 'Cultura',
    description:
      'Conoce los productos y las creaciones de los artesanos de Gramalote.',
    photo: '/img/home/exp-3b.jpg',
    to: '/donde-comprar',
  },
]

const RECOMMENDATIONS =
  'Lleva ropa cómoda, zapatos cerrados, agua, gorra y protector solar.'

// Experiencias de "Qué hacer" (frame QUE HACER, 1 de noviembre) y sus fichas.
// `openDaily`: abre todos los días; es lo que usa el filtro "Abierto hoy".
// Solo Cascadas Arco Iris tiene ficha completa en el diseño; las demás
// muestran lo que dice su tarjeta.
export const activities = [
  {
    slug: 'pueblo-viejo',
    title: 'Pueblo Viejo',
    category: 'Patrimonio',
    text: 'Caminar por el camino veredal, cruzar el puente de Pueblo Viejo, hoy puente del Divino Niño, y conocer los vestigios de la primera cabecera municipal, a orillas de la quebrada Calderera.',
    meta: '30 min en vehículo · Dificultad media baja',
    photo: '/img/que-hacer/pueblo-viejo.jpg',
    openDaily: true,
    info: { location: 'Pueblo Viejo, a orillas de la quebrada Calderera' },
    tips: [
      { icon: 'huellas', title: 'Cómo llegar', text: '30 minutos en vehículo.' },
      { icon: 'camino', title: 'Dificultad', text: 'Media baja.' },
      { icon: 'bolso', title: 'Recomendaciones', text: RECOMMENDATIONS },
    ],
  },
  {
    slug: 'ruinas-antiguo-gramalote',
    title: 'Las ruinas del antiguo Gramalote',
    category: 'Patrimonio',
    text: 'Recorrer en unas 2 horas lo que queda de la segunda cabecera municipal: la plaza de la Restauración, la torre, el kiosco y el samán.',
    meta: '31 min en vehículo · Dificultad baja · Precaución: no entrar a las ruinas ni al antiguo templo',
    photo: '/img/que-hacer/ruinas.jpg',
    openDaily: true,
    info: { location: 'Gramalote Viejo' },
    tips: [
      { icon: 'huellas', title: 'Cómo llegar', text: '31 minutos en vehículo. El recorrido toma unas 2 horas.' },
      { icon: 'camino', title: 'Dificultad', text: 'Baja.' },
      { icon: 'alerta', title: 'Precaución', text: 'No entres a las ruinas ni al antiguo templo.' },
      { icon: 'bolso', title: 'Recomendaciones', text: RECOMMENDATIONS },
    ],
  },
  {
    slug: 'nuevo-gramalote',
    title: 'Nuevo Gramalote',
    category: 'Patrimonio',
    text: 'Caminar hasta 3 horas entre paisajes panorámicos y murales, visitar la casa de la cultura y la biblioteca, y encontrar gastronomía, hospedaje y artesanías.',
    meta: '1 h desde Cúcuta · Dificultad media alta · Entrada libre',
    photo: '/img/que-hacer/nuevo-gramalote.jpg',
    openDaily: true,
    info: { location: 'Casco urbano de Gramalote', fee: 'Entrada libre' },
    tips: [
      { icon: 'huellas', title: 'Cómo llegar', text: '1 hora desde Cúcuta. Recorridos a pie de hasta 3 horas.' },
      { icon: 'camino', title: 'Dificultad', text: 'Media alta.' },
      { icon: 'bolso', title: 'Recomendaciones', text: RECOMMENDATIONS },
    ],
  },
  {
    slug: 'cascadas-arco-iris',
    title: 'Cascadas Arco Iris',
    category: 'Naturaleza',
    text: 'Ver los arcoíris que el sol forma entre las gotas de la quebrada y, de noche, avistar golondrinas. Está en la finca Limoncito, donde vivió el fundador Gregorio Montes.',
    meta: '15 min en vehículo · Dificultad media alta',
    photo: '/img/experiencias/cascadas/1.jpg',
    hero: '/img/experiencias/cascadas/hero.jpg',
    openDaily: true,
    summary:
      'Las Cascadas Arco Iris destacan por sus arcoíris naturales y el avistamiento nocturno de golondrinas en Gramalote.',
    description:
      'Cascadas Arco Iris es un atractivo turístico del municipio de Gramalote, ubicado en la finca Limoncito, donde vivió sus últimos años el fundador Gregorio Montes. Cuando los rayos del sol entran en la espesura del entorno, cada gota de agua que cae roca abajo separa los colores de la luz y forma arcoíris. La quebrada siempre se conoció como Las Golondrinas, porque en ella posan estas aves, que se pueden avistar en horas nocturnas como plan adicional.',
    info: {
      hours: '9:00 a. m. – 6:00 p. m.',
      location: 'Finca Limoncito, vereda Valderrama',
      fee: '$5.000',
      phone: '310 7881532',
    },
    gallery: [
      { src: '/img/experiencias/cascadas/1.jpg', alt: 'Cascada entre paredes de roca cubiertas de musgo' },
      { src: '/img/experiencias/cascadas/2.jpg', alt: 'Letrero de Cascadas Arcoíris con alas de colores' },
      { src: '/img/experiencias/cascadas/3.jpg', alt: 'Salto de agua sobre una roca oscura' },
      { src: '/img/experiencias/cascadas/4.jpg', alt: 'Cascada que cae sobre una pared de roca' },
      { src: '/img/experiencias/cascadas/5.jpg', alt: 'Arcoíris sobre la cascada' },
    ],
    tips: [
      { icon: 'huellas', title: 'Tiempo de caminata', text: 'Aproximadamente 50 minutos a pie desde la plaza principal.' },
      { icon: 'camino', title: 'Dificultad', text: 'Media-alta. Se recomienda ir con guía y tener en cuenta las condiciones del acceso.' },
      { icon: 'bolso', title: 'Recomendaciones', text: 'Lleva ropa cómoda, zapatos cerrados, agua, gorra y protector solar. No fumar. Hay parqueadero.' },
      { icon: 'info', title: 'Estado del lugar', text: 'Abierto de 9:00 a. m. a 6:00 p. m. Antes de ir, consulta la información de acceso.' },
    ],
  },
  {
    slug: 'cafe-marquetalia',
    title: 'Café Marquetalia',
    category: 'Naturaleza',
    text: 'Tomar fotografías entre zonas verdes, descansar en hamacas y kioscos, tomar un café, acampar o alquilar la cocina para un asado o sancocho. No tiene restaurante.',
    meta: '20 min en carro o moto · Dificultad media baja',
    photo: '/img/que-hacer/marquetalia.jpg',
    openDaily: false,
    info: {},
    tips: [
      { icon: 'huellas', title: 'Cómo llegar', text: '20 minutos en carro o moto.' },
      { icon: 'camino', title: 'Dificultad', text: 'Media baja.' },
      { icon: 'info', title: 'Ten en cuenta', text: 'No tiene restaurante: puedes alquilar la cocina para un asado o un sancocho.' },
    ],
  },
]

export function getActivity(slug) {
  return activities.find((item) => item.slug === slug)
}
