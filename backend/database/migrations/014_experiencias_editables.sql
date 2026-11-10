-- ============================================================================
-- 014 · Experiencias de «Qué hacer» editables desde /admin/experiencias
--
-- Añade los campos que muestra el frame QUE HACER (1 de noviembre): texto de
-- la tarjeta, línea de datos (tiempo · dificultad), «Abierto hoy», cómo
-- llegar, dificultad en texto libre, enlace de Google Maps e icono del pin.
-- Reemplaza las 3 fichas de prueba por las 5 experiencias oficiales
-- (frontend/src/data/experiences.js) con sus fotos y tips.
-- Las coordenadas son APROXIMADAS: revisarlas en el panel.
-- ============================================================================

SET NAMES utf8mb4;

ALTER TABLE experiences
  ADD COLUMN card_text       VARCHAR(600) NULL AFTER summary,
  ADD COLUMN meta_text       VARCHAR(255) NULL AFTER card_text,
  ADD COLUMN access_text     VARCHAR(255) NULL AFTER address,
  ADD COLUMN difficulty_text VARCHAR(80)  NULL AFTER difficulty,
  ADD COLUMN open_daily      BOOLEAN NOT NULL DEFAULT FALSE AFTER price_text,
  ADD COLUMN maps_url        VARCHAR(500) NULL AFTER longitude,
  ADD COLUMN map_icon        VARCHAR(40)  NULL AFTER maps_url;

INSERT IGNORE INTO experience_categories (id, slug, name, sort_order)
VALUES (6, 'patrimonio', 'Patrimonio', 6);

CREATE OR REPLACE VIEW v_public_experiences AS
SELECT
  x.id, x.slug, x.title,
  c.slug AS category_slug, c.name AS category_name,
  x.summary, x.card_text, x.meta_text, x.description,
  x.hours_text, x.address, x.access_text,
  z.slug AS zone_slug, z.name AS zone_name,
  x.latitude, x.longitude, x.maps_url, x.map_icon,
  x.parking_text, x.phone, x.whatsapp, x.email, x.website,
  x.duration_minutes, x.difficulty, x.difficulty_text, x.price_text,
  x.open_daily, x.is_featured, x.sort_order
FROM experiences x
LEFT JOIN experience_categories c ON c.id = x.category_id
LEFT JOIN zones z ON z.id = x.zone_id
WHERE x.is_published = 1 AND x.deleted_at IS NULL;

-- Contenido oficial ----------------------------------------------------------
DELETE FROM experience_establishments WHERE experience_id IN (1, 2, 3);
DELETE FROM experience_images WHERE experience_id IN (1, 2, 3);
DELETE FROM experience_tips WHERE experience_id IN (1, 2, 3);
DELETE FROM experiences WHERE id IN (1, 2, 3) AND slug IN ('cascadas-arco-iris', 'cafe-marquetalia', 'otro-sitio');

INSERT INTO experiences
  (id, slug, title, category_id, summary, card_text, meta_text, description,
   hours_text, address, access_text, zone_id, latitude, longitude, map_icon,
   phone, difficulty_text, price_text, open_daily, is_published, sort_order, published_at)
