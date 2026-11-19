
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `access_routes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `access_routes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(160) NOT NULL,
  `description` varchar(800) NOT NULL,
  `media_id` bigint unsigned DEFAULT NULL,
  `cta_label` varchar(120) DEFAULT NULL,
  `cta_url` varchar(500) DEFAULT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `fk_access_routes_media` (`media_id`),
  CONSTRAINT `fk_access_routes_media` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Tarjetas “Cómo llegar”: Cúcuta, Pamplona, otros municipios';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `admin_password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_password_resets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `token_hash` char(64) NOT NULL COMMENT 'SHA-256 del token; no guardar el token original',
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL COMMENT 'Admin que generó el enlace; NULL si lo pidió el propio usuario',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_password_reset_token` (`token_hash`),
  KEY `idx_admin_password_reset_user` (`user_id`,`expires_at`),
  CONSTRAINT `fk_admin_password_reset_user` FOREIGN KEY (`user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `admin_refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_refresh_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `token_hash` char(64) NOT NULL COMMENT 'SHA-256 del token; no guardar el token original',
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_refresh_token` (`token_hash`),
  KEY `idx_admin_refresh_user` (`user_id`,`expires_at`),
  CONSTRAINT `fk_admin_refresh_user` FOREIGN KEY (`user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=486 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `admin_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(160) NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) NOT NULL COMMENT 'Argon2id/bcrypt; nunca texto plano',
  `role` enum('admin','editor') NOT NULL DEFAULT 'editor',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `session_version` int unsigned NOT NULL DEFAULT '0' COMMENT 'Sube al abrir sesión: invalida los access tokens anteriores',
  `last_login_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `admin_user_id` bigint unsigned DEFAULT NULL,
  `action` varchar(80) NOT NULL COMMENT 'create, update, delete, publish, login…',
  `entity_type` varchar(60) NOT NULL,
  `entity_id` bigint unsigned DEFAULT NULL,
  `changes` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_entity` (`entity_type`,`entity_id`),
  KEY `idx_audit_user` (`admin_user_id`,`created_at`),
  CONSTRAINT `fk_audit_admin_user` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=987 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `curiosities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `curiosities` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `section_id` bigint unsigned NOT NULL,
  `intro_title` varchar(180) NOT NULL,
  `intro_text` text NOT NULL,
  `closing_title` varchar(180) DEFAULT NULL,
  `closing_text` text,
  `closing_media_side` enum('left','right') NOT NULL DEFAULT 'left',
  `closing_media_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_curiosities_section` (`section_id`),
  KEY `fk_curiosities_closing_media` (`closing_media_id`),
  CONSTRAINT `fk_curiosities_closing_media` FOREIGN KEY (`closing_media_id`) REFERENCES `media` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_curiosities_section` FOREIGN KEY (`section_id`) REFERENCES `curiosity_sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `curiosity_block_media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `curiosity_block_media` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `block_id` bigint unsigned NOT NULL,
  `media_id` bigint unsigned NOT NULL,
  `sort_order` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_curiosity_block_media_order` (`block_id`,`sort_order`),
  KEY `fk_curiosity_block_media_media` (`media_id`),
  CONSTRAINT `fk_curiosity_block_media_block` FOREIGN KEY (`block_id`) REFERENCES `curiosity_blocks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_curiosity_block_media_media` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `curiosity_blocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `curiosity_blocks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `curiosity_id` bigint unsigned NOT NULL,
  `block_type` enum('row','feature','featured','collection') NOT NULL,
  `title` varchar(180) DEFAULT NULL,
  `eyebrow` varchar(120) DEFAULT NULL,
  `body_text` text COMMENT 'Texto corto de los bloques featured',
  `media_side` enum('left','right') DEFAULT NULL,
  `media_count` tinyint unsigned NOT NULL DEFAULT '1',
  `column_count` tinyint unsigned DEFAULT NULL COMMENT 'Para bloques collection',
  `paragraphs` json NOT NULL COMMENT 'Array ordenado de párrafos',
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_curiosity_blocks_order` (`curiosity_id`,`sort_order`),
  CONSTRAINT `fk_curiosity_blocks_curiosity` FOREIGN KEY (`curiosity_id`) REFERENCES `curiosities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_curiosity_blocks_columns` CHECK (((`column_count` is null) or (`column_count` between 1 and 4))),
  CONSTRAINT `chk_curiosity_blocks_media_count` CHECK ((`media_count` between 1 and 4))
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `curiosity_collection_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `curiosity_collection_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `block_id` bigint unsigned NOT NULL,
  `label` varchar(160) NOT NULL,
  `text` text,
  `media_id` bigint unsigned DEFAULT NULL,
  `sort_order` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_curiosity_collection_order` (`block_id`,`sort_order`),
  KEY `fk_curiosity_collection_media` (`media_id`),
  CONSTRAINT `fk_curiosity_collection_block` FOREIGN KEY (`block_id`) REFERENCES `curiosity_blocks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_curiosity_collection_media` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `curiosity_sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `curiosity_sections` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(80) NOT NULL,
  `eyebrow` varchar(120) DEFAULT NULL,
  `title` varchar(180) NOT NULL,
  `summary` varchar(500) NOT NULL,
  `cta_label` varchar(120) DEFAULT NULL,
  `media_id` bigint unsigned DEFAULT NULL,
  `sort_order` tinyint unsigned NOT NULL DEFAULT '0',
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_curiosity_sections_slug` (`slug`),
  KEY `fk_curiosity_sections_media` (`media_id`),
  CONSTRAINT `fk_curiosity_sections_media` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Las cuatro tarjetas del hub /curiosidades';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `establishment_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `establishment_categories` (
  `id` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(20) NOT NULL COMMENT 'comer, dormir, comprar',
  `name` varchar(80) NOT NULL,
  `sort_order` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_establishment_categories_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `establishment_features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `establishment_features` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `establishment_id` bigint unsigned NOT NULL,
  `title` varchar(160) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `icon` varchar(40) DEFAULT NULL,
  `media_id` bigint unsigned DEFAULT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_establishment_features_order` (`establishment_id`,`sort_order`),
  KEY `idx_establishment_features_media` (`media_id`),
  CONSTRAINT `fk_establishment_features_establishment` FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_establishment_features_media` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Tarjetas de oferta/servicios destacados de la ficha';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `establishment_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `establishment_images` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `establishment_id` bigint unsigned NOT NULL,
  `media_id` bigint unsigned NOT NULL,
  `role` enum('cover','hero','gallery','logo') NOT NULL DEFAULT 'gallery',
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  `alt_override` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_establishment_image_role` (`establishment_id`,`media_id`,`role`),
  KEY `idx_establishment_images_order` (`establishment_id`,`role`,`sort_order`),
  KEY `fk_establishment_images_media` (`media_id`),
  CONSTRAINT `fk_establishment_images_establishment` FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_establishment_images_media` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=323 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `establishment_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `establishment_payments` (
  `establishment_id` bigint unsigned NOT NULL,
  `payment_method_id` tinyint unsigned NOT NULL,
  PRIMARY KEY (`establishment_id`,`payment_method_id`),
  KEY `fk_establishment_payments_method` (`payment_method_id`),
  CONSTRAINT `fk_establishment_payments_establishment` FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_establishment_payments_method` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `establishment_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `establishment_products` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `establishment_id` bigint unsigned NOT NULL,
  `name` varchar(160) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `price_cop` decimal(12,2) DEFAULT NULL,
  `media_id` bigint unsigned DEFAULT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_establishment_products_order` (`establishment_id`,`sort_order`),
  KEY `idx_establishment_products_price` (`price_cop`),
  KEY `fk_establishment_products_media` (`media_id`),
  CONSTRAINT `fk_establishment_products_establishment` FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_establishment_products_media` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=532 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Productos de artesanos y tiendas; permite filtrar por precio';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `establishment_relations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `establishment_relations` (
  `establishment_id` bigint unsigned NOT NULL,
  `related_establishment_id` bigint unsigned NOT NULL,
  `sort_order` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`establishment_id`,`related_establishment_id`),
  KEY `idx_establishment_relations_order` (`establishment_id`,`sort_order`),
  KEY `fk_establishment_relations_target` (`related_establishment_id`),
  CONSTRAINT `fk_establishment_relations_source` FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_establishment_relations_target` FOREIGN KEY (`related_establishment_id`) REFERENCES `establishments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bloque “también puedes…” de las fichas; la API debe impedir que origen y destino sean iguales';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `establishment_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `establishment_services` (
  `establishment_id` bigint unsigned NOT NULL,
  `service_id` smallint unsigned NOT NULL,
  PRIMARY KEY (`establishment_id`,`service_id`),
  KEY `fk_establishment_services_service` (`service_id`),
  CONSTRAINT `fk_establishment_services_establishment` FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_establishment_services_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `establishment_social_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `establishment_social_links` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `establishment_id` bigint unsigned NOT NULL,
  `platform` enum('facebook','instagram','whatsapp','tiktok','youtube','x','website') NOT NULL,
  `url` varchar(500) NOT NULL,
  `sort_order` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_establishment_social` (`establishment_id`,`platform`),
  CONSTRAINT `fk_establishment_social_establishment` FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=262 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `establishment_suggestions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `establishment_suggestions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `source` enum('web','google_form') NOT NULL DEFAULT 'web',
  `response_id` varchar(190) DEFAULT NULL COMMENT 'Id de la respuesta en Google Forms (evita duplicados)',
  `business_name` varchar(190) NOT NULL,
  `business_type` varchar(120) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `phone` varchar(120) DEFAULT NULL,
  `links` varchar(500) DEFAULT NULL,
  `reason` text,
  `is_owner` varchar(40) DEFAULT NULL,
  `suggester_name` varchar(160) DEFAULT NULL,
  `suggester_email` varchar(190) DEFAULT NULL,
  `email_verified_at` datetime DEFAULT NULL,
  `confirm_token_hash` char(64) DEFAULT NULL,
  `confirm_expires_at` datetime DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `raw_answers` json DEFAULT NULL,
  `status` enum('nueva','agregada','descartada') NOT NULL DEFAULT 'nueva',
  `admin_note` varchar(500) DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_suggestion_response` (`response_id`),
  KEY `idx_suggestion_status` (`status`,`created_at`),
  KEY `idx_suggestion_email` (`suggester_email`,`email_verified_at`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `establishment_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `establishment_types` (
  `id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `category_id` tinyint unsigned NOT NULL,
  `slug` varchar(80) NOT NULL,
  `name` varchar(120) NOT NULL,
  `filter_group` varchar(80) DEFAULT NULL COMMENT 'Etiqueta usada por los filtros del listado',
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_establishment_types_category_slug` (`category_id`,`slug`),
  KEY `idx_establishment_types_filter` (`category_id`,`filter_group`),
  CONSTRAINT `fk_establishment_types_category` FOREIGN KEY (`category_id`) REFERENCES `establishment_categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `establishments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `establishments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(160) NOT NULL,
  `name` varchar(180) NOT NULL,
  `category_id` tinyint unsigned NOT NULL,
  `type_id` smallint unsigned DEFAULT NULL,
  `zone_id` tinyint unsigned DEFAULT NULL,
  `location_detail` varchar(180) DEFAULT NULL COMMENT 'Vereda, barrio o referencia mostrada junto al tipo',
  `summary` varchar(320) NOT NULL,
  `description` text NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `map_icon` varchar(40) DEFAULT NULL COMMENT 'Icono del pin en el mapa (/img/mapa/iconos)',
  `maps_url` varchar(500) DEFAULT NULL COMMENT 'Enlace a Google Maps (si falta, se usan las coordenadas)',
  `phone` varchar(40) DEFAULT NULL,
  `phone_secondary` varchar(40) DEFAULT NULL,
  `whatsapp` varchar(40) DEFAULT NULL,
  `email` varchar(190) DEFAULT NULL,
  `website` varchar(500) DEFAULT NULL,
  `hours_text` varchar(255) DEFAULT NULL COMMENT 'Texto editable mostrado en la ficha',
  `hours_display` enum('text','table') NOT NULL DEFAULT 'text',
  `checkin_text` varchar(120) DEFAULT NULL COMMENT 'Check-in / check-out para alojamientos',
  `price_text` varchar(120) DEFAULT NULL COMMENT 'Rango legible para mostrar',
  `price_min_cop` decimal(12,2) DEFAULT NULL,
  `price_max_cop` decimal(12,2) DEFAULT NULL,
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  `published_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_establishments_slug` (`slug`),
  KEY `idx_establishments_listing` (`category_id`,`is_published`,`sort_order`,`name`),
  KEY `idx_establishments_zone` (`zone_id`),
  KEY `idx_establishments_type` (`type_id`),
  FULLTEXT KEY `ft_establishments` (`name`,`summary`,`description`,`address`),
  CONSTRAINT `fk_establishments_category` FOREIGN KEY (`category_id`) REFERENCES `establishment_categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_establishments_type` FOREIGN KEY (`type_id`) REFERENCES `establishment_types` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_establishments_zone` FOREIGN KEY (`zone_id`) REFERENCES `zones` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_establishments_latitude` CHECK (((`latitude` is null) or (`latitude` between -(90) and 90))),
  CONSTRAINT `chk_establishments_longitude` CHECK (((`longitude` is null) or (`longitude` between -(180) and 180))),
  CONSTRAINT `chk_establishments_price_range` CHECK (((`price_min_cop` is null) or (`price_max_cop` is null) or (`price_max_cop` >= `price_min_cop`)))
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Ficha común de restaurantes, alojamientos y artesanos';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `experience_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `experience_categories` (
  `id` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(60) NOT NULL,
  `name` varchar(80) NOT NULL,
  `sort_order` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_experience_categories_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `experience_establishments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `experience_establishments` (
  `experience_id` bigint unsigned NOT NULL,
  `establishment_id` bigint unsigned NOT NULL,
  `sort_order` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`experience_id`,`establishment_id`),
  KEY `fk_experience_establishments_establishment` (`establishment_id`),
  CONSTRAINT `fk_experience_establishments_establishment` FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_experience_establishments_experience` FOREIGN KEY (`experience_id`) REFERENCES `experiences` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Experiencias que ocurren en un establecimiento o lo involucran';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `experience_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `experience_images` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `experience_id` bigint unsigned NOT NULL,
  `media_id` bigint unsigned NOT NULL,
  `role` enum('cover','gallery') NOT NULL DEFAULT 'gallery',
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  `alt_override` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_experience_image_role` (`experience_id`,`media_id`,`role`),
  KEY `idx_experience_images_order` (`experience_id`,`role`,`sort_order`),
  KEY `fk_experience_images_media` (`media_id`),
  CONSTRAINT `fk_experience_images_experience` FOREIGN KEY (`experience_id`) REFERENCES `experiences` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_experience_images_media` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `experience_social_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `experience_social_links` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `experience_id` bigint unsigned NOT NULL,
  `platform` enum('facebook','instagram','whatsapp','tiktok','youtube','x','website') NOT NULL,
  `url` varchar(500) NOT NULL,
  `sort_order` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_experience_social` (`experience_id`,`platform`),
  CONSTRAINT `fk_experience_social_experience` FOREIGN KEY (`experience_id`) REFERENCES `experiences` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `experience_tips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `experience_tips` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `experience_id` bigint unsigned NOT NULL,
  `title` varchar(160) NOT NULL,
  `description` varchar(800) DEFAULT NULL,
  `icon` varchar(40) DEFAULT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_experience_tips_order` (`experience_id`,`sort_order`),
  CONSTRAINT `fk_experience_tips_experience` FOREIGN KEY (`experience_id`) REFERENCES `experiences` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=261 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `experiences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `experiences` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(160) NOT NULL,
  `title` varchar(180) NOT NULL,
  `category_id` tinyint unsigned DEFAULT NULL,
  `summary` varchar(320) NOT NULL,
  `card_text` varchar(600) DEFAULT NULL,
  `meta_text` varchar(255) DEFAULT NULL,
  `description` mediumtext NOT NULL,
  `hours_text` varchar(255) DEFAULT NULL,
  `schedule_json` json DEFAULT NULL COMMENT 'Horario de apertura: modo y días con sus turnos',
  `address` varchar(255) DEFAULT NULL,
  `access_text` varchar(255) DEFAULT NULL,
  `zone_id` tinyint unsigned DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `maps_url` varchar(500) DEFAULT NULL,
  `map_icon` varchar(40) DEFAULT NULL,
  `parking_text` varchar(255) DEFAULT NULL,
  `phone` varchar(40) DEFAULT NULL,
  `whatsapp` varchar(40) DEFAULT NULL,
  `email` varchar(190) DEFAULT NULL,
  `website` varchar(500) DEFAULT NULL,
  `duration_minutes` smallint unsigned DEFAULT NULL,
  `difficulty` enum('baja','media','media_alta','alta') DEFAULT NULL,
  `difficulty_text` varchar(80) DEFAULT NULL,
  `price_text` varchar(120) DEFAULT NULL,
  `open_daily` tinyint(1) NOT NULL DEFAULT '0',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '0',
  `published_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_experiences_slug` (`slug`),
  KEY `idx_experiences_listing` (`category_id`,`is_published`,`sort_order`,`title`),
  KEY `idx_experiences_zone` (`zone_id`),
  FULLTEXT KEY `ft_experiences` (`title`,`summary`,`description`,`address`),
  CONSTRAINT `fk_experiences_category` FOREIGN KEY (`category_id`) REFERENCES `experience_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_experiences_zone` FOREIGN KEY (`zone_id`) REFERENCES `zones` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_experiences_latitude` CHECK (((`latitude` is null) or (`latitude` between -(90) and 90))),
  CONSTRAINT `chk_experiences_longitude` CHECK (((`longitude` is null) or (`longitude` between -(180) and 180)))
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `extra_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `extra_images` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `extra_id` bigint unsigned NOT NULL,
  `media_id` bigint unsigned NOT NULL,
  `role` enum('cover','current','gallery','detail') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'gallery',
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_extra_image` (`extra_id`,`media_id`,`role`),
  KEY `idx_extra_images_order` (`extra_id`,`role`,`sort_order`),
  KEY `fk_extra_images_media` (`media_id`),
  CONSTRAINT `fk_extra_images_extra` FOREIGN KEY (`extra_id`) REFERENCES `map_extras` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_extra_images_media` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `heritage_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `heritage_images` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `heritage_id` bigint unsigned NOT NULL,
  `media_id` bigint unsigned NOT NULL,
  `role` enum('cover','historic','current','gallery','detail') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'gallery',
  `era_label` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Época de una foto histórica (1910 – 1953)',
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_heritage_image` (`heritage_id`,`media_id`,`role`),
  KEY `idx_heritage_images_order` (`heritage_id`,`role`,`sort_order`),
  KEY `fk_heritage_images_media` (`media_id`),
  CONSTRAINT `fk_heritage_images_media` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_heritage_images_site` FOREIGN KEY (`heritage_id`) REFERENCES `heritage_sites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `heritage_sites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `heritage_sites` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `matrix_ref` varchar(16) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slug` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `zone` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `maps_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `map_icon` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'monumento',
  `summary` varchar(320) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `show_on_map` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Se ve en /mapa (is_published controla la ficha de Historia)',
  `zone_key` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'caldereros, gramalote-viejo o nuevo-gramalote',
  `zone_tag` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Texto de la etiqueta de zona en la ficha',
  `ficha_category` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Categoría que se muestra en la ficha (Patrimonio religioso…)',
  `status` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Visitable' COMMENT 'Visitable, Con restricciones o Solo memoria',
  `subtitle` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `intro` varchar(600) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visit_location` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visit_access` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visit_recommendation` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hours_text` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `historical_period` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Época o años del bien (1910 – 1953…)',
  `sources` text COLLATE utf8mb4_unicode_ci COMMENT 'Fuentes consultadas',
  `coords_approx` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = ubicación aproximada',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_heritage_slug` (`slug`),
  UNIQUE KEY `uq_heritage_matrix_ref` (`matrix_ref`),
  KEY `idx_heritage_published` (`is_published`,`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `history_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `history_entries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(160) NOT NULL,
  `title` varchar(180) NOT NULL,
  `period_label` varchar(120) DEFAULT NULL,
  `summary` varchar(500) DEFAULT NULL,
  `body` mediumtext NOT NULL,
  `media_id` bigint unsigned DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_history_entries_slug` (`slug`),
  KEY `idx_history_entries_order` (`is_published`,`sort_order`),
  KEY `fk_history_entries_media` (`media_id`),
  FULLTEXT KEY `ft_history_entries` (`title`,`summary`,`body`),
  CONSTRAINT `fk_history_entries_media` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `history_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `history_images` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `entry_id` bigint unsigned NOT NULL,
  `media_id` bigint unsigned NOT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  `alt_override` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_history_images_order` (`entry_id`,`sort_order`),
  KEY `fk_history_images_media` (`media_id`),
  CONSTRAINT `fk_history_images_entry` FOREIGN KEY (`entry_id`) REFERENCES `history_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_history_images_media` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `location_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `location_info` (
  `id` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(160) NOT NULL,
  `description` varchar(800) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `map_url` varchar(1000) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `mail_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mail_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kind` varchar(40) NOT NULL,
  `to_email` varchar(500) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `status` enum('sent','failed') NOT NULL,
  `error` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mail_log_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `mail_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mail_settings` (
  `id` tinyint unsigned NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '0',
  `from_email` varchar(190) DEFAULT NULL,
  `from_name` varchar(120) DEFAULT NULL,
  `smtp_host` varchar(190) NOT NULL DEFAULT 'smtp.gmail.com',
  `smtp_port` smallint unsigned NOT NULL DEFAULT '465',
  `smtp_secure` tinyint(1) NOT NULL DEFAULT '1',
  `smtp_user` varchar(190) DEFAULT NULL,
  `smtp_password_enc` text,
  `reply_to` varchar(190) DEFAULT NULL,
  `notify_email` varchar(500) DEFAULT NULL COMMENT 'Avisos internos; varios separados por coma',
  `site_url` varchar(255) DEFAULT NULL COMMENT 'Base de los enlaces de los correos',
  `rating_confirmation` tinyint(1) NOT NULL DEFAULT '1',
  `updated_by` bigint unsigned DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `map_extras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `map_extras` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `matrix_ref` varchar(16) DEFAULT NULL COMMENT 'ID de la fila en la Matriz (GR-0xx)',
  `slug` varchar(160) NOT NULL,
  `name` varchar(180) NOT NULL,
  `category` varchar(80) NOT NULL COMMENT 'Categoría de la Matriz (Institucional, Salud…)',
  `zone` varchar(120) DEFAULT NULL COMMENT 'Zona o referencia tal como está en la Matriz',
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `maps_url` varchar(500) DEFAULT NULL,
  `map_icon` varchar(40) NOT NULL DEFAULT 'parque',
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `summary` varchar(320) DEFAULT NULL,
  `description` text,
  `location_detail` varchar(180) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(40) DEFAULT NULL,
  `whatsapp` varchar(40) DEFAULT NULL,
  `email` varchar(190) DEFAULT NULL,
  `website` varchar(500) DEFAULT NULL,
  `hours_text` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_map_extras_slug` (`slug`),
  UNIQUE KEY `uq_map_extras_ref` (`matrix_ref`),
  KEY `idx_map_extras_published` (`is_published`,`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Lugares del mapa sin ficha (puntos complementarios de la Matriz)';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `media` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `storage_disk` varchar(30) NOT NULL DEFAULT 'local',
  `storage_path` varchar(500) NOT NULL,
  `public_url` varchar(1000) DEFAULT NULL,
  `mime_type` varchar(100) NOT NULL,
  `width_px` int unsigned DEFAULT NULL,
  `height_px` int unsigned DEFAULT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `caption` varchar(500) DEFAULT NULL,
  `credit` varchar(255) DEFAULT NULL,
  `source` enum('drive','upload','figma','external') NOT NULL DEFAULT 'upload',
  `source_ref` varchar(255) DEFAULT NULL COMMENT 'ID del archivo en Drive/Figma, si aplica',
  `checksum_sha256` char(64) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_media_path` (`storage_disk`,`storage_path`),
  UNIQUE KEY `uq_media_source_ref` (`source`,`source_ref`),
  KEY `idx_media_mime` (`mime_type`)
) ENGINE=InnoDB AUTO_INCREMENT=399 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Inventario central de fotos; las tablas de contenido referencian media.id';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `navigation_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `navigation_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `location` enum('header','explore','footer','quick') NOT NULL,
  `label` varchar(120) NOT NULL,
  `path` varchar(500) NOT NULL,
  `parent_id` int unsigned DEFAULT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  `is_external` tinyint(1) NOT NULL DEFAULT '0',
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_navigation_location` (`location`,`is_published`,`sort_order`),
  KEY `fk_navigation_parent` (`parent_id`),
  CONSTRAINT `fk_navigation_parent` FOREIGN KEY (`parent_id`) REFERENCES `navigation_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `opening_hours`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `opening_hours` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `establishment_id` bigint unsigned NOT NULL,
  `day_of_week` tinyint unsigned NOT NULL COMMENT '1 = lunes … 7 = domingo',
  `opens_at` time DEFAULT NULL,
  `closes_at` time DEFAULT NULL,
  `is_closed` tinyint(1) NOT NULL DEFAULT '0',
  `note` varchar(160) DEFAULT NULL,
  `sort_order` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_opening_hours_slot` (`establishment_id`,`day_of_week`,`sort_order`),
  KEY `idx_opening_hours_day` (`establishment_id`,`day_of_week`),
  CONSTRAINT `fk_opening_hours_establishment` FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_opening_hours_day` CHECK ((`day_of_week` between 1 and 7)),
  CONSTRAINT `chk_opening_hours_times` CHECK (((`is_closed` = 1) or ((`opens_at` is not null) and (`closes_at` is not null))))
) ENGINE=InnoDB AUTO_INCREMENT=645 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Horario normalizado; admite varios turnos por día';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `opening_hours_exceptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `opening_hours_exceptions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `establishment_id` bigint unsigned NOT NULL,
  `exception_date` date NOT NULL,
  `is_closed` tinyint(1) NOT NULL DEFAULT '1',
  `opens_at` time DEFAULT NULL,
  `closes_at` time DEFAULT NULL,
  `note` varchar(160) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_opening_exception` (`establishment_id`,`exception_date`),
  CONSTRAINT `fk_opening_exceptions_establishment` FOREIGN KEY (`establishment_id`) REFERENCES `establishments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_opening_exception_times` CHECK (((`is_closed` = 1) or ((`opens_at` is not null) and (`closes_at` is not null))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Festivos, cierres temporales y horarios especiales';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `page_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `page_images` (
  `media_id` bigint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`media_id`),
  CONSTRAINT `fk_page_images_media` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `payment_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_methods` (
  `id` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(60) NOT NULL,
  `name` varchar(80) NOT NULL,
  `sort_order` tinyint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_methods_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `preparation_tips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `preparation_tips` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(160) NOT NULL,
  `description` varchar(800) NOT NULL,
  `icon` varchar(40) DEFAULT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `rating_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rating_stats` (
  `target_type` enum('establishment','experience') NOT NULL,
  `target_id` bigint unsigned NOT NULL,
  `average` decimal(3,2) NOT NULL DEFAULT '0.00',
  `votes` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`target_type`,`target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ratings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `target_type` enum('establishment','experience') NOT NULL,
  `target_id` bigint unsigned NOT NULL,
  `voter_name` varchar(80) NOT NULL,
  `voter_email` varchar(160) NOT NULL,
  `stars` tinyint unsigned NOT NULL,
  `comment_text` text,
  `status` enum('pending','confirmed') NOT NULL DEFAULT 'confirmed',
  `pending_stars` tinyint unsigned DEFAULT NULL,
  `pending_comment` text,
  `pending_name` varchar(80) DEFAULT NULL,
  `confirm_token_hash` char(64) DEFAULT NULL,
  `confirm_expires_at` datetime DEFAULT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rating_voter` (`target_type`,`target_id`,`voter_email`),
  UNIQUE KEY `uq_rating_confirm_token` (`confirm_token_hash`),
  CONSTRAINT `chk_rating_stars` CHECK ((`stars` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`gramalote`@`%`*/ /*!50003 TRIGGER `trg_ratings_ai` AFTER INSERT ON `ratings` FOR EACH ROW REPLACE INTO rating_stats (target_type, target_id, average, votes)
  SELECT NEW.target_type, NEW.target_id, COALESCE(ROUND(AVG(stars), 2), 0), COUNT(*)
  FROM ratings WHERE target_type = NEW.target_type AND target_id = NEW.target_id AND status = 'confirmed'; */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`gramalote`@`%`*/ /*!50003 TRIGGER `trg_ratings_au` AFTER UPDATE ON `ratings` FOR EACH ROW REPLACE INTO rating_stats (target_type, target_id, average, votes)
  SELECT NEW.target_type, NEW.target_id, COALESCE(ROUND(AVG(stars), 2), 0), COUNT(*)
  FROM ratings WHERE target_type = NEW.target_type AND target_id = NEW.target_id AND status = 'confirmed'; */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`gramalote`@`%`*/ /*!50003 TRIGGER `trg_ratings_ad` AFTER DELETE ON `ratings` FOR EACH ROW REPLACE INTO rating_stats (target_type, target_id, average, votes)
  SELECT OLD.target_type, OLD.target_id, COALESCE(ROUND(AVG(stars), 2), 0), COUNT(*)
  FROM ratings WHERE target_type = OLD.target_type AND target_id = OLD.target_id AND status = 'confirmed'; */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
DROP TABLE IF EXISTS `safety_tips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `safety_tips` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(160) NOT NULL,
  `description` varchar(800) NOT NULL,
  `icon` varchar(40) DEFAULT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `schema_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schema_migrations` (
  `name` varchar(180) NOT NULL,
  `checksum` char(64) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `search_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `search_documents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `entity_type` enum('establishment','experience','curiosity','history','practical','contact') NOT NULL,
  `entity_id` bigint unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` mediumtext NOT NULL,
  `url` varchar(500) NOT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_search_entity` (`entity_type`,`entity_id`),
  FULLTEXT KEY `ft_search_documents` (`title`,`body`)
) ENGINE=InnoDB AUTO_INCREMENT=255 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Se actualiza desde la API al guardar contenido; permite buscar en todo el sitio';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(80) NOT NULL,
  `name` varchar(120) NOT NULL,
  `icon` varchar(40) DEFAULT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_services_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Servicios de alojamiento y otras comodidades filtrables';
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `site_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_settings` (
  `setting_key` varchar(80) NOT NULL,
  `setting_value` json NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `transport_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_options` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(160) NOT NULL,
  `description` varchar(800) NOT NULL,
  `media_id` bigint unsigned DEFAULT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `fk_transport_options_media` (`media_id`),
  CONSTRAINT `fk_transport_options_media` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `useful_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `useful_contacts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(160) NOT NULL,
  `description` varchar(800) NOT NULL,
  `phone` varchar(40) DEFAULT NULL,
  `phone_secondary` varchar(40) DEFAULT NULL,
  `email` varchar(190) DEFAULT NULL,
  `hours` varchar(160) DEFAULT NULL,
  `media_id` bigint unsigned DEFAULT NULL,
  `sort_order` smallint unsigned NOT NULL DEFAULT '0',
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `fk_useful_contacts_media` (`media_id`),
  CONSTRAINT `fk_useful_contacts_media` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `v_public_curiosities`;
/*!50001 DROP VIEW IF EXISTS `v_public_curiosities`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_public_curiosities` AS SELECT 
 1 AS `section_id`,
 1 AS `slug`,
 1 AS `eyebrow`,
 1 AS `title`,
 1 AS `summary`,
 1 AS `cta_label`,
 1 AS `media_id`,
 1 AS `sort_order`,
 1 AS `curiosity_id`,
 1 AS `intro_title`,
 1 AS `intro_text`,
 1 AS `closing_title`,
 1 AS `closing_text`,
 1 AS `closing_media_side`,
 1 AS `closing_media_id`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `v_public_establishments`;
/*!50001 DROP VIEW IF EXISTS `v_public_establishments`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_public_establishments` AS SELECT 
 1 AS `id`,
 1 AS `slug`,
 1 AS `name`,
 1 AS `category_slug`,
 1 AS `category_name`,
 1 AS `type_slug`,
 1 AS `type_name`,
 1 AS `filter_group`,
 1 AS `zone_slug`,
 1 AS `zone_name`,
 1 AS `location_detail`,
 1 AS `summary`,
 1 AS `description`,
 1 AS `address`,
 1 AS `latitude`,
 1 AS `longitude`,
 1 AS `map_icon`,
 1 AS `maps_url`,
 1 AS `phone`,
 1 AS `whatsapp`,
 1 AS `email`,
 1 AS `website`,
 1 AS `hours_text`,
 1 AS `checkin_text`,
 1 AS `price_text`,
 1 AS `price_min_cop`,
 1 AS `price_max_cop`,
 1 AS `is_featured`,
 1 AS `sort_order`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `v_public_experiences`;
/*!50001 DROP VIEW IF EXISTS `v_public_experiences`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_public_experiences` AS SELECT 
 1 AS `id`,
 1 AS `slug`,
 1 AS `title`,
 1 AS `category_slug`,
 1 AS `category_name`,
 1 AS `summary`,
 1 AS `card_text`,
 1 AS `meta_text`,
 1 AS `description`,
 1 AS `hours_text`,
 1 AS `address`,
 1 AS `access_text`,
 1 AS `zone_slug`,
 1 AS `zone_name`,
 1 AS `latitude`,
 1 AS `longitude`,
 1 AS `maps_url`,
 1 AS `map_icon`,
 1 AS `parking_text`,
 1 AS `phone`,
 1 AS `whatsapp`,
 1 AS `email`,
 1 AS `website`,
 1 AS `duration_minutes`,
 1 AS `difficulty`,
 1 AS `difficulty_text`,
 1 AS `price_text`,
 1 AS `open_daily`,
 1 AS `is_featured`,
 1 AS `sort_order`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `zones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `zones` (
  `id` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(40) NOT NULL,
  `name` varchar(80) NOT NULL,
  `color` varchar(20) NOT NULL DEFAULT '#486284',
  `geojson` json DEFAULT NULL COMMENT 'Polígono/GeoJSON opcional para el mapa',
  `sort_order` tinyint unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_zones_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Gramalote Nuevo, Gramalote Viejo y futuras zonas del mapa';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50001 DROP VIEW IF EXISTS `v_public_curiosities`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_public_curiosities` AS select `s`.`id` AS `section_id`,`s`.`slug` AS `slug`,`s`.`eyebrow` AS `eyebrow`,`s`.`title` AS `title`,`s`.`summary` AS `summary`,`s`.`cta_label` AS `cta_label`,`s`.`media_id` AS `media_id`,`s`.`sort_order` AS `sort_order`,`c`.`id` AS `curiosity_id`,`c`.`intro_title` AS `intro_title`,`c`.`intro_text` AS `intro_text`,`c`.`closing_title` AS `closing_title`,`c`.`closing_text` AS `closing_text`,`c`.`closing_media_side` AS `closing_media_side`,`c`.`closing_media_id` AS `closing_media_id` from (`curiosity_sections` `s` join `curiosities` `c` on((`c`.`section_id` = `s`.`id`))) where ((`s`.`is_published` = 1) and (`s`.`deleted_at` is null)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `v_public_establishments`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`gramalote`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `v_public_establishments` AS select `e`.`id` AS `id`,`e`.`slug` AS `slug`,`e`.`name` AS `name`,`c`.`slug` AS `category_slug`,`c`.`name` AS `category_name`,`t`.`slug` AS `type_slug`,`t`.`name` AS `type_name`,`t`.`filter_group` AS `filter_group`,`z`.`slug` AS `zone_slug`,`z`.`name` AS `zone_name`,`e`.`location_detail` AS `location_detail`,`e`.`summary` AS `summary`,`e`.`description` AS `description`,`e`.`address` AS `address`,`e`.`latitude` AS `latitude`,`e`.`longitude` AS `longitude`,`e`.`map_icon` AS `map_icon`,`e`.`maps_url` AS `maps_url`,`e`.`phone` AS `phone`,`e`.`whatsapp` AS `whatsapp`,`e`.`email` AS `email`,`e`.`website` AS `website`,`e`.`hours_text` AS `hours_text`,`e`.`checkin_text` AS `checkin_text`,`e`.`price_text` AS `price_text`,`e`.`price_min_cop` AS `price_min_cop`,`e`.`price_max_cop` AS `price_max_cop`,`e`.`is_featured` AS `is_featured`,`e`.`sort_order` AS `sort_order` from (((`establishments` `e` join `establishment_categories` `c` on((`c`.`id` = `e`.`category_id`))) left join `establishment_types` `t` on((`t`.`id` = `e`.`type_id`))) left join `zones` `z` on((`z`.`id` = `e`.`zone_id`))) where ((`e`.`is_published` = 1) and (`e`.`deleted_at` is null)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `v_public_experiences`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`gramalote`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `v_public_experiences` AS select `x`.`id` AS `id`,`x`.`slug` AS `slug`,`x`.`title` AS `title`,`c`.`slug` AS `category_slug`,`c`.`name` AS `category_name`,`x`.`summary` AS `summary`,`x`.`card_text` AS `card_text`,`x`.`meta_text` AS `meta_text`,`x`.`description` AS `description`,`x`.`hours_text` AS `hours_text`,`x`.`address` AS `address`,`x`.`access_text` AS `access_text`,`z`.`slug` AS `zone_slug`,`z`.`name` AS `zone_name`,`x`.`latitude` AS `latitude`,`x`.`longitude` AS `longitude`,`x`.`maps_url` AS `maps_url`,`x`.`map_icon` AS `map_icon`,`x`.`parking_text` AS `parking_text`,`x`.`phone` AS `phone`,`x`.`whatsapp` AS `whatsapp`,`x`.`email` AS `email`,`x`.`website` AS `website`,`x`.`duration_minutes` AS `duration_minutes`,`x`.`difficulty` AS `difficulty`,`x`.`difficulty_text` AS `difficulty_text`,`x`.`price_text` AS `price_text`,`x`.`open_daily` AS `open_daily`,`x`.`is_featured` AS `is_featured`,`x`.`sort_order` AS `sort_order` from ((`experiences` `x` left join `experience_categories` `c` on((`c`.`id` = `x`.`category_id`))) left join `zones` `z` on((`z`.`id` = `x`.`zone_id`))) where ((`x`.`is_published` = 1) and (`x`.`deleted_at` is null)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

