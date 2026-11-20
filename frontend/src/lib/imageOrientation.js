// Marca cada <img> con data-orient="portrait" (vertical) o "landscape" cuando
// carga, para que el CSS trate distinto las fotos verticales (que se muestran
// completas sobre fondo crema) y las horizontales (que llenan su marco).
function tag(img) {
  if (img.naturalWidth && img.naturalHeight) {
    img.dataset.orient = img.naturalHeight > img.naturalWidth ? 'portrait' : 'landscape'
  }
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