VALUES
  (1, 'pueblo-viejo', 'Pueblo Viejo', 6,
   'Vestigios de la primera cabecera municipal, a orillas de la quebrada Calderera.',
   'Caminar por el camino veredal, cruzar el puente de Pueblo Viejo, hoy puente del Divino Niño, y conocer los vestigios de la primera cabecera municipal, a orillas de la quebrada Calderera.',
   '30 min en vehículo · Dificultad media baja',
   'Caminar por el camino veredal, cruzar el puente de Pueblo Viejo, hoy puente del Divino Niño, y conocer los vestigios de la primera cabecera municipal, a orillas de la quebrada Calderera.',
   NULL, 'Pueblo Viejo, a orillas de la quebrada Calderera', '30 min en vehículo', NULL,
   7.8800000, -72.8050000, 'monumento', NULL, 'Media baja', NULL, 1, 1, 1, NOW()),
  (2, 'ruinas-antiguo-gramalote', 'Las ruinas del antiguo Gramalote', 6,
   'Lo que queda de la segunda cabecera municipal: la plaza de la Restauración, la torre, el kiosco y el samán.',
   'Recorrer en unas 2 horas lo que queda de la segunda cabecera municipal: la plaza de la Restauración, la torre, el kiosco y el samán.',
   '31 min en vehículo · Dificultad baja · Precaución: no entrar a las ruinas ni al antiguo templo',
   'Recorrer en unas 2 horas lo que queda de la segunda cabecera municipal: la plaza de la Restauración, la torre, el kiosco y el samán.',
   NULL, 'Gramalote Viejo', '31 min en vehículo', 2,
   7.8880000, -72.7980000, 'monumento', NULL, 'Baja', NULL, 1, 1, 2, NOW()),
  (3, 'nuevo-gramalote', 'Nuevo Gramalote', 6,
   'Paisajes panorámicos, murales, casa de la cultura, biblioteca, gastronomía, hospedaje y artesanías.',
   'Caminar hasta 3 horas entre paisajes panorámicos y murales, visitar la casa de la cultura y la biblioteca, y encontrar gastronomía, hospedaje y artesanías.',
   '1 h desde Cúcuta · Dificultad media alta · Entrada libre',
   'Caminar hasta 3 horas entre paisajes panorámicos y murales, visitar la casa de la cultura y la biblioteca, y encontrar gastronomía, hospedaje y artesanías.',
   NULL, 'Casco urbano de Gramalote', '1 h desde Cúcuta', 1,
   7.9174536, -72.7878984, 'monumento', NULL, 'Media alta', 'Entrada libre', 1, 1, 3, NOW()),
  (4, 'cascadas-arco-iris', 'Cascadas Arco Iris', 1,
   'Las Cascadas Arco Iris destacan por sus arcoíris naturales y el avistamiento nocturno de golondrinas en Gramalote.',
   'Ver los arcoíris que el sol forma entre las gotas de la quebrada y, de noche, avistar golondrinas. Está en la finca Limoncito, donde vivió el fundador Gregorio Montes.',
   '15 min en vehículo · Dificultad media alta',
   'Cascadas Arco Iris es un atractivo turístico del municipio de Gramalote, ubicado en la finca Limoncito, donde vivió sus últimos años el fundador Gregorio Montes. Cuando los rayos del sol entran en la espesura del entorno, cada gota de agua que cae roca abajo separa los colores de la luz y forma arcoíris. La quebrada siempre se conoció como Las Golondrinas, porque en ella posan estas aves, que se pueden avistar en horas nocturnas como plan adicional.',
   '9:00 a. m. – 6:00 p. m.', 'Finca Limoncito, vereda Valderrama', '15 min en vehículo', NULL,
   7.9260000, -72.7780000, 'cascada', '310 7881532', 'Media alta', '$5.000', 1, 1, 4, NOW()),
  (5, 'cafe-marquetalia', 'Café Marquetalia', 1,
   'Un lugar para descansar entre zonas verdes, tomar un café, acampar o alquilar la cocina para un asado.',
   'Tomar fotografías entre zonas verdes, descansar en hamacas y kioscos, tomar un café, acampar o alquilar la cocina para un asado o sancocho. No tiene restaurante.',
   '20 min en carro o moto · Dificultad media baja',
   'Café Marquetalia es un espacio para tomar fotografías entre zonas verdes, descansar en hamacas y kioscos y tomar un café. También se puede acampar o alquilar la cocina para hacer un asado o un sancocho. No tiene restaurante.',
   NULL, NULL, '20 min en carro o moto', NULL,
   7.9300000, -72.7960000, 'cafeteria', NULL, 'Media baja', NULL, 0, 1, 5, NOW());

INSERT INTO experience_tips (experience_id, icon, title, description, sort_order) VALUES
  (1, 'huellas', 'Cómo llegar', '30 minutos en vehículo.', 1),
  (1, 'camino', 'Dificultad', 'Media baja.', 2),
  (1, 'bolso', 'Recomendaciones', 'Lleva ropa cómoda, zapatos cerrados, agua, gorra y protector solar.', 3),
  (2, 'huellas', 'Cómo llegar', '31 minutos en vehículo. El recorrido toma unas 2 horas.', 1),
  (2, 'camino', 'Dificultad', 'Baja.', 2),
  (2, 'alerta', 'Precaución', 'No entres a las ruinas ni al antiguo templo.', 3),
  (2, 'bolso', 'Recomendaciones', 'Lleva ropa cómoda, zapatos cerrados, agua, gorra y protector solar.', 4),
  (3, 'huellas', 'Cómo llegar', '1 hora desde Cúcuta. Recorridos a pie de hasta 3 horas.', 1),
  (3, 'camino', 'Dificultad', 'Media alta.', 2),
  (3, 'bolso', 'Recomendaciones', 'Lleva ropa cómoda, zapatos cerrados, agua, gorra y protector solar.', 3),
  (4, 'huellas', 'Tiempo de caminata', 'Aproximadamente 50 minutos a pie desde la plaza principal.', 1),
  (4, 'camino', 'Dificultad', 'Media-alta. Se recomienda ir con guía y tener en cuenta las condiciones del acceso.', 2),
  (4, 'bolso', 'Recomendaciones', 'Lleva ropa cómoda, zapatos cerrados, agua, gorra y protector solar. No fumar. Hay parqueadero.', 3),
  (4, 'info', 'Estado del lugar', 'Abierto de 9:00 a. m. a 6:00 p. m. Antes de ir, consulta la información de acceso.', 4),
  (5, 'huellas', 'Cómo llegar', '20 minutos en carro o moto.', 1),
  (5, 'camino', 'Dificultad', 'Media baja.', 2),
  (5, 'bolso', 'Qué puedes hacer', 'Fotografías entre zonas verdes, hamacas y kioscos, café, camping y alquiler de cocina.', 3),
  (5, 'info', 'Ten en cuenta', 'No tiene restaurante: puedes alquilar la cocina para un asado o un sancocho.', 4);

