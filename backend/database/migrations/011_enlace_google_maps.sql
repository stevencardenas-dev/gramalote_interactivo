-- ============================================================================
-- 011 · Enlace de Google Maps por establecimiento
--
-- `establishments.maps_url`: enlace a la ficha del lugar en Google Maps. Si está,
-- el botón «Ver ubicación en el mapa» lo usa; si no, se deduce de las
-- coordenadas. Se edita desde el panel. Idempotente.
-- ============================================================================

SET @has_maps_url := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'establishments'
    AND COLUMN_NAME = 'maps_url'
);
SET @sql := IF(
  @has_maps_url = 0,
  'ALTER TABLE establishments
     ADD COLUMN maps_url VARCHAR(500) NULL
       COMMENT ''Enlace a Google Maps (si falta, se usan las coordenadas)'' AFTER map_icon',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE OR REPLACE VIEW v_public_establishments AS
SELECT
  e.id,
  e.slug,
  e.name,
  c.slug AS category_slug,
  c.name AS category_name,
  t.slug AS type_slug,
  t.name AS type_name,
  t.filter_group,
  z.slug AS zone_slug,
  z.name AS zone_name,
  e.location_detail,
  e.summary,
  e.description,
  e.address,
  e.latitude,
  e.longitude,
  e.map_icon,
  e.maps_url,
  e.phone,
  e.whatsapp,
  e.email,
  e.website,
  e.hours_text,
  e.checkin_text,
  e.price_text,
  e.price_min_cop,
  e.price_max_cop,
  e.is_featured,
  e.sort_order
FROM establishments e
JOIN establishment_categories c ON c.id = e.category_id
LEFT JOIN establishment_types t ON t.id = e.type_id
LEFT JOIN zones z ON z.id = e.zone_id
WHERE e.is_published = 1 AND e.deleted_at IS NULL;
