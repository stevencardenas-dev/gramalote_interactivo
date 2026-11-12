-- ============================================================================
-- 021 · Comentario en las calificaciones
--
-- Cada voto puede traer un comentario opcional (hasta 1000 caracteres). Igual
-- que las estrellas, el comentario espera en pending_comment hasta que la
-- persona confirma el voto por correo; al confirmar pasa a comment_text.
-- Las calificaciones que ya existen quedan con el comentario vacío (NULL).
-- ============================================================================

SET NAMES utf8mb4;

ALTER TABLE ratings
  ADD COLUMN comment_text TEXT NULL AFTER stars,
  ADD COLUMN pending_comment TEXT NULL AFTER pending_stars;