-- Fotos del sitio (servidas por el frontend en /img) como medios externos.
INSERT INTO media (storage_disk, storage_path, public_url, mime_type, alt_text, source) VALUES
  ('static', 'img/que-hacer/pueblo-viejo.jpg', '/img/que-hacer/pueblo-viejo.jpg', 'image/jpeg', 'Pueblo Viejo', 'figma'),
  ('static', 'img/que-hacer/ruinas.jpg', '/img/que-hacer/ruinas.jpg', 'image/jpeg', 'Ruinas del antiguo Gramalote', 'figma'),
  ('static', 'img/que-hacer/nuevo-gramalote.jpg', '/img/que-hacer/nuevo-gramalote.jpg', 'image/jpeg', 'Nuevo Gramalote', 'figma'),
  ('static', 'img/experiencias/cascadas/hero.jpg', '/img/experiencias/cascadas/hero.jpg', 'image/jpeg', 'Cascadas Arco Iris', 'figma'),
  ('static', 'img/experiencias/cascadas/1.jpg', '/img/experiencias/cascadas/1.jpg', 'image/jpeg', 'Cascada entre paredes de roca cubiertas de musgo', 'figma'),
  ('static', 'img/experiencias/cascadas/2.jpg', '/img/experiencias/cascadas/2.jpg', 'image/jpeg', 'Letrero de Cascadas Arcoíris con alas de colores', 'figma'),
  ('static', 'img/experiencias/cascadas/3.jpg', '/img/experiencias/cascadas/3.jpg', 'image/jpeg', 'Salto de agua sobre una roca oscura', 'figma'),
  ('static', 'img/experiencias/cascadas/4.jpg', '/img/experiencias/cascadas/4.jpg', 'image/jpeg', 'Cascada que cae sobre una pared de roca', 'figma'),
  ('static', 'img/experiencias/cascadas/5.jpg', '/img/experiencias/cascadas/5.jpg', 'image/jpeg', 'Arcoíris sobre la cascada', 'figma'),
  ('static', 'img/que-hacer/marquetalia.jpg', '/img/que-hacer/marquetalia.jpg', 'image/jpeg', 'Entrada de Café Marquetalia entre la vegetación', 'figma');

INSERT INTO experience_images (experience_id, media_id, role, sort_order)
SELECT x.experience_id, m.id, x.role, x.sort_order
FROM (
  SELECT 1 AS experience_id, '/img/que-hacer/pueblo-viejo.jpg' AS url, 'cover' AS role, 1 AS sort_order
  UNION ALL SELECT 2, '/img/que-hacer/ruinas.jpg', 'cover', 1
  UNION ALL SELECT 3, '/img/que-hacer/nuevo-gramalote.jpg', 'cover', 1
  UNION ALL SELECT 4, '/img/experiencias/cascadas/hero.jpg', 'cover', 1
  UNION ALL SELECT 4, '/img/experiencias/cascadas/1.jpg', 'gallery', 2
  UNION ALL SELECT 4, '/img/experiencias/cascadas/2.jpg', 'gallery', 3
  UNION ALL SELECT 4, '/img/experiencias/cascadas/3.jpg', 'gallery', 4
  UNION ALL SELECT 4, '/img/experiencias/cascadas/4.jpg', 'gallery', 5
  UNION ALL SELECT 4, '/img/experiencias/cascadas/5.jpg', 'gallery', 6
  UNION ALL SELECT 5, '/img/que-hacer/marquetalia.jpg', 'cover', 1
) x
JOIN media m ON m.public_url = x.url AND m.storage_disk = 'static';
