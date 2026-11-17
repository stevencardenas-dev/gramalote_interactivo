-- ============================================================================
-- 033 · Tres estados para las sugerencias: Nueva, Agregar, Descartar
--
-- «Revisada» no se usaba en el panel: era un paso intermedio que nadie marcaba.
-- Las pocas filas que quedaron en ese estado pasan a «nueva» (siguen esperando
-- decisión) y la columna se queda solo con los tres estados del flujo.
-- ============================================================================

SET NAMES utf8mb4;

UPDATE establishment_suggestions SET status = 'nueva' WHERE status = 'revisada';

ALTER TABLE establishment_suggestions
  MODIFY status ENUM('nueva', 'agregada', 'descartada') NOT NULL DEFAULT 'nueva';
