export const experiences = [
  {
    id: 'cascadas-escondidas',
    slug: 'cascadas-arco-iris',
    title: 'Cascadas escondidas entre la niebla',
    category: 'Naturaleza',
    description:
      'El sonido del agua te guía por el sendero. Al final, la recompensa es un arcoíris entre la niebla.',
    to: '/que-hacer/cascadas-arco-iris',
  },
  {
    id: 'sabores-de-gramalote',
    slug: 'sabores-de-gramalote',
    title: 'Sabores de Gramalote',
    category: 'Gastronomía',
    description:
      'Descubre los platos y sabores que reúnen historias, tradiciones y memoria del municipio.',
    to: '/donde-comer',
  },
  {
    id: 'artesanias-con-identidad-local',
    slug: 'artesanias-con-identidad-local',
    title: 'Artesanías con identidad local',
    category: 'Cultura',
    description:
      'Conoce los productos y las creaciones de los artesanos de Gramalote, piezas que guardan su historia.',
    to: '/donde-comprar',
  },
]

export const experienceDetails = [
  {
    slug: 'cascadas-arco-iris',
    title: 'Cascadas Arco Iris',
    category: 'Naturaleza',
    summary:
      'Las Cascadas Arcoíris destacan por sus arcoíris naturales y el avistamiento nocturno de golondrinas en Gramalote.',
    description:
      'Cascadas Arcoíris es un atractivo turístico del municipio de Gramalote en la finca Limoncito, donde vivió los últimos años de vida nuestro fundador Gregorio Montes. Tiene una característica óptica muy interesante: cuando los rayos de sol entran en la espesura del entorno logra separar los colores del haz de luz al pasar por cada gotica de agua que cae roca abajo, generando ese espectáculo visual de muchos arcoíris. Propiamente el nombre a la quebrada que siempre se conoció como Las Golondrinas, ya que en ella posaban estas aves hasta nuestros tiempos en horas nocturnas, como un plan extra para avistarlas.',
    hours: 'Lunes a domingo, de 8:00 a. m. a 9:00 p. m.',
    address: 'Calle 5 #4-20, Gramalote Nuevo.',
    parking: 'Sí, parqueadero para clientes.',
    phone: '+57 310 123 4567',
    social: ['facebook', 'instagram'],
    gallery: 5,
    tips: [
      {
        title: 'Tiempo de caminata',
        text: 'Aproximadamente 50 minutos a pie desde la plaza principal.',
      },
      {
        title: 'Dificultad',
        text: 'Media-alta. Ten en cuenta las condiciones del acceso.',
      },
      {
        title: 'Recomendaciones',
        text: 'Lleva ropa cómoda, zapatos cerrados, agua, gorra y protector solar.',
      },
      {
        title: 'Estado del lugar',
        text: 'Cierre temporal. Verifica si se autoriza la visita antes de desplazarte.',
      },
    ],
  },
  {
    slug: 'cafe-marquetalia',
    title: 'Café Marquetalia',
    category: 'Parque',
    summary:
      'Consulta la información de este establecimiento y descubre qué ofrece para complementar tu visita a Gramalote.',
    description:
      'Un espacio para disfrutar del café de la región y del paisaje de montaña, con atención para visitantes y habitantes de Gramalote.',
    hours: 'Pendiente de confirmar',
    address: 'Gramalote, Norte de Santander.',
    parking: 'Pendiente de confirmar',
    phone: 'Pendiente de confirmar',
    social: [],
    gallery: 5,
    tips: [
      {
        title: 'Tiempo de caminata',
        text: 'Consulta el tiempo aproximado de recorrido desde el punto de referencia.',
      },
      {
        title: 'Dificultad',
        text: 'Revisa el nivel de dificultad y las condiciones generales del acceso.',
      },
      {
        title: 'Recomendaciones',
        text: 'Lleva ropa cómoda, calzado adecuado, agua, gorra y protección solar.',
      },
      {
        title: 'Estado del lugar',
        text: 'Verifica restricciones y recomendaciones vigentes antes de salir.',
      },
    ],
  },
  {
    slug: 'otro-sitio',
    title: 'Otro sitio',
    category: 'Por definir',
    summary:
      'Atractivos, naturaleza, gastronomía, eventos y la memoria del municipio en una sola guía pensada para el celular: qué hay para hacer y cómo llegar a cada lugar.',
    description:
      'Atractivos, naturaleza, gastronomía, eventos y la memoria del municipio en una sola guía pensada para el celular: qué hay para hacer y cómo llegar a cada lugar.',
    hours: 'Pendiente de confirmar',
    address: 'Gramalote, Norte de Santander.',
    parking: 'Pendiente de confirmar',
    phone: 'Pendiente de confirmar',
    social: [],
    gallery: 5,
    tips: [
      {
        title: 'Tiempo de caminata',
        text: 'Pendiente de confirmar.',
      },
      {
        title: 'Dificultad',
        text: 'Pendiente de confirmar.',
      },
      {
        title: 'Recomendaciones',
        text: 'Lleva ropa cómoda, calzado adecuado, agua, gorra y protección solar.',
      },
      {
        title: 'Estado del lugar',
        text: 'Verifica restricciones y recomendaciones vigentes antes de salir.',
      },
    ],
  },
]

export function getExperience(slug) {
  return experienceDetails.find((item) => item.slug === slug)
}
