-- ============================================================================
-- 026 · Una sola sesión activa por cuenta
--
-- `session_version` sube cada vez que la cuenta abre sesión y también cuando un
-- administrador cambia su rol, la desactiva o le cambia el correo. El access
-- token lleva ese número (`sv`) y `requireAuth` lo compara con la base en cada
-- petición: la sesión anterior deja de servir al instante, sin esperar a que
-- venza el token (30 min).
--
-- Los refresh tokens de la sesión anterior se revocan en el mismo movimiento,
-- así que tampoco puede renovarse sola.
-- ============================================================================

SET NAMES utf8mb4;

ALTER TABLE admin_users
  ADD COLUMN session_version INT UNSIGNED NOT NULL DEFAULT 0
    COMMENT 'Sube al abrir sesión: invalida los access tokens anteriores'
    AFTER is_active;
