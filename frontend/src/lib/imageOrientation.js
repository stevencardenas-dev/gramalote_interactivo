import { getCrop, loadCrops, onCropsChange } from './mediaCrops.js'
import { frameOfElement } from './photoFrames.js'

// Marca cada <img> con data-orient="portrait" (vertical) o "landscape" cuando
// carga, para que el CSS trate distinto las fotos verticales (que se muestran
// completas sobre fondo crema) y las horizontales (que llenan su marco).
function tag(img) {
  // Las vistas previas del panel dibujan su propio encuadre.
  if (img.hasAttribute('data-no-crop')) return
  if (img.naturalWidth && img.naturalHeight) {
    img.dataset.orient = img.naturalHeight > img.naturalWidth ? 'portrait' : 'landscape'
  }
  const frameKey = frameOfElement(img)
  const crop = frameKey ? getCrop(img.currentSrc || img.src, frameKey) : null
  if (crop) applyCrop(img, crop)
  else if (img.dataset.crop) clearCrop(img)
  if (!crop) frame(img)
}

function holderOf(img) {
  const parent = img.parentElement
  if (!parent) return null
  return parent.tagName === 'PICTURE' ? parent.parentElement : parent
}

// Encuadre definido en el panel para el espacio de esta foto: la foto se coloca con
// su ancho y posición (en % del marco) y lo que no cubre se rellena con ella misma
// desenfocada (el marco ya lleva data-blur, ver mejoras.css).
function applyCrop(img, crop) {
  const holder = holderOf(img)
  const src = img.currentSrc || img.src
  img.dataset.crop = ''
  if (holder && src) {
    holder.setAttribute('data-blur', '')
    holder.style.setProperty('--blur-img', `url("${src}")`)
    holder.style.overflow = 'hidden'
  }
  const set = (property, value) => img.style.setProperty(property, value, 'important')
  set('position', 'absolute')
  set('width', `${crop.w}%`)
  set('height', 'auto')
  set('left', `${crop.l}%`)
  set('top', `${crop.t}%`)
  set('max-width', 'none')
  set('object-fit', 'fill')
}

function clearCrop(img) {
  delete img.dataset.crop
  for (const property of ['position', 'width', 'height', 'left', 'top', 'max-width', 'object-fit']) {
    img.style.removeProperty(property)
  }
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

// Collages de categoría y páginas de Curiosidades (lista .facet y detalle .story):
// las fotos llenan su marco (cover), sin relleno desenfocado.
const EXCLUDED = '.photo-collage, .facet, .story'

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
  // Los encuadres llegan después: se vuelven a aplicar a lo ya pintado.
  onCropsChange(() => document.querySelectorAll('img').forEach(tag))
  loadCrops()
}
