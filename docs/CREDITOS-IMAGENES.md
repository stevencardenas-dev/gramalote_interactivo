# Créditos de imágenes de stock o generadas

Registro de las imágenes que **no** son fotos propias ni entregadas por la
Alcaldía. Cada una debe reemplazarse por una foto real cuando exista.

## El Sabor Gramalotero (ficha 26 de la Matriz)

- **Ficha:** `el-sabor-gramalotero` (EST-027, Dónde comer · Restaurante).
- **Motivo:** la Matriz del 30 de octubre la marcaba «pendiente de la Alcaldía» y
  era la única ficha con datos completos que no estaba publicada (25 listas + esta
  = 26). No hay fotos del local.
- **Tipo:** imagen de stock (no generada con IA), de una hamburguesa con papas,
  elegida porque su carta es de hamburguesas, papas y perros calientes. **No es una
  foto del local ni de sus platos.**
- **Origen:** Wikimedia Commons, «20260916 Minsk Vasilki Burger.jpg»  
  <https://commons.wikimedia.org/wiki/File:20260916_Minsk_Vasilki_Burger.jpg>
- **Autor:** Sergey A. Demidov
- **Licencia:** CC BY 4.0 (<https://creativecommons.org/licenses/by/4.0>): se puede
  usar y recortar citando al autor y la licencia.
- **Modificaciones:** recortes a 1000×1000 (portada) y 1440×760 (encabezado). Sin
  retoques de color.
- **Archivos:** `backend/database/media-seed/establecimientos/el-sabor-gramalotero-card.jpg`
  y `el-sabor-gramalotero-hero.jpg`, declarados en `establecimientos.json`.
- **Crédito en el sitio:** se guarda en el campo «Crédito» de la imagen
  («Imagen de referencia: Sergey A. Demidov, CC BY 4.0, Wikimedia Commons»); texto
  alternativo: «Hamburguesa con papas fritas (imagen de referencia)».
- **Cómo se aplica:** la migración `009_sabor_gramalotero_publicada.sql` publica la
  ficha y `npm run media:import` (en cada despliegue) carga las fotos porque la
  ficha no tiene imágenes.
- **Reemplazo:** subir la foto real desde el panel (pestaña Imágenes de la ficha) y
  borrar esta imagen.
- **Pendiente:** coordenadas (la Matriz solo trae un enlace corto de Google Maps sin
  coordenadas); sin ellas no sale en el mapa.
