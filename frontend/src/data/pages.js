// Contenido editable de las páginas «estáticas» (Páginas, en el panel).
//
// Esto es el diseño original: lo que se ve si nadie ha guardado cambios o si la
// API no responde. Lo guardado en /admin/paginas se mezcla encima (ver
// lib/pageContent.js). Cada tarjeta lleva un `id` estable para que esa mezcla
// recupere la foto del diseño si la elegida se borra.
//
// Enlaces: { kind: 'experience' | 'establishment', slug } apuntan a una ficha y
// la tarjeta se oculta si la ficha se despublica; { kind: 'page', path } es una
// sección general del sitio.

export const PAGE_LINKS = [
  { path: '/que-hacer', label: 'Qué hacer' },
  { path: '/donde-ir', label: 'Dónde ir' },
  { path: '/donde-comer', label: 'Dónde comer' },
  { path: '/donde-dormir', label: 'Dónde dormir' },
  { path: '/donde-comprar', label: 'Dónde comprar' },
  { path: '/historia', label: 'Historia' },
  { path: '/curiosidades', label: 'Curiosidades' },
  { path: '/mapa', label: 'Mapa interactivo' },
  { path: '/informacion-practica', label: 'Información práctica' },
]

export const PAGE_DEFAULTS = {
  inicio: {
    quickAccess: [
      { id: 'que-hacer', label: 'Qué hacer', to: '/que-hacer', photo: '/img/home/que-hacer.jpg' },
      { id: 'comer', label: 'Dónde comer', to: '/donde-comer', photo: '/img/home/comer.jpg' },
      { id: 'dormir', label: 'Dónde dormir', to: '/donde-dormir', photo: '/img/home/dormir.jpg' },
      { id: 'historia', label: 'Su historia', to: '/historia', photo: '/img/home/historia.jpg' },
      { id: 'comprar', label: 'Dónde comprar', to: '/donde-comprar', photo: '/img/home/comprar.jpg' },
    ],
    experiences: [
      {
        id: 'cascadas-escondidas',
        title: 'Cascadas escondidas entre la niebla',
        text: 'El sonido del agua te guía por el sendero. Al final, la recompensa es fría y transparente.',
        photo: '/img/home/exp-1.jpg',
        link: { kind: 'experience', slug: 'cascadas-arco-iris' },
      },
      {
        id: 'sabores-de-gramalote',
        title: 'Sabores de Gramalote',
        text: 'Descubre la gastronomía local y los sabores tradicionales del municipio.',
        photo: '/img/home/exp-2b.jpg',
        link: { kind: 'page', path: '/donde-comer' },
      },
      {
        id: 'artesanias-con-identidad-local',
        title: 'Artesanías con identidad local',
        text: 'Conoce los productos y las creaciones de los artesanos de Gramalote.',
        photo: '/img/home/exp-3b.jpg',
        link: { kind: 'page', path: '/donde-comprar' },
      },
    ],
    highlights: [
      { id: 'cafe-marquetalia', title: 'Café Marquetalia', photo: '/img/home/est-1.jpg', link: { kind: 'experience', slug: 'cafe-marquetalia' } },
      { id: 'la-comarca', title: 'La Comarca', photo: '/img/home/est-2.jpg', link: { kind: 'establishment', slug: 'la-comarca' } },
      { id: 'verdeser-glampings', title: 'Verdeser Glampings', photo: '/img/home/est-3.jpg', link: { kind: 'establishment', slug: 'verdeser-glampings' } },
      { id: 'la-sazon-de-la-tia', title: 'Restaurante El Gran Sazón', photo: '/img/home/est-4.jpg', link: { kind: 'establishment', slug: 'la-sazon-de-la-tia' } },
      { id: 'casa-hiedra-hotel-boutique', title: 'Casa Hiedra Hotel Boutique', photo: '/img/home/est-5.jpg', link: { kind: 'establishment', slug: 'casa-hiedra-hotel-boutique' } },
      { id: 'cascadas-arco-iris', title: 'Cascadas Arco Iris', photo: '/img/home/est-6.jpg', link: { kind: 'experience', slug: 'cascadas-arco-iris' } },
    ],
  },

  // Sin orden guardado se usa el de la base (sort_order).
  'que-hacer': { order: [], covers: {} },

  'donde-ir': {
    comer: {
      eyebrow: 'Gastronomía local',
      title: 'Dónde comer',
      text: 'Descubre restaurantes, cafeterías, comidas típicas y sabores de Gramalote.',
      images: [
        { id: 'comer-1', photo: '/img/home/colage-comer-1.jpg', alt: 'Carnes a la plancha' },
        { id: 'comer-2', photo: '/img/home/colage-comer-2.jpg', alt: 'Fresas con crema' },
        { id: 'comer-3', photo: '/img/home/colage-comer-3.jpg', alt: 'Helados artesanales' },
      ],
    },
    dormir: {
      eyebrow: 'Alojamientos en Gramalote',
      title: 'Dónde dormir',
      items: ['glamping-vista-antigua', 'hostal-campestre-camino-real', 'hostal-luna-azul', 'cabanas-el-penon'],
      covers: {},
    },
    comprar: {
      eyebrow: 'Artesanías y productos locales',
      title: 'Dónde comprar',
      text: 'Conoce a los artesanos de Gramalote y descubre tejidos, bisutería, decoración y productos hechos a mano.',
      items: ['sombreros-techa', 'maestros-de-la-madera', 'creaciones-martina'],
      covers: {},
    },
  },

  'donde-comer': {
    order: ['bambu', 'dona-claudia', 'dulce-paseo', 'fresas-con-crema-carvajal', 'la-sazon-de-la-tia', 'la-comarca'],
    covers: {},
    related: {
      eyebrow: 'Alojamientos en Gramalote',
      title: 'Dónde dormir',
      text: '',
      items: ['glamping-vista-antigua', 'hostal-campestre-camino-real', 'hostal-luna-azul', 'cabanas-el-penon'],
      covers: {},
    },
  },

  'donde-dormir': {
    order: [],
    covers: {},
    related: {
      eyebrow: 'Artesanías y productos locales',
      title: 'Lugares relacionados',
      text: 'También puedes conocer otras opciones de alojamiento en Gramalote y elegir la que mejor se adapte a tu visita.',
      items: ['maestros-de-la-madera', 'creaciones-martina'],
      covers: {},
    },
  },

  'donde-comprar': {
    order: [],
    covers: {},
    platos: {
      images: [
        { id: 'platos-1', photo: '/img/home/platos-1.jpg', alt: 'Sopa tradicional' },
        { id: 'platos-2', photo: '/img/home/platos-2.jpg', alt: 'Arepas' },
        { id: 'platos-3', photo: '/img/home/platos-3.jpg', alt: 'Café y pan' },
      ],
    },
    mapa: {
      photo: '/img/home/donde-comer-bar.jpg',
      alt: 'Barra de un restaurante de Gramalote',
    },
  },
}

