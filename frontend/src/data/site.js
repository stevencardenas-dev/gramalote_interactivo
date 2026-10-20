export const site = {
  name: 'Gramalote Interactivo',
  place: 'Gramalote · Norte de Santander',
  nav: [
    { label: 'Inicio', to: '/' },
    { label: 'Qué hacer', to: '/que-hacer' },
    { label: 'Dónde ir', to: '/donde-ir' },
    { label: 'Su historia', to: '/historia' },
  ],
  explore: {
    label: 'Explorar',
    items: [
      { label: 'Curiosidades', to: '/curiosidades' },
      { label: 'Información práctica', to: '/informacion-practica' },
    ],
  },
  footer: [
    { label: 'Inicio', to: '/' },
    { label: 'Nuestra historia', to: '/historia' },
    { label: 'Información práctica', to: '/informacion-practica' },
    { label: 'Curiosidades', to: '/curiosidades' },
    { label: 'Contactos útiles', to: '/informacion-practica#contactos' },
  ],
  social: [
    { label: 'Instagram', icon: 'instagram', href: 'https://www.instagram.com/' },
    { label: 'Facebook', icon: 'facebook', href: 'https://www.facebook.com/' },
    { label: 'YouTube', icon: 'youtube', href: 'https://www.youtube.com/' },
  ],
  practical: [
    {
      title: 'Cómo llegar',
      text: 'Orientación para llegar al municipio.',
      icon: 'route',
      to: '/informacion-practica#como-llegar',
    },
    {
      title: 'Seguridad',
      text: 'Recomendaciones para un recorrido tranquilo.',
      icon: 'shield',
      to: '/informacion-practica#seguridad',
    },
    {
      title: 'Contactos útiles',
      text: 'Números y entidades de apoyo en Gramalote.',
      icon: 'phone',
      to: '/informacion-practica#contactos',
    },
    {
      title: 'Antes de salir',
      text: 'Qué llevar y qué tener en cuenta.',
      icon: 'info',
      to: '/informacion-practica#antes-de-salir',
    },
  ],
}
