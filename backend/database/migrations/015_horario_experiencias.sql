-- ============================================================================
-- 015 · Horario de apertura de las experiencias
--
-- Guarda un único valor canónico por experiencia:
--   { "mode": "...", "days": { "1": [{ "opensAt": "08:00", "closesAt": "18:00" }] } }
-- `mode` es solo la forma en que se editó (todos los días, algunos días, cierre
-- común, varios turnos u horario por día); el mapa de días es lo que se lee.
-- `open_daily` se deriva de este horario desde la API, para el filtro «Abierto
-- hoy».
-- ============================================================================

SET NAMES utf8mb4;

SET @has_column := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'experiences'
    AND COLUMN_NAME = 'schedule_json'
);

SET @statement := IF(
  @has_column = 0,
  'ALTER TABLE experiences ADD COLUMN schedule_json JSON NULL COMMENT ''Horario de apertura: modo y días con sus turnos'' AFTER hours_text',
  'SELECT 1'
);

PREPARE apply_schedule FROM @statement;
EXECUTE apply_schedule;
DEALLOCATE PREPARE apply_schedule;
