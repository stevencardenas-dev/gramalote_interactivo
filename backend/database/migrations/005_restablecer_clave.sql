-- ============================================================================
-- 005 · Restablecer contraseña y gestión de usuarios del panel
--
-- · admin_password_resets guarda solo el hash SHA-256 del enlace; el token
--   original se muestra una vez (lo genera un admin o lo pide el propio usuario).
-- · Los roles siguen siendo 'admin' (todo, incluye usuarios y publicar) y
--   'editor' (edita fichas, no publica ni gestiona usuarios).
-- ============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS admin_password_resets (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  token_hash  CHAR(64) NOT NULL COMMENT 'SHA-256 del token; no guardar el token original',
  expires_at  DATETIME NOT NULL,
  used_at     DATETIME NULL,
  created_by  BIGINT UNSIGNED NULL COMMENT 'Admin que generó el enlace; NULL si lo pidió el propio usuario',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_password_reset_token (token_hash),
  KEY idx_admin_password_reset_user (user_id, expires_at),
  CONSTRAINT fk_admin_password_reset_user
    FOREIGN KEY (user_id) REFERENCES admin_users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
