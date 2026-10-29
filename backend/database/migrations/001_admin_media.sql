-- ============================================================================
-- 001 · Medios para el panel de administración
--
-- Las tablas ya existen en schema.sql; este script es idempotente para poder
-- aplicarlo sobre una base creada antes de que existiera el panel (producción).
-- Los binarios NO se guardan aquí: solo metadatos y rutas relativas al disco.
-- ============================================================================

CREATE TABLE IF NOT EXISTS media (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  storage_disk    VARCHAR(30)  NOT NULL DEFAULT 'local',
  storage_path    VARCHAR(500) NOT NULL,
  public_url      VARCHAR(1000) NULL,
  mime_type       VARCHAR(100) NOT NULL,
  width_px        INT UNSIGNED NULL,
  height_px       INT UNSIGNED NULL,
  alt_text        VARCHAR(255) NULL,
  caption         VARCHAR(500) NULL,
  credit          VARCHAR(255) NULL,
  source          ENUM('drive', 'upload', 'figma', 'external') NOT NULL DEFAULT 'upload',
  source_ref      VARCHAR(255) NULL COMMENT 'ID del archivo en Drive/Figma, si aplica',
  checksum_sha256 CHAR(64) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_media_path (storage_disk, storage_path),
  UNIQUE KEY uq_media_source_ref (source, source_ref),
  KEY idx_media_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS establishment_images (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  establishment_id BIGINT UNSIGNED NOT NULL,
  media_id         BIGINT UNSIGNED NOT NULL,
  role             ENUM('cover', 'gallery', 'logo') NOT NULL DEFAULT 'gallery',
  sort_order       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  alt_override     VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_establishment_image_role (establishment_id, media_id, role),
  KEY idx_establishment_images_order (establishment_id, role, sort_order),
  CONSTRAINT fk_establishment_images_establishment
    FOREIGN KEY (establishment_id) REFERENCES establishments (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_establishment_images_media
    FOREIGN KEY (media_id) REFERENCES media (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_log (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_user_id BIGINT UNSIGNED NULL,
  action        VARCHAR(80) NOT NULL COMMENT 'create, update, delete, publish, login…',
  entity_type   VARCHAR(60) NOT NULL,
  entity_id     BIGINT UNSIGNED NULL,
  changes       JSON NULL,
  ip_address    VARCHAR(45) NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_entity (entity_type, entity_id),
  KEY idx_audit_user (admin_user_id, created_at),
  CONSTRAINT fk_audit_admin_user
    FOREIGN KEY (admin_user_id) REFERENCES admin_users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;
