-- ============================================================================
-- 022 · «Extras» (puntos complementarios) y datos de la Matriz vigente
--
-- · Extras son lugares del mapa sin ficha propia: se ubican con su pin y toda
--   su información se ve en la tarjeta del mapa. Solo se filtran por categoría.
-- · Los enlaces y las coordenadas salen de Matriz_mapa_interactivo_lista.xlsx,
--   que es la fuente definitiva de la ubicación de los lugares.
-- ============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS map_extras (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  matrix_ref   VARCHAR(16)  NULL COMMENT 'ID de la fila en la Matriz (GR-0xx)',
  slug         VARCHAR(160) NOT NULL,
  name         VARCHAR(180) NOT NULL,
  category     VARCHAR(80)  NOT NULL COMMENT 'Categoría de la Matriz (Institucional, Salud…)',
  zone         VARCHAR(120) NULL COMMENT 'Zona o referencia tal como está en la Matriz',
  latitude     DECIMAL(10, 7) NOT NULL,
  longitude    DECIMAL(10, 7) NOT NULL,
  maps_url     VARCHAR(500) NULL,
  map_icon     VARCHAR(40)  NOT NULL DEFAULT 'parque',
  sort_order   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_published TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_map_extras_slug (slug),
  UNIQUE KEY uq_map_extras_ref (matrix_ref),
  KEY idx_map_extras_published (is_published, sort_order)
) ENGINE=InnoDB COMMENT='Lugares del mapa sin ficha (puntos complementarios de la Matriz)';

INSERT INTO map_extras
  (matrix_ref, slug, name, category, zone, latitude, longitude, maps_url, map_icon, sort_order, is_published)
VALUES
  ('GR-044', 'cam-palacio-municipal', 'Centro Administrativo Municipal (CAM) / Palacio Municipal',
   'Institucional', 'Casco urbano nuevo', 7.9155988, -72.7870962,
   'https://maps.app.goo.gl/VEUq6SNCArNek41y5', 'alcaldia', 10, 1),
  ('GR-045', 'casa-de-la-cultura', 'Casa de la Cultura Francisco Márquez Acuña',
   'Cultural / institucional', 'Casco urbano nuevo', 7.9158291, -72.7874450,
   'https://maps.app.goo.gl/DhNZW4Zbcbwra3Uu9', 'casa-cultural', 20, 1),
  ('GR-046', 'estacion-de-policia', 'Estación de Policía',
   'Seguridad / servicios', 'Casco urbano nuevo', 7.9148500, -72.7865500,
   NULL, 'alcaldia', 30, 1),
  ('GR-047', 'centro-de-salud', 'Centro de salud',
   'Salud / servicios', 'Casco urbano nuevo', 7.8677537, -72.7780382,
   'https://maps.app.goo.gl/2eeRTh8VUYuPtKCUA', 'hospital', 40, 1),
  ('GR-048', 'banco-agrario', 'Banco Agrario',
   'Servicios financieros', 'Casco urbano nuevo', 7.9152200, -72.7860400,
   NULL, 'banco', 50, 1),
  ('GR-049', 'plaza-mayor', 'Plaza Mayor de Gramalote',
   'Espacio público', 'Casco urbano nuevo', 7.9154771, -72.7865937,
   'https://maps.app.goo.gl/Q14bYESgJLcvywYS6', 'parque-principal', 60, 1),
  ('GR-052', 'parque-gruta-de-la-virgen', 'Parque Gruta de la virgen',
   'Espacio público / religioso', 'Casco urbano nuevo', 7.9200837, -72.7876770,
   'https://maps.app.goo.gl/gms4pP9syYDRxnez8', 'parque', 70, 1),
  ('GR-053', 'parque-del-agua', 'Parque del Agua',
   'Espacio público', 'Casco urbano nuevo', 7.9207000, -72.7899000,
   NULL, 'parque', 80, 1),
  ('GR-054', 'polideportivo-san-rafael', 'Polideportivo San Rafael',
   'Deportivo', 'Casco urbano nuevo', 7.9203000, -72.7912000,
   NULL, 'polideportivo', 90, 1),
  ('GR-055', 'estadio-municipal', 'Estadio Municipal Manuel Grillo Martínez',
   'Deportivo', 'Casco urbano nuevo', 7.9204520, -72.7913188,
   'https://maps.app.goo.gl/SM9SZNYUc7tKXCPE7', 'polideportivo', 100, 1),
  ('GR-056', 'coliseo-municipal', 'Coliseo Municipal',
   'Deportivo', 'Casco urbano nuevo', 7.9209000, -72.7907000,
   'https://maps.app.goo.gl/uFpBEyAb7Pssixu46', 'polideportivo', 110, 1),
  ('GR-057', 'capilla-belen', 'Capilla Belén / Capilla Bethel',
   'Religioso', 'Casco urbano nuevo', 7.9136000, -72.7894000,
   NULL, 'capilla', 120, 1),
  ('GR-058', 'convento-clarisas', 'Convento de las Hermanas Clarisas',
   'Religioso / cultural', 'Casco urbano nuevo', 7.9141000, -72.7859000,
   NULL, 'templo', 130, 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), category = VALUES(category), zone = VALUES(zone),
  latitude = VALUES(latitude), longitude = VALUES(longitude),
  maps_url = VALUES(maps_url), map_icon = VALUES(map_icon),
  sort_order = VALUES(sort_order);

