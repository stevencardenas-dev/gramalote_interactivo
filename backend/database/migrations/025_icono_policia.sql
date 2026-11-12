-- ============================================================================
-- 025 · Icono propio para la Estación de Policía (X_POLICIA)
--
-- La Matriz del 12 de noviembre (`Matriz_mapa_interactivo_lista 2 ver.xlsx`)
-- asigna el icono X_POLICIA a GR-046 y la entrega "ICONOS Final Version" trae
-- el SVG (`public/img/mapa/iconos/policia.svg`). Antes usaba el de la alcaldía
-- como provisional.
--
-- El punto sigue sin publicar (migración 024): la Matriz todavía no trae enlace
-- de Google Maps. Cuando llegue el pin solo hay que marcarlo publicado.
-- ============================================================================

SET NAMES utf8mb4;

UPDATE map_extras
SET map_icon = 'policia'
WHERE matrix_ref = 'GR-046' OR slug = 'estacion-de-policia';
