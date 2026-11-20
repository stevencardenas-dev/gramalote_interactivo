// Avisos de las operaciones con fotos del panel: el mismo texto (título y mensaje) en
// Establecimientos, Experiencias, Patrimonio y Extras. En el panel se habla de «fotos»,
// no de «imágenes», salvo en los nombres de las pestañas y secciones.
//   notify('ok', ...PHOTO_NOTICE.updated)
export const PHOTO_NOTICE = {
  uploaded: (count = 1) =>
    count === 1 ? ['Foto subida', 'Ya forma parte de la ficha.'] : [`${count} fotos subidas`, 'Ya forman parte de la ficha.'],
  updated: ['Foto actualizada', 'Los cambios de la foto quedaron guardados.'],
  replaced: ['Foto cambiada', 'Se mantuvieron su uso, su orden y sus textos.'],
  removed: ['Foto quitada', 'Dejó de verse en la ficha.'],
}
