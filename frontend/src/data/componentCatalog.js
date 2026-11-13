// Secciones del sitio que el buscador ofrece en el modo «Componentes». Cada una
// se muestra con el mismo diseño que tiene en el inicio y lleva a su página.
// `design`: 'quick' (tarjeta con foto, como «Accede rápido») o 'feature'
// (ilustración con título, como «Información práctica»).
//
// Criterio de las fotos: la sección usa una imagen fija de diseño que representa
// su página de destino (no la portada de una ficha). Se corrige aquí una vez y
// no se edita desde el panel; las fichas de establecimientos y experiencias sí
// muestran su portada editable en los resultados.
export const componentCatalog = [
  {
    id: 'que-hacer',
    name: 'Qué hacer',
    keywords: 'experiencias actividades planes turismo naturaleza',
    description: 'Experiencias para vivir Gramalote.',
    to: '/que-hacer',
    design: 'quick',
    photo: '/img/home/que-hacer.jpg',
  },
  {
    id: 'donde-ir',
    name: 'Dónde ir',
    keywords: 'lugares establecimientos sitios visitar explorar mapa',
    description: 'Todos los lugares del municipio.',
    to: '/donde-ir',
    design: 'quick',
    photo: '/img/home/explora.jpg',
  },
  {
    id: 'donde-comer',
    name: 'Dónde comer',
    keywords: 'restaurantes comida cafeterias gastronomia almuerzo',
    description: 'Restaurantes, cafeterías y comida típica.',
    to: '/donde-comer',
    design: 'quick',
    photo: '/img/home/comer.jpg',
  },
  {
    id: 'donde-dormir',
    name: 'Dónde dormir',
    keywords: 'hotel hostal glamping alojamiento hospedaje cabanas',
    description: 'Hoteles, hostales y glampings.',
    to: '/donde-dormir',
    design: 'quick',
    photo: '/img/home/dormir.jpg',
  },
  {
    id: 'donde-comprar',
    name: 'Dónde comprar',
    keywords: 'tiendas artesanias souvenirs regalos compras',
    description: 'Artesanías, tiendas y productos locales.',
    to: '/donde-comprar',
    design: 'quick',
    photo: '/img/home/comprar.jpg',
  },
  {
    id: 'historia',
    name: 'Su historia',
    keywords: 'historia pasado nuevo viejo gramalote reubicacion',
    description: 'La historia de Gramalote.',
    to: '/historia',
    design: 'quick',
    photo: '/img/home/historia.jpg',
  },
  {
    id: 'mapa',
    name: 'Mapa interactivo',
    keywords: 'mapa ubicacion ruta lugares explorar gps',
    description: 'Explora los lugares en el mapa.',
    to: '/mapa',
    design: 'quick',
    // Vista aérea del pueblo viejo: diferencia el mapa de «Dónde ir», que usa
    // la foto del nuevo Gramalote.
    photo: '/img/home/hero-gramalote-viejo.jpg',
  },
  {
    id: 'informacion-practica',
    name: 'Información práctica',
    keywords: 'informacion practica visitar consejos antes de salir',
    description: 'Lo que debes saber si vas a visitar Gramalote.',
    to: '/informacion-practica',
    design: 'feature',
    icon: 'info',
  },
  {
    id: 'como-llegar',
    name: 'Cómo llegar',
    keywords: 'llegar transporte bus carro vias ruta',
    description: 'Orientación para llegar al municipio.',
    to: '/informacion-practica#como-llegar',
    design: 'feature',
    illustration: '/img/illus/ILUSTRACION_COMO_LLEGAR.svg',
  },
  {
    id: 'seguridad',
    name: 'Seguridad',
    keywords: 'seguridad recomendaciones precauciones emergencia',
    description: 'Recomendaciones para la visita.',
    to: '/informacion-practica#seguridad',
    design: 'feature',
    illustration: '/img/illus/ILUSTRACION_SEGURIDAD.svg',
  },
  {
    id: 'contactos',
    name: 'Contactos útiles',
    keywords: 'contactos telefonos emergencias ayuda numeros',
    description: 'Teléfonos e información de contacto.',
    to: '/informacion-practica#contactos',
    design: 'feature',
    illustration: '/img/illus/ILUSTRACION_CONTACTO_UTIL.svg',
  },
  {
    id: 'antes-de-salir',
    name: 'Antes de salir',
    keywords: 'preparar equipaje antes salir viaje',
    description: 'Qué conviene preparar antes de la visita.',
    to: '/informacion-practica#antes-de-salir',
    design: 'feature',
    illustration: '/img/illus/ILUSTRACION_ANTES_DE_SALIR.svg',
  },
  {
    id: 'curiosidades',
    name: 'Curiosidades',
    keywords: 'curiosidades datos curiosos cultura tradiciones',
    description: 'Datos y relatos de Gramalote.',
    to: '/curiosidades',
    design: 'feature',
    icon: 'info',
  },
]
