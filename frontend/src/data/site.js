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
  // Redes con iconos entregados por diseño en /brand/social.
  // TODO: reemplazar los enlaces provisionales por las cuentas reales.
  // Ya existen también whatsapp.svg, email.svg y linktree.svg listos para usar.
  social: [
    { label: 'Instagram', icon: 'instagram', href: 'https://www.instagram.com/' },
    { label: 'Facebook', icon: 'facebook', href: 'https://www.facebook.com/' },
    { label: 'TikTok', icon: 'tiktok', href: 'https://www.tiktok.com/' },
    { label: 'YouTube', icon: 'youtube', href: 'https://www.youtube.com/' },
    { label: 'X', icon: 'x', href: 'https://x.com/' },
  ],
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
