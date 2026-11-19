-- ============================================================================
-- 034 · Cómo se ve el horario de un establecimiento
--
-- «text»:  el horario es el texto plano y sale en la franja de datos.
-- «table»: el horario es el cuadro por días (con excepciones) bajo la franja.
-- Las fichas que ya tienen horario por día quedan en «table»; el resto, «text».
-- ============================================================================

SET NAMES utf8mb4;

SET @has := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'establishments' AND COLUMN_NAME = 'hours_display');
SET @sql := IF(@has = 0,
  "ALTER TABLE establishments ADD COLUMN hours_display ENUM('text', 'table') NOT NULL DEFAULT 'text' AFTER hours_text",
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE establishments e
SET e.hours_display = 'table'
WHERE @has = 0
  AND EXISTS (SELECT 1 FROM opening_hours h WHERE h.establishment_id = e.id);
