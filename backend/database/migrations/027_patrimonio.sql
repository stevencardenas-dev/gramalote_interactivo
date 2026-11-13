-- Patrimonio del mapa (GR-001…GR-008 y GR-010…GR-013 de la Matriz del mapa).
-- La ficha pública todavía no existe: estas filas alimentan el pin y la tarjeta
-- del mapa, y el panel ya permite completar resumen y descripción.
--
-- Las coordenadas salen del enlace de Google Maps de cada fila. Cuando el enlace
-- de la matriz no resuelve al bien (GR-008, GR-010 y GR-013), se usa un punto
-- aproximado dentro de su zona; el enlace original se conserva para que el
-- administrador pueda ajustar el pin al cargar la ficha.

CREATE TABLE IF NOT EXISTS heritage_sites (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  matrix_ref   VARCHAR(16) NULL,
  slug         VARCHAR(180) NOT NULL,
  name         VARCHAR(180) NOT NULL,
  category     VARCHAR(80) NOT NULL,
  zone         VARCHAR(120) NULL,
  latitude     DECIMAL(10, 7) NOT NULL,
  longitude    DECIMAL(10, 7) NOT NULL,
  maps_url     VARCHAR(500) NULL,
  map_icon     VARCHAR(40) NOT NULL DEFAULT 'monumento',
  summary      VARCHAR(320) NULL,
  description  TEXT NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  sort_order   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_heritage_matrix_ref (matrix_ref),
  UNIQUE KEY uq_heritage_slug (slug),
  KEY idx_heritage_published (is_published, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO heritage_sites
  (matrix_ref, slug, name, category, zone, latitude, longitude, maps_url, map_icon, sort_order, is_published)
VALUES
  ('GR-001', 'templo-san-rafael-antiguo', 'Templo de San Rafael antiguo', 'Histórico', 'Gramalote Viejo', 7.8888743, -72.7978318, 'https://maps.app.goo.gl/ThZgudsNGKhbZf2c8', 'templo', 10, 1),
  ('GR-002', 'templo-san-rafael-arcangel', 'Templo San Rafael Arcángel', 'Religioso', 'Gramalote Nuevo', 7.9161523, -72.7860123, 'https://maps.app.goo.gl/K7D5x8YcVH4LNmsQ8', 'templo', 20, 1),
  ('GR-003', 'plaza-de-la-restauracion', 'Plaza de la Restauración', 'Espacio público', 'Gramalote Nuevo', 7.9154771, -72.7865937, 'https://maps.app.goo.gl/aYVe7HsQt7FJEPZV6', 'parque-principal', 30, 1),
  ('GR-004', 'casa-municipal-gregorio-montes', 'Casa Municipal Gregorio Montes', 'Institucional', 'Gramalote Nuevo', 7.8886254, -72.7981812, 'https://maps.app.goo.gl/9xsMX9KDFJYgKWMd7', 'alcaldia', 40, 1),
  ('GR-005', 'puente-cuervo', 'Puente Cuervo', 'Histórico', 'Gramalote Viejo / rural', 7.8851011, -72.7939390, 'https://maps.app.goo.gl/gDAeBfpcjWaGHKWf6', 'puentes', 50, 1),
  ('GR-006', 'hospital-san-vicente-de-paul', 'Hospital San Vicente de Paúl', 'Salud', 'Gramalote Viejo', 7.9141460, -72.7872526, 'https://maps.app.goo.gl/kP7R8drs9PrDULjs5', 'hospital', 60, 1),
  ('GR-007', 'colegio-sagrado-corazon-de-jesus', 'Colegio Sagrado Corazón de Jesús', 'Educativo', 'Gramalote Viejo', 7.9148731, -72.7883649, 'https://maps.app.goo.gl/E569mY89DG6AsPgb7', 'colegio', 70, 1),
  ('GR-008', 'capilla-bethlemita', 'Capilla Bethlemita', 'Religioso', 'Gramalote Viejo', 7.8884500, -72.7972500, 'https://maps.app.goo.gl/YqZGKan3MpQvM7Dk6', 'capilla', 80, 1),
  ('GR-010', 'estatua-de-secundino-jacome', 'Estatua de Secundino Jácome', 'Monumento', 'Gramalote Nuevo', 7.9159000, -72.7861000, 'https://maps.app.goo.gl/itwtwRQNMGM4MbuDA', 'monumento', 100, 1),
  ('GR-011', 'estatua-de-laureano-gomez', 'Estatua de Laureano Gómez', 'Monumento', 'Gramalote Nuevo', 7.9156310, -72.7863620, 'https://maps.app.goo.gl/ZSTwUqccSi1KSTAF9', 'monumento', 110, 1),
  ('GR-012', 'diosa-de-la-fuente', 'Diosa de la Fuente', 'Monumento', 'Gramalote Nuevo', 7.9154420, -72.7868180, 'https://maps.app.goo.gl/MmKW4C8SE9kwmXfLA', 'monumento', 120, 1),
  ('GR-013', 'puente-gregorio-montes', 'Puente Gregorio Montes', 'Histórico', 'Gramalote Viejo / rural', 7.9015955, -72.7983908, 'https://maps.app.goo.gl/QFZ1AnYq5ZVgRULm8', 'puentes', 130, 1);
