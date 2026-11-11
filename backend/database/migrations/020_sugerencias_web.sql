-- ============================================================================
-- 020 · Las sugerencias de establecimientos se envían desde el propio sitio
--       (/sugerir) en lugar de un formulario de Google.
--
-- · establishment_suggestions.source admite 'web' (y queda por defecto); se
--   guarda la IP para revisar abusos.
-- · Se quitan de mail_settings las columnas del formulario de Google (estaban
--   recién creadas y vacías).
-- ============================================================================

SET NAMES utf8mb4;

ALTER TABLE establishment_suggestions
  MODIFY COLUMN source ENUM('web','google_form') NOT NULL DEFAULT 'web',
  ADD COLUMN ip_address VARCHAR(45) NULL AFTER suggester_email;

ALTER TABLE mail_settings
  DROP COLUMN form_url,
  DROP COLUMN form_secret_enc;
