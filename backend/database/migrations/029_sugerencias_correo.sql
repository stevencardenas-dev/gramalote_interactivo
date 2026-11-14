-- ============================================================================
-- 029 · Verificación del correo en las sugerencias
--
-- Igual que en las calificaciones: la primera vez que un correo envía una
-- sugerencia se le pide confirmarlo con un enlace; una vez confirmado (o si ya
-- confirmó una calificación), las siguientes no lo piden otra vez.
-- ============================================================================

SET NAMES utf8mb4;

ALTER TABLE establishment_suggestions
  ADD COLUMN email_verified_at DATETIME NULL AFTER suggester_email,
  ADD COLUMN confirm_token_hash CHAR(64) NULL AFTER email_verified_at,
  ADD COLUMN confirm_expires_at DATETIME NULL AFTER confirm_token_hash,
  ADD KEY idx_suggestion_email (suggester_email, email_verified_at);
