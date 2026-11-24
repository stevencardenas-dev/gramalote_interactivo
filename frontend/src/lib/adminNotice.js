// Avisos del panel desde sitios que se desmontan al terminar (como la ventana de encuadre,
// que se cierra al guardar). AdminToastHost, montado una vez en el panel, los muestra con el
// mismo aviso («popup») que usan las pantallas con useAdminToast.
export const ADMIN_NOTICE_EVENT = 'admin-notice'

export function showAdminNotice(tone, title, message) {
  window.dispatchEvent(new CustomEvent(ADMIN_NOTICE_EVENT, { detail: { tone, title, message } }))
}
