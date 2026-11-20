// Reglas de las fotos que se suben desde el panel: una sola fuente para el campo de
// archivo, el texto de ayuda y la comprobación previa en el navegador.
// El servidor las vuelve a comprobar (backend/src/media.js): tamaño mínimo de
// 200 × 200 px y peso máximo en MEDIA_MAX_UPLOAD_MB (8 MB por defecto).
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp'
export const IMAGE_MAX_MB = 8
// Versión corta, para ponerla junto al botón de subir sin alargar los textos.
export const IMAGE_RULES_SHORT = `JPG, PNG o WebP · mín. 200 × 200 px · máx. ${IMAGE_MAX_MB} MB`
export const IMAGE_RULES = `JPG, PNG o WebP, de al menos 200 × 200 px y hasta ${IMAGE_MAX_MB} MB.`

const TYPES = new Set(IMAGE_ACCEPT.split(','))

// Devuelve el motivo si algún archivo no sirve ('' si todos valen). Las dimensiones
// las comprueba el servidor, que ya tiene la imagen decodificada.
export function checkImageFiles(files) {
  for (const file of files) {
    if (!TYPES.has(file.type)) return `«${file.name}» no es JPG, PNG ni WebP.`
    if (file.size > IMAGE_MAX_MB * 1024 * 1024) return `«${file.name}» pesa más de ${IMAGE_MAX_MB} MB.`
  }
  return ''
}
