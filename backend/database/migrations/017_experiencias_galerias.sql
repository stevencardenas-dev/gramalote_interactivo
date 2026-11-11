-- ============================================================================
-- 017 · Galerías oficiales de las experiencias
--
-- La migración 016 quedó con la lista de fotos pero sin el INSERT que las
-- enlazaba: se aplicó sin error y sin insertar nada, por eso Café Marquetalia,
-- las ruinas y Nuevo Gramalote seguían con una sola foto. Aquí se registran los
-- medios (idempotente por la clave única de ruta) y se enlazan como galería con
-- su orden, empezando en 2 porque el 1 es la portada.
-- ============================================================================

SET NAMES utf8mb4;

INSERT IGNORE INTO media (storage_disk, storage_path, public_url, mime_type, alt_text, source)
VALUES
  ('static', 'img/experiencias/marquetalia/sendero-bosque.webp',
   '/img/experiencias/marquetalia/sendero-bosque.webp', 'image/webp',
   'Sendero del café en el bosque', 'figma'),
  ('static', 'img/experiencias/marquetalia/entrada.webp',
   '/img/experiencias/marquetalia/entrada.webp', 'image/webp',
   'Acceso y letrero de Café Marquetalia', 'figma'),
  ('static', 'img/experiencias/marquetalia/zonas-verdes.webp',
   '/img/experiencias/marquetalia/zonas-verdes.webp', 'image/webp',
   'Zonas verdes de Café Marquetalia', 'figma'),
  ('static', 'img/experiencias/marquetalia/zona-recreativa.webp',
   '/img/experiencias/marquetalia/zona-recreativa.webp', 'image/webp',
   'Zona recreativa de Café Marquetalia', 'figma'),
  ('static', 'img/experiencias/marquetalia/kiosco.webp',
   '/img/experiencias/marquetalia/kiosco.webp', 'image/webp',
   'Kiosco de Café Marquetalia', 'figma'),
  ('static', 'img/experiencias/ruinas/panoramica-aerea.webp',
   '/img/experiencias/ruinas/panoramica-aerea.webp', 'image/webp',
   'Panorámica aérea de las ruinas del antiguo Gramalote', 'figma'),
  ('static', 'img/experiencias/ruinas/iglesia-lateral.webp',
   '/img/experiencias/ruinas/iglesia-lateral.webp', 'image/webp',
   'Iglesia en ruinas vista lateral', 'figma'),
  ('static', 'img/experiencias/ruinas/iglesia-lateral-2.webp',
   '/img/experiencias/ruinas/iglesia-lateral-2.webp', 'image/webp',
   'Iglesia en ruinas desde otro ángulo lateral', 'figma'),
  ('static', 'img/experiencias/ruinas/iglesia-montanas.webp',
   '/img/experiencias/ruinas/iglesia-montanas.webp', 'image/webp',
   'Iglesia en ruinas entre las montañas', 'figma'),
  ('static', 'img/experiencias/ruinas/vista-aerea.webp',
   '/img/experiencias/ruinas/vista-aerea.webp', 'image/webp',
   'Vista aérea de las ruinas y su entorno', 'figma'),
  ('static', 'img/experiencias/nuevo-gramalote/plaza-aerea.webp',
   '/img/experiencias/nuevo-gramalote/plaza-aerea.webp', 'image/webp',
   'Vista aérea de la plaza de Nuevo Gramalote', 'figma'),
  ('static', 'img/experiencias/nuevo-gramalote/viviendas.webp',
   '/img/experiencias/nuevo-gramalote/viviendas.webp', 'image/webp',
   'Viviendas de Nuevo Gramalote', 'figma'),
  ('static', 'img/experiencias/nuevo-gramalote/calle-colorida.webp',
   '/img/experiencias/nuevo-gramalote/calle-colorida.webp', 'image/webp',
   'Calle colorida de Nuevo Gramalote entre las montañas', 'figma'),
  ('static', 'img/experiencias/nuevo-gramalote/espacio-publico.webp',
   '/img/experiencias/nuevo-gramalote/espacio-publico.webp', 'image/webp',
   'Espacio público de Nuevo Gramalote', 'figma'),
  ('static', 'img/experiencias/nuevo-gramalote/plaza-principal.webp',
   '/img/experiencias/nuevo-gramalote/plaza-principal.webp', 'image/webp',
   'Plaza principal de Nuevo Gramalote', 'figma');

INSERT IGNORE INTO experience_images (experience_id, media_id, role, sort_order)
SELECT x.id, m.id, 'gallery', i.sort_order
FROM (
  SELECT 'cafe-marquetalia' AS slug, '/img/experiencias/marquetalia/sendero-bosque.webp' AS url, 2 AS sort_order
  UNION ALL SELECT 'cafe-marquetalia', '/img/experiencias/marquetalia/entrada.webp', 3
  UNION ALL SELECT 'cafe-marquetalia', '/img/experiencias/marquetalia/zonas-verdes.webp', 4
  UNION ALL SELECT 'cafe-marquetalia', '/img/experiencias/marquetalia/zona-recreativa.webp', 5
  UNION ALL SELECT 'cafe-marquetalia', '/img/experiencias/marquetalia/kiosco.webp', 6
  UNION ALL SELECT 'ruinas-antiguo-gramalote', '/img/experiencias/ruinas/panoramica-aerea.webp', 2
  UNION ALL SELECT 'ruinas-antiguo-gramalote', '/img/experiencias/ruinas/iglesia-lateral.webp', 3
  UNION ALL SELECT 'ruinas-antiguo-gramalote', '/img/experiencias/ruinas/iglesia-lateral-2.webp', 4
  UNION ALL SELECT 'ruinas-antiguo-gramalote', '/img/experiencias/ruinas/iglesia-montanas.webp', 5
  UNION ALL SELECT 'ruinas-antiguo-gramalote', '/img/experiencias/ruinas/vista-aerea.webp', 6
  UNION ALL SELECT 'nuevo-gramalote', '/img/experiencias/nuevo-gramalote/plaza-aerea.webp', 2
  UNION ALL SELECT 'nuevo-gramalote', '/img/experiencias/nuevo-gramalote/viviendas.webp', 3
  UNION ALL SELECT 'nuevo-gramalote', '/img/experiencias/nuevo-gramalote/calle-colorida.webp', 4
  UNION ALL SELECT 'nuevo-gramalote', '/img/experiencias/nuevo-gramalote/espacio-publico.webp', 5
  UNION ALL SELECT 'nuevo-gramalote', '/img/experiencias/nuevo-gramalote/plaza-principal.webp', 6
) i
JOIN experiences x ON x.slug = i.slug
JOIN media m ON m.public_url = i.url AND m.storage_disk = 'static';