-- Enlaces de Google Maps e iconos de la Matriz para las fichas existentes.
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/DrCGnEaX1zBmuNCo6', map_icon = 'artesanias' WHERE slug = 'chelinarte';
UPDATE establishments SET maps_url = 'https://goo.gl/maps/dQrsFkoddANrJnp39?g_st=aw', map_icon = 'artesanias' WHERE slug = 'aroma-twins';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/ehyRV5mioxRwywZo9?g_st=aw', map_icon = 'artesanias' WHERE slug = 'creaciones-martina';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/MHGukjjsRGKqtAWU8', map_icon = 'artesanias' WHERE slug = 'artelu';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/TybsxhP41FmV7K5c7', map_icon = 'artesanias', latitude = 7.8878061, longitude = -72.7977203 WHERE slug = 'mi-hermoso-eden';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/VPjKg21ourmPn7oe8?g_st=ac', map_icon = 'artesanias' WHERE slug = 'maestros-de-la-madera';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/rR9wHgtbohSLvjf27', map_icon = 'artesanias' WHERE slug = 'mi-gordita-bella';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/voHDsvUZEh6YkZyd7', map_icon = 'artesanias', latitude = 7.9161530, longitude = -72.7849872 WHERE slug = 'sombreros-techa';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/cvy2fWm5Bq5WnSiq8', map_icon = 'artesanias', latitude = 7.9195026, longitude = -72.7847273 WHERE slug = 'yawart';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/oPZLLoPHZi9uMyWU6', map_icon = 'artesanias' WHERE slug = 'bisuteria-mg';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/ptDMgkYrtxUHvVoG8', map_icon = 'artesanias', latitude = 7.9083818, longitude = -72.8300350 WHERE slug = 'caliopes';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/oVCBUhjwWzb6cFto8', map_icon = 'restaurante' WHERE slug = 'bambu';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/ZXVopkUdMzZe2V9q7', map_icon = 'postres' WHERE slug = 'dulce-paseo';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/M6aVHjgHSzfPDk3g8', map_icon = 'restaurante', latitude = 7.9134677, longitude = -72.7878309 WHERE slug = 'dona-claudia';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/HLvNZZvtz9Q43vwV7?g_st=iwb', map_icon = 'postres' WHERE slug = 'fresas-con-crema-carvajal';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/1aaWSwijaVd4mGLg8', map_icon = 'restaurante', latitude = 7.9158217, longitude = -72.7877246 WHERE slug = 'la-comarca';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/FE7ZbaaKKMNKinFL9', map_icon = 'restaurante', latitude = 7.9160897, longitude = -72.7849374 WHERE slug = 'la-sazon-de-la-tia';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/PcaTnbbpk6W7oyBYA', map_icon = 'restaurante', latitude = 7.9152952, longitude = -72.7863224 WHERE slug = 'loncheria-romero';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/zyNKFGcNoDsZJb1a7', map_icon = 'restaurante', latitude = 7.9174536, longitude = -72.7878984 WHERE slug = 'origen-cocina-de-autor';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/xuXbDroVuvGcWA7r7?g_st=aw', map_icon = 'restaurante' WHERE slug = 'el-sabor-gramalotero';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/QAp5qP95DdBgxD9p6', map_icon = 'glamping' WHERE slug = 'glamping-vista-antigua';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/pZH1GZuR21EahNgb8', map_icon = 'glamping', latitude = 7.9224981, longitude = -72.7912941 WHERE slug = 'verdeser-glampings';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/qK2muShWAgKx3ubR6', map_icon = 'hostal', latitude = 7.9132202, longitude = -72.7845040 WHERE slug = 'hostal-campestre-camino-real';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/Hi4kNiXYXcehHawp8', map_icon = 'hostal', latitude = 7.9135814, longitude = -72.7880009 WHERE slug = 'hostal-luna-azul';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/fd4XChctj4WvHusz6', map_icon = 'hotel', latitude = 7.9187012, longitude = -72.7857360 WHERE slug = 'casa-hiedra-hotel-boutique';
UPDATE establishments SET maps_url = 'https://maps.app.goo.gl/ifqRu22kVdguAwPS6', map_icon = 'cabana', latitude = 7.8676839, longitude = -72.7786094 WHERE slug = 'cabanas-el-penon';

-- Enlaces de la Matriz para las experiencias que también son lugares del mapa.
UPDATE experiences SET maps_url = 'https://maps.app.goo.gl/s1xPm1492b1PPCFJ8' WHERE slug = 'nuevo-gramalote';
UPDATE experiences SET maps_url = 'https://maps.app.goo.gl/mhtTmzAU2BCD6jDaA' WHERE slug = 'ruinas-antiguo-gramalote';
UPDATE experiences SET maps_url = 'https://maps.app.goo.gl/3XFX8gu8kBgEoh47A' WHERE slug = 'cascadas-arco-iris';
UPDATE experiences SET maps_url = 'https://maps.app.goo.gl/MeVwqCSUXvWWEbLA' WHERE slug = 'cafe-marquetalia';
