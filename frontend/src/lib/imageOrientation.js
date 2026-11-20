// Marca cada <img> con data-orient="portrait" (vertical) o "landscape" cuando
// carga, para que el CSS trate distinto las fotos verticales (que se muestran
// completas sobre fondo crema) y las horizontales (que llenan su marco).
function tag(img) {
  if (img.naturalWidth && img.naturalHeight) {
    img.dataset.orient = img.naturalHeight > img.naturalWidth ? 'portrait' : 'landscape'
  }
  frame(img)
}

// Marcos de contenido donde la foto se ve completa (contain) y el hueco que deja
// su proporción se rellena con la misma foto desenfocada (ver mejoras.css,
// [data-blur]). Quedan fuera los héroes y fondos a todo ancho, que siguen
// llenando el marco (cover), igual que las tarjetas PlaceCard (.place-card__media),
// cuyo texto va sobre la foto.
const FRAMED = [
  '.his-card__media',
  '.his-explore__card',
  '.his-event__media',
  '.his-row__media',
  '.his-ficha__media',
  '.his-story-card__cols',
  '.his-mapview__card',
  '.his-tl__media',
  '.explore-block__media',
  '.listing-card-v__media',
  '.story-related__card',
  '.photo:not(.place-card__media)',
]
  .map((frame) => `${frame} > img, ${frame} > picture > img`)
  .join(', ')

// Collages de las páginas de categoría: las fotos llenan su marco (cover).
const EXCLUDED = '.photo-collage'

function frame(img) {
  const parent = img.parentElement
  if (!parent || !img.matches(FRAMED) || img.closest(EXCLUDED)) return
  const holder = parent.tagName === 'PICTURE' ? parent.parentElement : parent
  const src = img.currentSrc || img.src
  if (!src) return
  holder.dataset.blur = ''
  holder.style.setProperty('--blur-img', `url("${src}")`)
}

export function initImageOrientation() {
  if (typeof document === 'undefined') return
  // 'load' no burbujea, pero sí se captura en document.
  document.addEventListener(
    'load',
    (event) => {
      if (event.target instanceof HTMLImageElement) tag(event.target)
    },
    true,
  )
  // Imágenes que ya estaban cargadas al insertarse (caché).
  new MutationObserver((records) => {
    records.forEach((record) =>
      record.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return
        if (node instanceof HTMLImageElement) tag(node)
        else node.querySelectorAll('img').forEach(tag)
      }),
    )
  }).observe(document.body, { childList: true, subtree: true })
  document.querySelectorAll('img').forEach(tag)
}
