-- ============================================================================
-- 018 · Páginas editables desde el panel (/admin/paginas)
--
-- El contenido de Inicio, Qué hacer y las páginas de Dónde ir se guarda como
-- JSON en site_settings con la clave «page:<página>» (sin fila, el sitio usa
-- el diseño original). Las fotos que se suben solo para una página no
-- pertenecen a ninguna ficha: se registran en page_images para que
-- media-prune no las tome por huérfanas.
-- ============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS page_images (
  media_id   BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (media_id),
  CONSTRAINT fk_page_images_media
    FOREIGN KEY (media_id) REFERENCES media (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
