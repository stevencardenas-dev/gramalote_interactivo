-- ============================================================================
-- 004 · Icono del mapa por establecimiento (entrega "Iconos mapa", 1 nov)
--
-- - `establishments.map_icon`: nombre del icono ilustrado que muestra el pin
--   (archivos /img/mapa/iconos/<icono>-1.svg y -2.svg del frontend). NULL = el
--   frontend lo deduce del tipo. Se cambia desde el panel.
-- - La vista pública lo expone para GET /api/map.
-- - Asignación inicial hecha a mano ficha por ficha; las que falten (fichas sin
--   publicar o creadas después) se completan según su tipo.
--
-- Idempotente: se puede aplicar sobre una base que ya tenga los cambios y no
-- pisa iconos ya elegidos en el panel.
-- ============================================================================

SET @has_map_icon := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'establishments'
    AND COLUMN_NAME = 'map_icon'
);
SET @sql := IF(
  @has_map_icon = 0,
  'ALTER TABLE establishments
     ADD COLUMN map_icon VARCHAR(40) NULL
       COMMENT ''Icono del pin en el mapa (/img/mapa/iconos)'' AFTER longitude',
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

-- Asignación manual (fichas publicadas al 1 de noviembre de 2026).
UPDATE establishments e
JOIN (
  SELECT 'bambu' AS slug, 'comidas-rapidas' AS icon
  UNION ALL SELECT 'dulce-paseo', 'cafeteria'
  UNION ALL SELECT 'dona-claudia', 'comidas-caseras'
  UNION ALL SELECT 'fresas-con-crema-carvajal', 'postres'
  UNION ALL SELECT 'la-comarca', 'heladeria'
  UNION ALL SELECT 'la-sazon-de-la-tia', 'comidas-caseras'
  UNION ALL SELECT 'loncheria-romero', 'comidas-ejecutivas'
  UNION ALL SELECT 'glamping-vista-antigua', 'glamping'
  UNION ALL SELECT 'verdeser-glampings', 'glamping'
  UNION ALL SELECT 'hostal-campestre-camino-real', 'hostal'
  UNION ALL SELECT 'hostal-luna-azul', 'hostal'
  UNION ALL SELECT 'casa-hiedra-hotel-boutique', 'hotel'
  UNION ALL SELECT 'cabanas-el-penon', 'cabana'
  UNION ALL SELECT 'chelinarte', 'artesanias'
  UNION ALL SELECT 'aroma-twins', 'artesanias'
  UNION ALL SELECT 'creaciones-martina', 'artesanias'
  UNION ALL SELECT 'mi-hermoso-eden', 'artesanias'
  UNION ALL SELECT 'maestros-de-la-madera', 'artesanias'
  UNION ALL SELECT 'mi-gordita-bella', 'artesanias'
  UNION ALL SELECT 'artelu', 'artesanias'
  UNION ALL SELECT 'bisuteria-mg', 'artesanias'
  UNION ALL SELECT 'caliopes', 'artesanias'
  UNION ALL SELECT 'sombreros-techa', 'artesanias'
  UNION ALL SELECT 'yawart', 'artesanias'
) a ON a.slug = e.slug
SET e.map_icon = a.icon
WHERE e.map_icon IS NULL;

-- El resto, según el tipo (o la categoría si no tiene tipo).
UPDATE establishments e
JOIN establishment_categories c ON c.id = e.category_id
LEFT JOIN establishment_types t ON t.id = e.type_id
SET e.map_icon = CASE
  WHEN t.slug = 'cafeteria' THEN 'cafeteria'
  WHEN t.slug = 'heladeria' THEN 'heladeria'
  WHEN t.slug = 'postres' THEN 'postres'
  WHEN t.slug = 'comidas-rapidas' THEN 'comidas-rapidas'
  WHEN t.slug IN ('comida-casera', 'comida-tipica') THEN 'comidas-caseras'
  WHEN t.slug = 'glamping' THEN 'glamping'
  WHEN t.slug = 'cabanas' THEN 'cabana'
  WHEN t.slug LIKE 'hostal%' THEN 'hostal'
  WHEN t.slug LIKE 'hotel%' THEN 'hotel'
  WHEN c.slug = 'comer' THEN 'restaurante'
  WHEN c.slug = 'dormir' THEN 'hotel'
  WHEN c.slug = 'comprar' THEN 'artesanias'
  ELSE NULL
END
WHERE e.map_icon IS NULL;
