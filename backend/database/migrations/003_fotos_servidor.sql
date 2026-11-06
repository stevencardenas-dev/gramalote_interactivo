-- ============================================================================
-- 003 · Fotos de las fichas en el servidor (Fase 2)
--
-- - Rol `hero` para la foto ancha del encabezado de la ficha; la `cover` sigue
--   siendo la de las tarjetas de los listados.
-- - Cada plato o servicio destacado (`establishment_features`) puede tener su
--   propia foto, igual que ya pasaba con los productos.
--
-- Idempotente: se puede aplicar sobre una base que ya tenga los cambios.
-- ============================================================================

ALTER TABLE establishment_images
  MODIFY role ENUM('cover', 'hero', 'gallery', 'logo') NOT NULL DEFAULT 'gallery';

SET @has_feature_media := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'establishment_features'
    AND COLUMN_NAME = 'media_id'
);
SET @sql := IF(
  @has_feature_media = 0,
  'ALTER TABLE establishment_features
     ADD COLUMN media_id BIGINT UNSIGNED NULL AFTER icon,
     ADD KEY idx_establishment_features_media (media_id),
     ADD CONSTRAINT fk_establishment_features_media
       FOREIGN KEY (media_id) REFERENCES media (id)
       ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
