// Espacios del sitio donde una foto tiene proporciones propias y se puede encuadrar
// desde el panel. Los encabezados no se encuadran (siguen en automático).
//
//   key       identifica el espacio (también lo guarda el servidor)
//   label     cómo se le muestra a quien edita
//   ratio     ancho / alto del marco, igual que su aspect-ratio en el CSS
//   selector  contenedor en el sitio público que marca el espacio
//
// Para añadir un espacio nuevo: una entrada aquí y, en el panel, decidir qué fotos
// caen en él (ver framesForEstablishmentImage).
export const PHOTO_FRAMES = {
  // Tarjetas destacadas con el texto sobre la foto (PlaceCard). Los alojamientos salen en
  // las de 4 columnas de Dónde ir y Dónde comer (263 × 300); las tiendas, en las anchas de
  // Dónde ir y Dónde dormir (544–549 × 300). Alto fijo y ancho variable: aproximado.
  'destacada-vertical': {
    label: 'Tarjeta destacada',
    ratio: 263 / 300,
    selector: '.place-grid--four .place-card',
  },
  'destacada-ancha': {
    label: 'Tarjeta destacada',
    ratio: 546 / 300,
    selector: '.shops-block .place-card, .place-grid--two .place-card',
  },
  // Foto cuadrada del punto en el mapa: en la lista (56–60 px) y en su tarjeta (92 px).
  // La llevan las portadas de establecimientos, experiencias, patrimonio y extras.
  'mapa-cuadrado': {
    label: 'Mapa',
    ratio: 1,
    selector: '.mapa-lugar__foto, .mapa-ficha__foto',
  },
  // Galería de una experiencia: las 2 primeras fotos grandes y el resto más pequeñas.
  // El alto depende del ancho de la pantalla (clamp): medidas a 1280 px, aproximadas.
  'experiencia-galeria-grande': {
    label: 'Galería · fotos grandes',
    ratio: 549 / 448,
    selector: '.experience-gallery .photo:nth-child(-n + 2)',
  },
  'experiencia-galeria-pequena': {
    label: 'Galería · fotos pequeñas',
    ratio: 357 / 269,
    selector: '.experience-gallery .photo:nth-child(n + 3)',
  },
  // Portada de una experiencia en la tarjeta de Qué hacer (alto fijo, ancho variable;
  // la primera tarjeta es más ancha): medida a 1280 px, aproximada.
  'experiencia-tarjeta': {
    label: 'Tarjeta de Qué hacer',
    ratio: 347 / 200,
    selector: '.activity-card',
  },
  // Patrimonio: miniatura de la lista de Historia › Patrimonio (portada) y foto de la
  // ficha (la portada si hay una sola foto, o el carrusel de épocas).
  'patrimonio-lista': {
    label: 'Lista de patrimonio',
    ratio: 200 / 133,
    selector: '.his-row__media',
  },
  'patrimonio-ficha': {
    label: 'Ficha de patrimonio',
    ratio: 509 / 388,
    selector: '.his-ficha__aside .his-photo-frame, .era-carousel__stage',
  },
  // Galería de la ficha de patrimonio (4/3; la portada también sale como primera foto).
  'patrimonio-galeria': {
    label: 'Galería de patrimonio',
    ratio: 4 / 3,
    selector: '.his-ficha__gallery .his-photo-frame',
  },
  // Portada en las tarjetas de las listas de Dónde dormir, comer y comprar. El alto es
  // fijo (200 px) y el ancho cambia con las columnas: 352 × 200 en escritorio; en otros
  // anchos el encuadre es aproximado.
  'tarjeta-lista': {
    label: 'Tarjeta de la lista',
    ratio: 352 / 200,
    selector: '.listing-card-v',
  },
  // Foto de un producto o plato (Dónde comer y Dónde comprar). En pantallas pequeñas el
  // marco pasa a 4/3 y el encuadre se aproxima.
  'oferta-producto': {
    label: 'Producto',
    ratio: 405 / 362,
    selector: '.offer-card',
  },
  'dormir-galeria-grande': {
    label: 'Galería · espacios 1 y 2 del collage',
    ratio: 580 / 502,
    selector: '.ficha-gallery__top',
    collage: 'dormir',
  },
  'dormir-galeria-pequeno': {
    label: 'Galería · espacios 3 a 5 del collage',
    ratio: 376 / 300,
    selector: '.ficha-gallery__row',
    collage: 'dormir',
  },
}

