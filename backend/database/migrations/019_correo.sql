-- ============================================================================
-- 019 · Correo saliente (Gmail por SMTP), confirmación de calificaciones y
--       sugerencias de establecimientos recibidas desde un formulario de Google
--
-- · mail_settings: una sola fila (id = 1) que el administrador edita en
--   Panel › Correo. La contraseña de aplicación y el secreto del formulario se
--   guardan cifrados (AES-256-GCM con una llave derivada de JWT_SECRET o
--   MAIL_SECRET_KEY). NO va en site_settings: esa tabla es pública (/api/site).
-- · ratings: una calificación nueva queda «pending» hasta que se abre el enlace
--   del correo; el promedio (rating_stats) solo cuenta las «confirmed». Si
--   alguien ya confirmado vuelve a votar, el voto nuevo espera en pending_stars.
--   Las calificaciones existentes quedan confirmadas.
-- · establishment_suggestions: lo que llega del formulario de Google (webhook
--   de Apps Script) para revisarlo en Panel › Sugerencias.
-- · mail_log: últimos envíos (para ver en el panel si algo falla).
-- ============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS mail_settings (
  id                   TINYINT UNSIGNED NOT NULL,
  enabled              TINYINT(1) NOT NULL DEFAULT 0,
  from_email           VARCHAR(190) NULL,
  from_name            VARCHAR(120) NULL,
  smtp_host            VARCHAR(190) NOT NULL DEFAULT 'smtp.gmail.com',
  smtp_port            SMALLINT UNSIGNED NOT NULL DEFAULT 465,
  smtp_secure          TINYINT(1) NOT NULL DEFAULT 1,
  smtp_user            VARCHAR(190) NULL,
  smtp_password_enc    TEXT NULL,
  reply_to             VARCHAR(190) NULL,
  notify_email         VARCHAR(500) NULL COMMENT 'Avisos internos; varios separados por coma',
  site_url             VARCHAR(255) NULL COMMENT 'Base de los enlaces de los correos',
  rating_confirmation  TINYINT(1) NOT NULL DEFAULT 1,
  form_url             VARCHAR(500) NULL COMMENT 'Enlace público del formulario de Google',
  form_secret_enc      TEXT NULL,
  updated_by           BIGINT UNSIGNED NULL,
  updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT IGNORE INTO mail_settings (id, from_name) VALUES (1, 'Gramalote Interactivo');

CREATE TABLE IF NOT EXISTS mail_log (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  kind       VARCHAR(40) NOT NULL,
  to_email   VARCHAR(500) NOT NULL,
  subject    VARCHAR(255) NOT NULL,
  status     ENUM('sent','failed') NOT NULL,
  error      VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_mail_log_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE ratings
  ADD COLUMN status ENUM('pending','confirmed') NOT NULL DEFAULT 'confirmed' AFTER stars,
  ADD COLUMN pending_stars TINYINT UNSIGNED NULL AFTER status,
  ADD COLUMN pending_name VARCHAR(80) NULL AFTER pending_stars,
  ADD COLUMN confirm_token_hash CHAR(64) NULL AFTER pending_name,
  ADD COLUMN confirm_expires_at DATETIME NULL AFTER confirm_token_hash,
  ADD COLUMN confirmed_at DATETIME NULL AFTER confirm_expires_at,
  ADD UNIQUE KEY uq_rating_confirm_token (confirm_token_hash);

UPDATE ratings SET confirmed_at = COALESCE(confirmed_at, updated_at) WHERE status = 'confirmed';

DROP TRIGGER IF EXISTS trg_ratings_ai;
DROP TRIGGER IF EXISTS trg_ratings_au;
DROP TRIGGER IF EXISTS trg_ratings_ad;

CREATE TRIGGER trg_ratings_ai AFTER INSERT ON ratings FOR EACH ROW
  REPLACE INTO rating_stats (target_type, target_id, average, votes)
  SELECT NEW.target_type, NEW.target_id, COALESCE(ROUND(AVG(stars), 2), 0), COUNT(*)
  FROM ratings WHERE target_type = NEW.target_type AND target_id = NEW.target_id AND status = 'confirmed';

CREATE TRIGGER trg_ratings_au AFTER UPDATE ON ratings FOR EACH ROW
  REPLACE INTO rating_stats (target_type, target_id, average, votes)
  SELECT NEW.target_type, NEW.target_id, COALESCE(ROUND(AVG(stars), 2), 0), COUNT(*)
  FROM ratings WHERE target_type = NEW.target_type AND target_id = NEW.target_id AND status = 'confirmed';

CREATE TRIGGER trg_ratings_ad AFTER DELETE ON ratings FOR EACH ROW
  REPLACE INTO rating_stats (target_type, target_id, average, votes)
  SELECT OLD.target_type, OLD.target_id, COALESCE(ROUND(AVG(stars), 2), 0), COUNT(*)
  FROM ratings WHERE target_type = OLD.target_type AND target_id = OLD.target_id AND status = 'confirmed';

CREATE TABLE IF NOT EXISTS establishment_suggestions (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  source          ENUM('google_form') NOT NULL DEFAULT 'google_form',
  response_id     VARCHAR(190) NULL COMMENT 'Id de la respuesta en Google Forms (evita duplicados)',
  business_name   VARCHAR(190) NOT NULL,
  business_type   VARCHAR(120) NULL,
  address         VARCHAR(500) NULL,
  phone           VARCHAR(120) NULL,
  links           VARCHAR(500) NULL,
  reason          TEXT NULL,
  is_owner        VARCHAR(40) NULL,
  suggester_name  VARCHAR(160) NULL,
  suggester_email VARCHAR(190) NULL,
  raw_answers     JSON NULL,
  status          ENUM('nueva','revisada','agregada','descartada') NOT NULL DEFAULT 'nueva',
  admin_note      VARCHAR(500) NULL,
  submitted_at    DATETIME NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_suggestion_response (response_id),
  KEY idx_suggestion_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
