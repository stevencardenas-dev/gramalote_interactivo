-- ============================================================================
-- Gramalote Interactivo — esquema relacional propuesto
-- Motor: MySQL 8.0+ / InnoDB / utf8mb4
--
-- Este archivo es la fuente de verdad del modelo de datos. Está pensado para
-- desarrollo y para crear la base desde cero; en producción deben usarse
-- migraciones versionadas (Flyway, Liquibase, Prisma Migrate, etc.).
--
-- ADVERTENCIA: elimina y recrea las tablas del esquema `gramalote`.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS gramalote
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE gramalote;
SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW IF EXISTS v_public_establishments;
DROP VIEW IF EXISTS v_public_experiences;
DROP VIEW IF EXISTS v_public_curiosities;

DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS admin_refresh_tokens;
DROP TABLE IF EXISTS search_documents;
DROP TABLE IF EXISTS navigation_items;
DROP TABLE IF EXISTS site_settings;
DROP TABLE IF EXISTS location_info;
DROP TABLE IF EXISTS useful_contacts;
DROP TABLE IF EXISTS preparation_tips;
DROP TABLE IF EXISTS safety_tips;
DROP TABLE IF EXISTS transport_options;
DROP TABLE IF EXISTS access_routes;
DROP TABLE IF EXISTS history_images;
DROP TABLE IF EXISTS history_entries;
DROP TABLE IF EXISTS curiosity_collection_items;
DROP TABLE IF EXISTS curiosity_block_media;
DROP TABLE IF EXISTS curiosity_blocks;
DROP TABLE IF EXISTS curiosities;
DROP TABLE IF EXISTS curiosity_sections;
DROP TABLE IF EXISTS experience_establishments;
DROP TABLE IF EXISTS experience_social_links;
DROP TABLE IF EXISTS experience_images;
DROP TABLE IF EXISTS experience_tips;
DROP TABLE IF EXISTS experiences;
DROP TABLE IF EXISTS experience_categories;
DROP TABLE IF EXISTS establishment_relations;
DROP TABLE IF EXISTS establishment_social_links;
DROP TABLE IF EXISTS opening_hours_exceptions;
DROP TABLE IF EXISTS opening_hours;
DROP TABLE IF EXISTS establishment_payments;
DROP TABLE IF EXISTS establishment_services;
DROP TABLE IF EXISTS establishment_products;
DROP TABLE IF EXISTS establishment_features;
DROP TABLE IF EXISTS establishment_images;
DROP TABLE IF EXISTS establishments;
DROP TABLE IF EXISTS payment_methods;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS establishment_types;
DROP TABLE IF EXISTS establishment_categories;
DROP TABLE IF EXISTS zones;
DROP TABLE IF EXISTS media;
DROP TABLE IF EXISTS admin_users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 1. Catálogos y geografía
-- ============================================================================

CREATE TABLE zones (
  id            TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug          VARCHAR(40)  NOT NULL,
  name          VARCHAR(80)  NOT NULL,
  color         VARCHAR(20)  NOT NULL DEFAULT '#486284',
  geojson       JSON NULL COMMENT 'Polígono/GeoJSON opcional para el mapa',
  sort_order    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_zones_slug (slug)
) ENGINE=InnoDB COMMENT='Gramalote Nuevo, Gramalote Viejo y futuras zonas del mapa';