// Disposición de los collages (para la miniatura del panel): filas de espacios con su
// proporción, igual que en el CSS. `slot` es la posición de la foto dentro del collage.
export const COLLAGES = {
  dormir: {
    rows: [
      [
        { slot: 0, ratio: 580 / 502 },
        { slot: 1, ratio: 580 / 502 },
      ],
      [
        { slot: 2, ratio: 376 / 300 },
        { slot: 3, ratio: 376 / 300 },
        { slot: 4, ratio: 376 / 300 },
      ],
    ],
  },
}

// Espacio al que pertenece un <img> del sitio, según su contenedor.
export function frameOfElement(element) {
  for (const [key, frame] of Object.entries(PHOTO_FRAMES)) {
    if (element.closest(frame.selector)) return key
  }
  return null
}

// Espacios en los que sale una foto de una ficha de establecimiento.
// Dónde dormir: la galería es un collage fijo de 5 espacios que se llena con las
// fotos de «Galería» en orden (2 grandes y 3 pequeños): la 2.ª es la de la derecha de
// la primera fila (orden confirmado con el collage público).
export function framesForEstablishmentImage({ categorySlug, role, galleryIndex }) {
  // Las fotos de galería también pueden elegirse como foto de una tarjeta destacada (Páginas).
  if (categorySlug === 'dormir' && role === 'gallery' && galleryIndex >= 0 && galleryIndex < 5) {
    return [galleryIndex < 2 ? 'dormir-galeria-grande' : 'dormir-galeria-pequeno', 'destacada-vertical']
  }
  if (categorySlug === 'dormir' && role === 'gallery') return ['destacada-vertical']
  if (categorySlug === 'comprar' && role === 'gallery') return ['destacada-ancha']
  // La portada sale en la tarjeta de la lista de su categoría y, cuadrada, en el mapa.
  if (role === 'cover') {
    if (categorySlug === 'dormir') return ['tarjeta-lista', 'destacada-vertical', 'mapa-cuadrado']
    if (categorySlug === 'comprar') return ['tarjeta-lista', 'destacada-ancha', 'mapa-cuadrado']
    return categorySlug === 'comer' ? ['tarjeta-lista', 'mapa-cuadrado'] : ['mapa-cuadrado']
  }
  return []
}

// Experiencias: la portada sale en la tarjeta de Qué hacer y, cuadrada, en el mapa; la
// galería llena sus espacios en orden (las 2 primeras, grandes).
export function framesForExperienceImage({ role, galleryIndex }) {
  if (role === 'cover') return ['experiencia-tarjeta', 'mapa-cuadrado']
  if (role === 'gallery' && galleryIndex >= 0) {
    return [galleryIndex < 2 ? 'experiencia-galeria-grande' : 'experiencia-galeria-pequena']
  }
  return []
}

// Patrimonio: la portada sale en la lista, en la ficha (y como primera foto de su galería) y,
// cuadrada, en el mapa; las fotos del carrusel de épocas, en la ficha; las de galería, en la galería.
export function framesForHeritageImage({ role }) {
  if (role === 'cover') return ['patrimonio-lista', 'patrimonio-ficha', 'patrimonio-galeria', 'mapa-cuadrado']
  if (role === 'historic') return ['patrimonio-ficha']
  if (role === 'gallery') return ['patrimonio-galeria']
  return []
}

// Extras: una sola foto, cuadrada, en la lista y en la tarjeta del mapa.
export function framesForExtraImage() {
  return ['mapa-cuadrado']
}
