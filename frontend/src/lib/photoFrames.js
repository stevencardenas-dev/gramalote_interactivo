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
  // — Espacios que se encuadran en Páginas (medidos a 1280 px; alto fijo y ancho variable
  //   en algunos, por eso son aproximados) —
  // Inicio · «Accede rápido» (5 tarjetas fijas).
  'inicio-acceso': { label: 'Accede rápido', ratio: 173 / 157, selector: '.quick-grid .quick-card' },
  // Inicio · «Experiencias que no olvidarás»: la primera tarjeta es ancha y las demás, altas y estrechas.
  'inicio-experiencia-grande': {
    label: 'Experiencia destacada',
    ratio: 504 / 525,
    selector: '.experiences__grid .experience-card--featured',
  },
  'inicio-experiencia': {
    label: 'Experiencia',
    ratio: 279 / 525,
    selector: '.experiences__grid .experience-card:not(.experience-card--featured)',
  },
  // Inicio · «Descubre establecimientos».
  'inicio-establecimiento': { label: 'Establecimiento', ratio: 354 / 248, selector: '.entity-grid .entity-card' },
  // Dónde ir · collage de Dónde comer: una foto alta y dos bajas.
  'collage-ir-alto': { label: 'Collage · foto alta', ratio: 278 / 384, selector: '.category-spotlight .photo-collage__tall' },
  'collage-ir-bajo': {
    label: 'Collage · foto baja',
    ratio: 278 / 185,
    selector: '.category-spotlight .photo-collage > .photo:not(.photo-collage__tall)',
  },
  // Dónde comprar · «Platos típicos»: una foto alta y dos bajas.
  'platos-alto': { label: 'Platos · foto alta', ratio: 258 / 387, selector: '.split-feature .photo-collage__tall' },
  'platos-bajo': {
    label: 'Platos · foto baja',
    ratio: 258 / 186,
    selector: '.split-feature .photo-collage > .photo:not(.photo-collage__tall)',
  },
  // Dónde comprar · bloque «Encuentra dónde comer».
  'encuentra-comer': { label: 'Encuentra dónde comer', ratio: 529 / 397, selector: '.split-feature__media' },
  // Buscador · tarjeta de cada sección.
  'buscador-tarjeta': { label: 'Buscador', ratio: 202 / 152, selector: '.component-results .quick-card' },

  // — Espacios de las fichas y de las listas —
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
    // Mapa interactivo y tarjeta del mapa de Historia › Patrimonio (ambos cuadrados).
    selector: '.mapa-lugar__foto, .mapa-ficha__foto, .his-mapview__card-media',
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
  // Las 3 primeras tarjetas ocupan 1/3 de la fila (estrecha) y desde la 4.ª, 1/2 (ancha). La
  // clave «experiencia-tarjeta» es la estrecha: así se conservan los encuadres ya guardados.
  'experiencia-tarjeta': {
    label: 'Tarjeta de Qué hacer · estrecha',
    ratio: 347 / 200,
    selector: '.activity-card:nth-child(-n + 3)',
  },
  'experiencia-tarjeta-ancha': {
    label: 'Tarjeta de Qué hacer · ancha',
    ratio: 540 / 200,
    selector: '.activity-card:nth-child(n + 4)',
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
  if (categorySlug === 'dormir' && role === 'gallery' && galleryIndex >= 0 && galleryIndex < 5) {
    return [galleryIndex < 2 ? 'dormir-galeria-grande' : 'dormir-galeria-pequeno']
  }
  // La portada sale cuadrada en el mapa. Su tarjeta de las listas y las tarjetas destacadas se
  // encuadran en Páginas, donde se elige la foto de cada una (ver PAGES_FRAMES).
  if (role === 'cover') return ['mapa-cuadrado']
  return []
}

// Experiencias: la portada sale en la tarjeta de Qué hacer y, cuadrada, en el mapa; la
// galería llena sus espacios en orden (las 2 primeras, grandes).
export function framesForExperienceImage({ role, galleryIndex }) {
  // La tarjeta de Qué hacer se encuadra en Páginas (PAGES_FRAMES.queHacer).
  if (role === 'cover') return ['mapa-cuadrado']
  if (role === 'gallery' && galleryIndex >= 0) {
    return [galleryIndex < 2 ? 'experiencia-galeria-grande' : 'experiencia-galeria-pequena']
  }
  return []
}

// Patrimonio: la portada sale en la lista, en la ficha (y como primera foto de su galería) y,
// cuadrada, en el mapa; las fotos del carrusel de épocas, en la ficha; las de galería, en la galería.
// La portada sale en la lista, en el mapa y, si la ficha no tiene carrusel, junto al
// texto de la ficha (con carrusel, ahí va el carrusel, que no incluye la portada).
export function framesForHeritageImage({ role, hasCarousel = false }) {
  if (role === 'cover') {
    return ['patrimonio-lista', ...(hasCarousel ? [] : ['patrimonio-ficha']), 'mapa-cuadrado']
  }
  if (role === 'historic') return ['patrimonio-ficha']
  if (role === 'gallery') return ['patrimonio-galeria']
  return []
}

// Extras: una sola foto, cuadrada, en la lista y en la tarjeta del mapa.
export function framesForExtraImage() {
  return ['mapa-cuadrado']
}

// Espacios que se encuadran en Páginas, junto al selector donde se elige su foto (y no en
// la ficha): una foto puede sustituirse allí, así que el encuadre va con el selector.
export const PAGES_FRAMES = {
  // Qué hacer: las 3 primeras tarjetas son estrechas y desde la 4.ª, anchas; cada fila ofrece
  // solo el espacio que le toca según su posición.
  queHacer: (index) => [index < 3 ? 'experiencia-tarjeta' : 'experiencia-tarjeta-ancha'],
  listaTarjeta: ['tarjeta-lista'],
  destacadaVertical: ['destacada-vertical'],
  destacadaAncha: ['destacada-ancha'],
  inicioAcceso: ['inicio-acceso'],
  inicioExperiencia: (index) => [index === 0 ? 'inicio-experiencia-grande' : 'inicio-experiencia'],
  inicioEstablecimiento: ['inicio-establecimiento'],
  collageIr: (index) => [index === 0 ? 'collage-ir-alto' : 'collage-ir-bajo'],
  platos: (index) => [index === 0 ? 'platos-alto' : 'platos-bajo'],
  encuentraComer: ['encuentra-comer'],
  buscador: ['buscador-tarjeta'],
}