// Redes del pie de página: se activan, desactivan y enlazan en Páginas › Redes
// sociales. Los iconos están en public/brand/social.
export const SOCIAL_NETWORKS = [
  { id: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/usuario' },
  { id: 'facebook', label: 'Facebook', placeholder: 'https://www.facebook.com/pagina' },
  { id: 'whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/573001234567' },
  { id: 'tiktok', label: 'TikTok', placeholder: 'https://www.tiktok.com/@usuario' },
  { id: 'youtube', label: 'YouTube', placeholder: 'https://www.youtube.com/@canal' },
  { id: 'x', label: 'X', placeholder: 'https://x.com/usuario' },
  { id: 'linktree', label: 'Linktree', placeholder: 'https://linktr.ee/usuario' },
  { id: 'email', label: 'Correo', placeholder: 'mailto:contacto@gramalote.gov.co' },
]

PAGE_DEFAULTS.redes = {
  social: [
    { id: 'instagram', url: 'https://www.instagram.com/', enabled: true },
    { id: 'whatsapp', url: 'https://www.whatsapp.com/', enabled: true },
    { id: 'tiktok', url: 'https://www.tiktok.com/', enabled: true },
    { id: 'youtube', url: 'https://www.youtube.com/', enabled: true },
    { id: 'x', url: 'https://x.com/', enabled: true },
    { id: 'facebook', url: '', enabled: false },
    { id: 'linktree', url: '', enabled: false },
    { id: 'email', url: '', enabled: false },
  ],
}

// Enlace válido para una red: web (http/https) o correo (mailto:).
export function isSocialUrl(url) {
  return typeof url === 'string' && /^(https?:\/\/[^\s]+|mailto:[^\s@]+@[^\s@]+)$/i.test(url.trim())
}

// Cuántas tarjetas muestra cada bloque de referencias.
export const RELATED_COUNT = {
  'donde-ir.dormir': 4,
  'donde-ir.comprar': 3,
  'donde-comer': 4,
  'donde-dormir': 2,
}
