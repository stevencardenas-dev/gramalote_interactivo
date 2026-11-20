-- ============================================================================
-- 037 · Encuadre de las fotos por espacio
--
-- Un mismo archivo se muestra en espacios de proporciones distintas (por ejemplo,
-- los cinco espacios del collage de «Dónde dormir»). Cada foto guarda un encuadre
-- por espacio en `crop_frames`, un JSON {"<espacio>": {"w": …, "l": …, "t": …}}
-- con el ancho de la foto y su posición, en % del marco. Lo que no cubre la foto
-- se rellena en el sitio con ella misma desenfocada.
-- NULL = sin encuadre propio: se mantiene el comportamiento automático.
-- ============================================================================

SET NAMES utf8mb4;

SET @has := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'media' AND COLUMN_NAME = 'crop_frames');
SET @sql := IF(@has = 0,
  'ALTER TABLE media ADD COLUMN crop_frames TEXT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
