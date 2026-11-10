-- ============================================================================
-- 013 · Calificaciones (1 a 5 estrellas) de establecimientos y experiencias
--
-- Cada visitante deja una calificación por correo y ficha (sin comentarios);
-- si vuelve a calificar, se actualiza. El promedio y el número de votos se
-- mantienen en rating_stats mediante triggers (se recalculan al insertar,
-- actualizar o borrar una calificación).
-- ============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS ratings (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  target_type ENUM('establishment','experience') NOT NULL,
  target_id   BIGINT UNSIGNED NOT NULL,
  voter_name  VARCHAR(80) NOT NULL,
  voter_email VARCHAR(160) NOT NULL,
  stars       TINYINT UNSIGNED NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rating_voter (target_type, target_id, voter_email),
  CONSTRAINT chk_rating_stars CHECK (stars BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS rating_stats (
  target_type ENUM('establishment','experience') NOT NULL,
  target_id   BIGINT UNSIGNED NOT NULL,
  average     DECIMAL(3,2) NOT NULL DEFAULT 0,
  votes       INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TRIGGER IF EXISTS trg_ratings_ai;
DROP TRIGGER IF EXISTS trg_ratings_au;
DROP TRIGGER IF EXISTS trg_ratings_ad;

CREATE TRIGGER trg_ratings_ai AFTER INSERT ON ratings FOR EACH ROW
  REPLACE INTO rating_stats (target_type, target_id, average, votes)
  SELECT NEW.target_type, NEW.target_id, ROUND(AVG(stars), 2), COUNT(*)
  FROM ratings WHERE target_type = NEW.target_type AND target_id = NEW.target_id;

CREATE TRIGGER trg_ratings_au AFTER UPDATE ON ratings FOR EACH ROW
  REPLACE INTO rating_stats (target_type, target_id, average, votes)
  SELECT NEW.target_type, NEW.target_id, ROUND(AVG(stars), 2), COUNT(*)
  FROM ratings WHERE target_type = NEW.target_type AND target_id = NEW.target_id;

CREATE TRIGGER trg_ratings_ad AFTER DELETE ON ratings FOR EACH ROW
  REPLACE INTO rating_stats (target_type, target_id, average, votes)
  SELECT OLD.target_type, OLD.target_id, COALESCE(ROUND(AVG(stars), 2), 0), COUNT(*)
  FROM ratings WHERE target_type = OLD.target_type AND target_id = OLD.target_id;
