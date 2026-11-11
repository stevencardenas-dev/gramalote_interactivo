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

// Experiencias de "Qué hacer" (frame QUE HACER, 1 de noviembre) y sus fichas.
// Es la copia que usa el sitio si la API no responde: los datos oficiales viven
// en MySQL y se editan en /admin/experiencias. `openDaily`: abre todos los días;
// es lo que usa el filtro "Abierto hoy".
export const activities = [
  {
    slug: 'pueblo-viejo',
    title: 'Pueblo Viejo',
    category: 'Patrimonio',
    text: 'Caminar por el camino veredal, cruzar el puente de Pueblo Viejo, hoy puente del Divino Niño, y conocer los vestigios de la primera cabecera municipal, a orillas de la quebrada Calderera.',
    meta: '30 min en vehículo · Dificultad media baja',
    photo: '/img/que-hacer/pueblo-viejo.jpg',
    openDaily: true,
    summary:
      'Un camino veredal junto a la quebrada Calderera, con el puente de Pueblo Viejo y los vestigios de la primera cabecera municipal.',
    description:
      'Pueblo Viejo es un camino veredal en la vereda Miraflores, dividido por la quebrada Calderera, la más grande, extensa y caudalosa del pueblo, que dio origen al primer nombre del caserío: Caldereros. Allí está el icónico puente de Pueblo Viejo, hoy reconocido como el puente del Divino Niño, en alusión a la gruta elevada en honor al Divino Niño del 20 de Julio. Puedes ver vestigios de la primera cabecera municipal, el puente Gregorio Montes, tres íconos religiosos, entre ellos los dedicados a la Virgen y al Divino Niño, y un pozo espectacular en la quebrada. Hay un estadero para conseguir otros servicios y fincas cercanas que ofrecen bebidas hidratantes y típicas.',
    info: {
      hours: 'Todos los días',
      location: 'Vereda Miraflores',
      fee: 'No aplica',
      phone: '312 4160301',
      access:
        'Desde la vía antigua a Lourdes, desvío hacia la quebrada por el camino a mano derecha. A 30 min en vehículo del casco urbano.',
      difficulty: 'Media baja',
    },
    tips: [
      { icon: 'huellas', title: 'Tiempo de caminata', text: 'Desde el desvío, 5 minutos en vehículo o unos 15 minutos a pie.' },
      { icon: 'camino', title: 'Dificultad', text: 'Media-baja. Se recomienda ir con guía y tener en cuenta las condiciones del acceso.' },
      { icon: 'bolso', title: 'Recomendaciones', text: 'Lleva ropa cómoda, zapatos cerrados, agua, gorra y protector solar. No fumar. Hay zona amplia de parqueo.' },
      { icon: 'info', title: 'Estado del lugar', text: 'Abierto todos los días. Hay estadero y fincas cercanas con bebidas.' },
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
    summary:
      'Lo que queda de la segunda cabecera municipal de Gramalote, en pie a pesar del paso del tiempo y de la furia de la naturaleza.',
    description:
      'Las ruinas del antiguo Gramalote son un espacio público que albergó la segunda cabecera municipal y que se mantiene en pie a pesar del paso del tiempo, las inclemencias del clima y la furia de la naturaleza. En el recorrido se pueden ver la plaza de la Restauración, la torre, el kiosco, el samán, las calles principales y algunas estructuras de las bases de los equipamientos de la época.',
    info: {
      hours: 'Todos los días',
      location: 'Vereda Jácome',
      fee: 'No aplica',
      phone: '310 8664036',
      access:
        'Por la vía hacia Villacaro, desviando hacia Lourdes a mano derecha por la vía antigua. A 31 min en vehículo del casco urbano.',
      difficulty: 'Baja',
    },
    gallery: [
      { src: '/img/experiencias/ruinas/panoramica-aerea.webp', alt: 'Panorámica aérea de las ruinas del antiguo Gramalote' },
      { src: '/img/experiencias/ruinas/iglesia-lateral.webp', alt: 'Iglesia en ruinas vista lateral' },
      { src: '/img/experiencias/ruinas/iglesia-lateral-2.webp', alt: 'Iglesia en ruinas desde otro ángulo lateral' },
      { src: '/img/experiencias/ruinas/iglesia-montanas.webp', alt: 'Iglesia en ruinas entre las montañas' },
      { src: '/img/experiencias/ruinas/vista-aerea.webp', alt: 'Vista aérea de las ruinas y su entorno' },
    ],
    tips: [
      { icon: 'huellas', title: 'Tiempo de caminata', text: 'El recorrido por las ruinas y la antigua plaza toma unas 2 horas.' },
      { icon: 'camino', title: 'Dificultad', text: 'Baja. Se recomienda ir con guía y respetar las zonas restringidas.' },
      { icon: 'bolso', title: 'Recomendaciones', text: 'No fumes ni consumas alcohol, no entres a las ruinas ni al templo, no toques osamentas y no uses pólvora.' },
      { icon: 'info', title: 'Estado del lugar', text: 'Abierto todos los días. No hay parqueadero: se deja el vehículo alrededor de la plaza.' },
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
    summary:
      'El tercer asentamiento urbano en la historia de Gramalote, planeado desde cero como proyecto piloto.',
    description:
      'Nuevo Gramalote es el tercer asentamiento urbano en la historia del municipio, el más moderno de Colombia, catalogado como proyecto piloto y planeado desde cero con componentes ambientales, urbanísticos y sismorresistentes, entre otros. Cuenta con la casa de la cultura, cuyo auditorio convoca los viernes a una noche de películas en plan familiar; la biblioteca Gonzalo Canal Ramírez, en honor a un genio de las letras hijo de esta tierra; y escuelas de música y pintura, cuyos pequeños talentos se muestran en la plaza pública los fines de semana. También están la icónica casa campesina, que ofrece un espacio para que los productores pernocten y reciban asistencia técnica, y la cooperativa de café. Los visitantes encuentran oferta de gastronomía, hospedaje y artesanías, y el parque del café, en el mirador natural de Santa Anita, con vistas panorámicas y senderos para recorrer.',
    info: {
      hours: 'Todos los días',
      location: 'Cabecera municipal',
      fee: 'A convenir',
      access:
        'Desde Cúcuta, a una hora en vehículo particular o en empresas de servicio público.',
      difficulty: 'Media alta',
    },
    gallery: [
      { src: '/img/experiencias/nuevo-gramalote/plaza-aerea.webp', alt: 'Vista aérea de la plaza de Nuevo Gramalote' },
      { src: '/img/experiencias/nuevo-gramalote/viviendas.webp', alt: 'Viviendas de Nuevo Gramalote' },
      { src: '/img/experiencias/nuevo-gramalote/calle-colorida.webp', alt: 'Calle colorida de Nuevo Gramalote entre las montañas' },
      { src: '/img/experiencias/nuevo-gramalote/espacio-publico.webp', alt: 'Espacio público de Nuevo Gramalote' },
      { src: '/img/experiencias/nuevo-gramalote/plaza-principal.webp', alt: 'Plaza principal de Nuevo Gramalote' },
    ],
    tips: [
      { icon: 'huellas', title: 'Tiempo de caminata', text: 'Hasta 3 horas a pie, según el recorrido que elijas por el pueblo.' },
      { icon: 'camino', title: 'Dificultad', text: 'Media-alta. Se recomienda ir con guía, sobre todo si vas a recorrerlo a pie.' },
      { icon: 'bolso', title: 'Recomendaciones', text: 'Usa ropa y zapatos cómodos, hidrátate y protégete del sol. Cuida el medio ambiente. Solo hay bahías de estacionamiento.' },
      { icon: 'info', title: 'Estado del lugar', text: 'Abierto todos los días. Recorrerlo no tiene costo; guía y transporte se pagan aparte.' },
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
      access:
        'Por la vía a Cúcuta, desvío a mano izquierda por trocha. A 15 min en vehículo del casco urbano.',
      difficulty: 'Media alta',
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
    hero: '/img/que-hacer/marquetalia.jpg',
    summary:
      'Espacios verdes para fotografías, hamacas, kioscos, cafetería y camping en Gramalote.',
    description:
      'Café Marquetalia es un parque en la vereda Las Violetas con espacios verdes y atractivos para fotografías, hamacas, kioscos, cafetería, camping y alquiler de cocina para asados o sancocho. No cuenta con restaurante. En diciembre, enero y Semana Santa, consulta la disponibilidad.',
    info: {
      hours: 'Sábados, domingos y lunes festivos, 9:00 a. m. – 6:00 p. m.',
      location: 'Vereda Las Violetas',
      fee: '$5.000',
      phone: '310 5770326',
      access:
        'Por la vía a Lourdes, desvío a mano derecha por la placa huella de asfalto inicial. A 20 min en carro o moto del casco urbano (2,5 km).',
      difficulty: 'Media baja',
    },
    gallery: [
      { src: '/img/experiencias/marquetalia/sendero-bosque.webp', alt: 'Sendero del café en el bosque' },
      { src: '/img/experiencias/marquetalia/entrada.webp', alt: 'Acceso y letrero de Café Marquetalia' },
      { src: '/img/experiencias/marquetalia/zonas-verdes.webp', alt: 'Zonas verdes de Café Marquetalia' },
      { src: '/img/experiencias/marquetalia/zona-recreativa.webp', alt: 'Zona recreativa de Café Marquetalia' },
      { src: '/img/experiencias/marquetalia/kiosco.webp', alt: 'Kiosco de Café Marquetalia' },
    ],
    tips: [
      { icon: 'huellas', title: 'Tiempo de caminata', text: 'Unos 20 minutos de recorrido desde la entrada del lugar, donde se puede dejar el vehículo.' },
      { icon: 'camino', title: 'Dificultad', text: 'Media-baja. Se recomienda ir con guía y tener en cuenta las condiciones del acceso.' },
      { icon: 'bolso', title: 'Recomendaciones', text: 'Lleva ropa cómoda, zapatos cerrados, agua, gorra y protector solar. No fumar. Hay parqueadero en la entrada.' },
      { icon: 'info', title: 'Estado del lugar', text: 'Sábados, domingos y lunes festivos, 9:00 a. m. – 6:00 p. m. En diciembre, enero y Semana Santa, consulta disponibilidad.' },
    ],
  },
]

export function getActivity(slug) {
  return activities.find((item) => item.slug === slug)
}
