export const site = {
  name: 'Gramalote Interactivo',
  place: 'Gramalote · Norte de Santander',
  // `icon` se usa en el menú móvil; en la navegación de escritorio no se dibuja.
  nav: [
    { label: 'Inicio', to: '/', match: ['/'], exact: true, icon: 'home' },
    { label: 'Qué hacer', to: '/que-hacer', match: ['/que-hacer'], icon: 'compass' },
    {
      label: 'Dónde ir',
      to: '/donde-ir',
      match: ['/donde-ir', '/donde-comer', '/donde-dormir', '/donde-comprar', '/establecimiento', '/mapa'],
      icon: 'map',
    },
    { label: 'Su historia', to: '/historia', match: ['/historia'], icon: 'book' },
  ],
  explore: {
    label: 'Explorar',
    match: ['/curiosidades', '/informacion-practica'],
    items: [
      { label: 'Curiosidades', to: '/curiosidades', icon: 'sparkles' },
      { label: 'Información práctica', to: '/informacion-practica', icon: 'info' },
    ],
  },
  footer: [
    { label: 'Inicio', to: '/' },
    { label: 'Nuestra historia', to: '/historia' },
    { label: 'Información práctica', to: '/informacion-practica' },
    { label: 'Curiosidades', to: '/curiosidades' },
    { label: 'Contactos útiles', to: '/informacion-practica#contactos' },
  ],
  // Las redes sociales del pie se editan en el panel (data/pages.js › redes).
  practical: [
    {
      title: 'Cómo llegar',
      text: 'Orientación para llegar al municipio.',
      icon: 'route',
      brandIcon: 'camino',
      illustration: '/img/illus/ILUSTRACION_COMO_LLEGAR.svg',
      to: '/informacion-practica#como-llegar',
    },
    {
      title: 'Seguridad',
      text: 'Recomendaciones para la visita.',
      icon: 'shield',
      brandIcon: 'escudo',
      illustration: '/img/illus/ILUSTRACION_SEGURIDAD.svg',
      to: '/informacion-practica#seguridad',
    },
    {
      title: 'Contactos útiles',
      text: 'Teléfonos e información de contacto.',
      icon: 'phone',
      brandIcon: 'telefono',
      illustration: '/img/illus/ILUSTRACION_CONTACTO_UTIL.svg',
      to: '/informacion-practica#contactos',
    },
    {
      title: 'Antes de salir',
      text: 'Qué conviene preparar antes de la visita.',
      icon: 'info',
      brandIcon: 'info',
      illustration: '/img/illus/ILUSTRACION_ANTES_DE_SALIR.svg',
      to: '/informacion-practica#antes-de-salir',
    },
  ],
}