CREATE TABLE establishment_categories (
  id            TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug          VARCHAR(20)  NOT NULL COMMENT 'comer, dormir, comprar',
  name          VARCHAR(80)  NOT NULL,
  sort_order    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_establishment_categories_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE establishment_types (
  id            SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id   TINYINT UNSIGNED NOT NULL,
  slug          VARCHAR(80)  NOT NULL,
  name          VARCHAR(120) NOT NULL,
  filter_group  VARCHAR(80)  NULL COMMENT 'Etiqueta usada por los filtros del listado',
  sort_order    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_establishment_types_category_slug (category_id, slug),
  KEY idx_establishment_types_filter (category_id, filter_group),
  CONSTRAINT fk_establishment_types_category
    FOREIGN KEY (category_id) REFERENCES establishment_categories (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE services (
  id            SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug          VARCHAR(80) NOT NULL,
  name          VARCHAR(120) NOT NULL,
  icon          VARCHAR(40) NULL,
  sort_order    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_services_slug (slug)
) ENGINE=InnoDB COMMENT='Servicios de alojamiento y otras comodidades filtrables';

CREATE TABLE payment_methods (
  id            TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug          VARCHAR(60) NOT NULL,
  name          VARCHAR(80) NOT NULL,
  sort_order    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_methods_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE experience_categories (
  id            TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug          VARCHAR(60) NOT NULL,
  name          VARCHAR(80) NOT NULL,
  sort_order    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_experience_categories_slug (slug)
) ENGINE=InnoDB;

-- ============================================================================
-- 2. Medios
-- ============================================================================

CREATE TABLE media (
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
  KEY idx_media_mime (mime_type)
) ENGINE=InnoDB COMMENT='Inventario central de fotos; las tablas de contenido referencian media.id';

-- ============================================================================
-- 3. Establecimientos (comer, dormir, comprar)
-- ============================================================================

CREATE TABLE establishments (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug            VARCHAR(160) NOT NULL,
  name            VARCHAR(180) NOT NULL,
  category_id     TINYINT UNSIGNED NOT NULL,
  type_id         SMALLINT UNSIGNED NULL,
  zone_id         TINYINT UNSIGNED NULL,
  location_detail VARCHAR(180) NULL COMMENT 'Vereda, barrio o referencia mostrada junto al tipo',
  summary         VARCHAR(320) NOT NULL,
  description     TEXT NOT NULL,
  address         VARCHAR(255) NULL,
  latitude        DECIMAL(10, 7) NULL,
  longitude       DECIMAL(10, 7) NULL,
  phone           VARCHAR(40) NULL,
  phone_secondary VARCHAR(40) NULL,
  whatsapp        VARCHAR(40) NULL,
  email           VARCHAR(190) NULL,
  website         VARCHAR(500) NULL,
  hours_text      VARCHAR(255) NULL COMMENT 'Texto editable mostrado en la ficha',
  checkin_text    VARCHAR(120) NULL COMMENT 'Check-in / check-out para alojamientos',
  price_text      VARCHAR(120) NULL COMMENT 'Rango legible para mostrar',
  price_min_cop   DECIMAL(12, 2) NULL,
  price_max_cop   DECIMAL(12, 2) NULL,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  is_published    BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INT NOT NULL DEFAULT 0,
  published_at    DATETIME NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_establishments_slug (slug),
  KEY idx_establishments_listing (category_id, is_published, sort_order, name),
  KEY idx_establishments_zone (zone_id),
  KEY idx_establishments_type (type_id),
  FULLTEXT KEY ft_establishments (name, summary, description, address),
  CONSTRAINT fk_establishments_category
    FOREIGN KEY (category_id) REFERENCES establishment_categories (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_establishments_type
    FOREIGN KEY (type_id) REFERENCES establishment_types (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_establishments_zone
    FOREIGN KEY (zone_id) REFERENCES zones (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_establishments_latitude
    CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CONSTRAINT chk_establishments_longitude
    CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  CONSTRAINT chk_establishments_price_range
    CHECK (price_min_cop IS NULL OR price_max_cop IS NULL OR price_max_cop >= price_min_cop)
) ENGINE=InnoDB COMMENT='Ficha común de restaurantes, alojamientos y artesanos';

CREATE TABLE establishment_images (
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

CREATE TABLE establishment_features (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  establishment_id BIGINT UNSIGNED NOT NULL,
  title            VARCHAR(160) NOT NULL,
  description      VARCHAR(500) NULL,
  icon             VARCHAR(40) NULL,
  sort_order       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_establishment_features_order (establishment_id, sort_order),
  CONSTRAINT fk_establishment_features_establishment
    FOREIGN KEY (establishment_id) REFERENCES establishments (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Tarjetas de oferta/servicios destacados de la ficha';

CREATE TABLE establishment_products (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  establishment_id BIGINT UNSIGNED NOT NULL,
  name             VARCHAR(160) NOT NULL,
  description      VARCHAR(500) NULL,
  price_cop        DECIMAL(12, 2) NULL,
  media_id         BIGINT UNSIGNED NULL,
  sort_order       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  KEY idx_establishment_products_order (establishment_id, sort_order),
  KEY idx_establishment_products_price (price_cop),
  CONSTRAINT fk_establishment_products_establishment
    FOREIGN KEY (establishment_id) REFERENCES establishments (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_establishment_products_media
    FOREIGN KEY (media_id) REFERENCES media (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Productos de artesanos y tiendas; permite filtrar por precio';

CREATE TABLE establishment_services (
  establishment_id BIGINT UNSIGNED NOT NULL,
  service_id       SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (establishment_id, service_id),
  CONSTRAINT fk_establishment_services_establishment
    FOREIGN KEY (establishment_id) REFERENCES establishments (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_establishment_services_service
    FOREIGN KEY (service_id) REFERENCES services (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE establishment_payments (
  establishment_id  BIGINT UNSIGNED NOT NULL,
  payment_method_id TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (establishment_id, payment_method_id),
  CONSTRAINT fk_establishment_payments_establishment
    FOREIGN KEY (establishment_id) REFERENCES establishments (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_establishment_payments_method
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE establishment_social_links (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  establishment_id BIGINT UNSIGNED NOT NULL,
  platform         ENUM('facebook', 'instagram', 'whatsapp', 'tiktok', 'youtube', 'x', 'website') NOT NULL,
  url              VARCHAR(500) NOT NULL,
  sort_order       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_establishment_social (establishment_id, platform),
  CONSTRAINT fk_establishment_social_establishment
    FOREIGN KEY (establishment_id) REFERENCES establishments (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE establishment_relations (
  establishment_id         BIGINT UNSIGNED NOT NULL,
  related_establishment_id BIGINT UNSIGNED NOT NULL,
  sort_order               TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (establishment_id, related_establishment_id),
  KEY idx_establishment_relations_order (establishment_id, sort_order),
  CONSTRAINT fk_establishment_relations_source
    FOREIGN KEY (establishment_id) REFERENCES establishments (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_establishment_relations_target
    FOREIGN KEY (related_establishment_id) REFERENCES establishments (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Bloque “también puedes…” de las fichas; la API debe impedir que origen y destino sean iguales';

CREATE TABLE opening_hours (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  establishment_id BIGINT UNSIGNED NOT NULL,
  day_of_week      TINYINT UNSIGNED NOT NULL COMMENT '1 = lunes … 7 = domingo',
  opens_at         TIME NULL,
  closes_at        TIME NULL,
  is_closed        BOOLEAN NOT NULL DEFAULT FALSE,
  note             VARCHAR(160) NULL,
  sort_order       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_opening_hours_slot (establishment_id, day_of_week, sort_order),
  KEY idx_opening_hours_day (establishment_id, day_of_week),
  CONSTRAINT fk_opening_hours_establishment
    FOREIGN KEY (establishment_id) REFERENCES establishments (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_opening_hours_day
    CHECK (day_of_week BETWEEN 1 AND 7),
  CONSTRAINT chk_opening_hours_times
    CHECK (is_closed = 1 OR (opens_at IS NOT NULL AND closes_at IS NOT NULL))
) ENGINE=InnoDB COMMENT='Horario normalizado; admite varios turnos por día';

CREATE TABLE opening_hours_exceptions (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  establishment_id BIGINT UNSIGNED NOT NULL,
  exception_date   DATE NOT NULL,
  is_closed        BOOLEAN NOT NULL DEFAULT TRUE,
  opens_at         TIME NULL,
  closes_at        TIME NULL,
  note             VARCHAR(160) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_opening_exception (establishment_id, exception_date),
  CONSTRAINT fk_opening_exceptions_establishment
    FOREIGN KEY (establishment_id) REFERENCES establishments (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_opening_exception_times
    CHECK (is_closed = 1 OR (opens_at IS NOT NULL AND closes_at IS NOT NULL))
) ENGINE=InnoDB COMMENT='Festivos, cierres temporales y horarios especiales';

-- ============================================================================
-- 4. Experiencias (Qué hacer)
-- ============================================================================

CREATE TABLE experiences (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug            VARCHAR(160) NOT NULL,
  title           VARCHAR(180) NOT NULL,
  category_id     TINYINT UNSIGNED NULL,
  summary         VARCHAR(320) NOT NULL,
  description     MEDIUMTEXT NOT NULL,
  hours_text      VARCHAR(255) NULL,
  address         VARCHAR(255) NULL,
  zone_id         TINYINT UNSIGNED NULL,
  latitude        DECIMAL(10, 7) NULL,
  longitude       DECIMAL(10, 7) NULL,
  parking_text    VARCHAR(255) NULL,
  phone           VARCHAR(40) NULL,
  whatsapp        VARCHAR(40) NULL,
  email           VARCHAR(190) NULL,
  website         VARCHAR(500) NULL,
  duration_minutes SMALLINT UNSIGNED NULL,
  difficulty      ENUM('baja', 'media', 'media_alta', 'alta') NULL,
  price_text      VARCHAR(120) NULL,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  is_published    BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INT NOT NULL DEFAULT 0,
  published_at    DATETIME NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_experiences_slug (slug),
  KEY idx_experiences_listing (category_id, is_published, sort_order, title),
  KEY idx_experiences_zone (zone_id),
  FULLTEXT KEY ft_experiences (title, summary, description, address),
  CONSTRAINT fk_experiences_category
    FOREIGN KEY (category_id) REFERENCES experience_categories (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_experiences_zone
    FOREIGN KEY (zone_id) REFERENCES zones (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_experiences_latitude
    CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CONSTRAINT chk_experiences_longitude
    CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
) ENGINE=InnoDB;

CREATE TABLE experience_tips (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  experience_id BIGINT UNSIGNED NOT NULL,
  title         VARCHAR(160) NOT NULL,
  description   VARCHAR(800) NULL,
  icon          VARCHAR(40) NULL,
  sort_order    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_experience_tips_order (experience_id, sort_order),
  CONSTRAINT fk_experience_tips_experience
    FOREIGN KEY (experience_id) REFERENCES experiences (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE experience_images (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  experience_id BIGINT UNSIGNED NOT NULL,
  media_id      BIGINT UNSIGNED NOT NULL,
  role          ENUM('cover', 'gallery') NOT NULL DEFAULT 'gallery',
  sort_order    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  alt_override  VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_experience_image_role (experience_id, media_id, role),
  KEY idx_experience_images_order (experience_id, role, sort_order),
  CONSTRAINT fk_experience_images_experience
    FOREIGN KEY (experience_id) REFERENCES experiences (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_experience_images_media
    FOREIGN KEY (media_id) REFERENCES media (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE experience_social_links (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  experience_id BIGINT UNSIGNED NOT NULL,
  platform      ENUM('facebook', 'instagram', 'whatsapp', 'tiktok', 'youtube', 'x', 'website') NOT NULL,
  url           VARCHAR(500) NOT NULL,
  sort_order    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_experience_social (experience_id, platform),
  CONSTRAINT fk_experience_social_experience
    FOREIGN KEY (experience_id) REFERENCES experiences (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE experience_establishments (
  experience_id    BIGINT UNSIGNED NOT NULL,
  establishment_id BIGINT UNSIGNED NOT NULL,
  sort_order       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (experience_id, establishment_id),
  CONSTRAINT fk_experience_establishments_experience
    FOREIGN KEY (experience_id) REFERENCES experiences (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_experience_establishments_establishment
    FOREIGN KEY (establishment_id) REFERENCES establishments (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Experiencias que ocurren en un establecimiento o lo involucran';

-- ============================================================================
-- 5. Curiosidades (contenido editorial por bloques)
-- ============================================================================

CREATE TABLE curiosity_sections (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug         VARCHAR(80) NOT NULL,
  eyebrow      VARCHAR(120) NULL,
  title        VARCHAR(180) NOT NULL,
  summary      VARCHAR(500) NOT NULL,
  cta_label    VARCHAR(120) NULL,
  media_id     BIGINT UNSIGNED NULL,
  sort_order   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_curiosity_sections_slug (slug),
  CONSTRAINT fk_curiosity_sections_media
    FOREIGN KEY (media_id) REFERENCES media (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Las cuatro tarjetas del hub /curiosidades';

CREATE TABLE curiosities (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  section_id         BIGINT UNSIGNED NOT NULL,
  intro_title        VARCHAR(180) NOT NULL,
  intro_text         TEXT NOT NULL,
  closing_title      VARCHAR(180) NULL,
  closing_text       TEXT NULL,
  closing_media_side ENUM('left', 'right') NOT NULL DEFAULT 'left',
  closing_media_id   BIGINT UNSIGNED NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_curiosities_section (section_id),
  CONSTRAINT fk_curiosities_section
    FOREIGN KEY (section_id) REFERENCES curiosity_sections (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_curiosities_closing_media
    FOREIGN KEY (closing_media_id) REFERENCES media (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE curiosity_blocks (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  curiosity_id BIGINT UNSIGNED NOT NULL,
  block_type   ENUM('row', 'feature', 'featured', 'collection') NOT NULL,
  title        VARCHAR(180) NULL,
  eyebrow      VARCHAR(120) NULL,
  body_text    TEXT NULL COMMENT 'Texto corto de los bloques featured',
  media_side   ENUM('left', 'right') NULL,
  media_count  TINYINT UNSIGNED NOT NULL DEFAULT 1,
  column_count TINYINT UNSIGNED NULL COMMENT 'Para bloques collection',
  paragraphs   JSON NOT NULL COMMENT 'Array ordenado de párrafos',
  sort_order   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_curiosity_blocks_order (curiosity_id, sort_order),
  CONSTRAINT fk_curiosity_blocks_curiosity
    FOREIGN KEY (curiosity_id) REFERENCES curiosities (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_curiosity_blocks_media_count
    CHECK (media_count BETWEEN 1 AND 4),
  CONSTRAINT chk_curiosity_blocks_columns
    CHECK (column_count IS NULL OR column_count BETWEEN 1 AND 4)
) ENGINE=InnoDB;

CREATE TABLE curiosity_block_media (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  block_id   BIGINT UNSIGNED NOT NULL,
  media_id   BIGINT UNSIGNED NOT NULL,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_curiosity_block_media_order (block_id, sort_order),
  CONSTRAINT fk_curiosity_block_media_block
    FOREIGN KEY (block_id) REFERENCES curiosity_blocks (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_curiosity_block_media_media
    FOREIGN KEY (media_id) REFERENCES media (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE curiosity_collection_items (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  block_id   BIGINT UNSIGNED NOT NULL,
  label      VARCHAR(160) NOT NULL,
  text       TEXT NULL,
  media_id   BIGINT UNSIGNED NULL,
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_curiosity_collection_order (block_id, sort_order),
  CONSTRAINT fk_curiosity_collection_block
    FOREIGN KEY (block_id) REFERENCES curiosity_blocks (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_curiosity_collection_media
    FOREIGN KEY (media_id) REFERENCES media (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 6. Historia
-- ============================================================================

CREATE TABLE history_entries (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug         VARCHAR(160) NOT NULL,
  title        VARCHAR(180) NOT NULL,
  period_label VARCHAR(120) NULL,
  summary      VARCHAR(500) NULL,
  body         MEDIUMTEXT NOT NULL,
  media_id     BIGINT UNSIGNED NULL,
  sort_order   INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at   DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_history_entries_slug (slug),
  KEY idx_history_entries_order (is_published, sort_order),
  FULLTEXT KEY ft_history_entries (title, summary, body),
  CONSTRAINT fk_history_entries_media
    FOREIGN KEY (media_id) REFERENCES media (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE history_images (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  entry_id   BIGINT UNSIGNED NOT NULL,
  media_id   BIGINT UNSIGNED NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  alt_override VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_history_images_order (entry_id, sort_order),
  CONSTRAINT fk_history_images_entry
    FOREIGN KEY (entry_id) REFERENCES history_entries (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_history_images_media
    FOREIGN KEY (media_id) REFERENCES media (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 7. Información práctica
-- ============================================================================

CREATE TABLE access_routes (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title       VARCHAR(160) NOT NULL,
  description VARCHAR(800) NOT NULL,
  media_id    BIGINT UNSIGNED NULL,
  cta_label   VARCHAR(120) NULL,
  cta_url     VARCHAR(500) NULL,
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  CONSTRAINT fk_access_routes_media
    FOREIGN KEY (media_id) REFERENCES media (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Tarjetas “Cómo llegar”: Cúcuta, Pamplona, otros municipios';

CREATE TABLE transport_options (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title       VARCHAR(160) NOT NULL,
  description VARCHAR(800) NOT NULL,
  media_id    BIGINT UNSIGNED NULL,
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  CONSTRAINT fk_transport_options_media
    FOREIGN KEY (media_id) REFERENCES media (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE safety_tips (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title       VARCHAR(160) NOT NULL,
  description VARCHAR(800) NOT NULL,
  icon        VARCHAR(40) NULL,
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE preparation_tips (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title       VARCHAR(160) NOT NULL,
  description VARCHAR(800) NOT NULL,
  icon        VARCHAR(40) NULL,
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE useful_contacts (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title       VARCHAR(160) NOT NULL,
  description VARCHAR(800) NOT NULL,
  phone       VARCHAR(40) NULL,
  phone_secondary VARCHAR(40) NULL,
  email       VARCHAR(190) NULL,
  hours       VARCHAR(160) NULL,
  media_id    BIGINT UNSIGNED NULL,
  sort_order  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  CONSTRAINT fk_useful_contacts_media
    FOREIGN KEY (media_id) REFERENCES media (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE location_info (
  id          TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title       VARCHAR(160) NOT NULL,
  description VARCHAR(800) NOT NULL,
  address     VARCHAR(255) NULL,
  latitude    DECIMAL(10, 7) NULL,
  longitude   DECIMAL(10, 7) NULL,
  map_url     VARCHAR(1000) NULL,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ============================================================================
-- 8. Navegación y configuración del sitio
-- ============================================================================

CREATE TABLE site_settings (
  setting_key   VARCHAR(80) NOT NULL,
  setting_value JSON NOT NULL,
  description   VARCHAR(255) NULL,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB;

CREATE TABLE navigation_items (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  location     ENUM('header', 'explore', 'footer', 'quick') NOT NULL,
  label        VARCHAR(120) NOT NULL,
  path         VARCHAR(500) NOT NULL,
  parent_id    INT UNSIGNED NULL,
  sort_order   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_external  BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  KEY idx_navigation_location (location, is_published, sort_order),
  CONSTRAINT fk_navigation_parent
    FOREIGN KEY (parent_id) REFERENCES navigation_items (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 9. Administración
-- ============================================================================

CREATE TABLE admin_users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(160) NOT NULL,
  email         VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL COMMENT 'Argon2id/bcrypt; nunca texto plano',
  role          ENUM('admin', 'editor') NOT NULL DEFAULT 'editor',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at DATETIME NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE admin_refresh_tokens (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL COMMENT 'SHA-256 del token; no guardar el token original',
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  user_agent VARCHAR(255) NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_refresh_token (token_hash),
  KEY idx_admin_refresh_user (user_id, expires_at),
  CONSTRAINT fk_admin_refresh_user
    FOREIGN KEY (user_id) REFERENCES admin_users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE audit_log (
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

-- ============================================================================
-- 10. Índice de búsqueda global
-- ============================================================================

CREATE TABLE search_documents (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  entity_type  ENUM('establishment', 'experience', 'curiosity', 'history', 'practical', 'contact') NOT NULL,
  entity_id    BIGINT UNSIGNED NOT NULL,
  title        VARCHAR(255) NOT NULL,
  body         MEDIUMTEXT NOT NULL,
  url          VARCHAR(500) NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_search_entity (entity_type, entity_id),
  FULLTEXT KEY ft_search_documents (title, body)
) ENGINE=InnoDB COMMENT='Se actualiza desde la API al guardar contenido; permite buscar en todo el sitio';

-- ============================================================================
-- 11. Vistas públicas
-- ============================================================================

CREATE OR REPLACE VIEW v_public_establishments AS
SELECT
  e.id,
  e.slug,
  e.name,
  c.slug AS category_slug,
  c.name AS category_name,
  t.slug AS type_slug,
  t.name AS type_name,
  t.filter_group,
  z.slug AS zone_slug,
  z.name AS zone_name,
  e.location_detail,
  e.summary,
  e.description,
  e.address,
  e.latitude,
  e.longitude,
  e.phone,
  e.whatsapp,
  e.email,
  e.website,
  e.hours_text,
  e.checkin_text,
  e.price_text,
  e.price_min_cop,
  e.price_max_cop,
  e.is_featured,
  e.sort_order
FROM establishments e
JOIN establishment_categories c ON c.id = e.category_id
LEFT JOIN establishment_types t ON t.id = e.type_id
LEFT JOIN zones z ON z.id = e.zone_id
WHERE e.is_published = 1 AND e.deleted_at IS NULL;

CREATE OR REPLACE VIEW v_public_experiences AS
SELECT
  x.id,
  x.slug,
  x.title,
  c.slug AS category_slug,
  c.name AS category_name,
  x.summary,
  x.description,
  x.hours_text,
  x.address,
  z.slug AS zone_slug,
  z.name AS zone_name,
  x.latitude,
  x.longitude,
  x.parking_text,
  x.phone,
  x.whatsapp,
  x.email,
  x.website,
  x.duration_minutes,
  x.difficulty,
  x.price_text,
  x.is_featured,
  x.sort_order
FROM experiences x
LEFT JOIN experience_categories c ON c.id = x.category_id
LEFT JOIN zones z ON z.id = x.zone_id
WHERE x.is_published = 1 AND x.deleted_at IS NULL;

CREATE OR REPLACE VIEW v_public_curiosities AS
SELECT
  s.id AS section_id,
  s.slug,
  s.eyebrow,
  s.title,
  s.summary,
  s.cta_label,
  s.media_id,
  s.sort_order,
  c.id AS curiosity_id,
  c.intro_title,
  c.intro_text,
  c.closing_title,
  c.closing_text,
  c.closing_media_side,
  c.closing_media_id
FROM curiosity_sections s
JOIN curiosities c ON c.section_id = s.id
WHERE s.is_published = 1 AND s.deleted_at IS NULL;
