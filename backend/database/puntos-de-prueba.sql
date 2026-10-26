-- Puntos de prueba para ver el mapa interactivo.
--
-- ATENCIÓN: los datos de este archivo son FICTICIOS. Las coordenadas están
-- inventadas (cerca de lat 7.89, lng -72.79) y NO corresponden a lugares reales.
-- No cargar en producción. Para borrarlos, ver los DELETE al final del archivo.
--
-- Uso (con el contenedor gramalote-mysql levantado):
--   docker exec -i gramalote-mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" gramalote' < database/puntos-de-prueba.sql
--
-- Requiere el seed.sql cargado (zonas, categorías y tipos).
-- Ids usados del seed: zones 1 = nuevo, 2 = viejo; establishment_categories
-- 1 = comer, 2 = dormir, 3 = comprar; establishment_types 2 = cafeteria,
-- 8 = glamping, 15 = regalos-manualidades; experience_categories 1 = naturaleza.

SET NAMES utf8mb4;

INSERT INTO establishments
  (slug, name, category_id, type_id, zone_id, location_detail, summary, description,
   address, latitude, longitude, hours_text, is_published, published_at)
VALUES
  ('prueba-mapa-comer', 'PRUEBA Cafetería del mapa', 1, 2, 1,
   'Dato de prueba',
   'Establecimiento ficticio para probar el marcador de la categoría comer.',
   'Registro de prueba. No es un lugar real y sus coordenadas son inventadas.',
   'Dirección ficticia', 7.8900000, -72.7900000,
   'Horario de prueba', 1, NOW()),
  ('prueba-mapa-dormir', 'PRUEBA Glamping del mapa', 2, 8, 2,
   'Dato de prueba',
   'Establecimiento ficticio para probar el marcador de la categoría dormir.',
   'Registro de prueba. No es un lugar real y sus coordenadas son inventadas.',
   'Dirección ficticia', 7.8930000, -72.7870000,
   'Horario de prueba', 1, NOW()),
  ('prueba-mapa-comprar', 'PRUEBA Tienda de regalos del mapa', 3, 15, 1,
   'Dato de prueba',
   'Establecimiento ficticio para probar el marcador de la categoría comprar.',
   'Registro de prueba. No es un lugar real y sus coordenadas son inventadas.',
   'Dirección ficticia', 7.8880000, -72.7930000,
   'Horario de prueba', 1, NOW());

INSERT INTO experiences
  (slug, title, category_id, summary, description, address, zone_id,
   latitude, longitude, hours_text, is_published, published_at)
VALUES
  ('prueba-mapa-experiencia', 'PRUEBA Sendero del mapa', 1,
   'Experiencia ficticia para probar el marcador de experiencias.',
   'Registro de prueba. No es un lugar real y sus coordenadas son inventadas.',
   'Dirección ficticia', 2, 7.8910000, -72.7960000,
   'Horario de prueba', 1, NOW());

-- Para borrar los datos de prueba, descomentar y ejecutar:
-- DELETE FROM establishments WHERE slug LIKE 'prueba-mapa-%';
-- DELETE FROM experiences    WHERE slug LIKE 'prueba-mapa-%';
