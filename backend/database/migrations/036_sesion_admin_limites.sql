-- ============================================================================
-- 036 · Duración de las sesiones del panel
--
-- Cada token de renovación guarda cuándo empezó la sesión, y lo conserva al
-- renovarse. Así la API cierra la sesión tras 30 min sin uso (AUTH_IDLE_MINUTES)
-- y, aunque se use, a las 8 h del inicio (AUTH_MAX_HOURS).
-- Los tokens anteriores no lo tienen: se toma su created_at.
-- ============================================================================

SET NAMES utf8mb4;

SET @has := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_refresh_tokens' AND COLUMN_NAME = 'session_started_at');
SET @sql := IF(@has = 0,
  'ALTER TABLE admin_refresh_tokens ADD COLUMN session_started_at DATETIME NULL AFTER expires_at',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
