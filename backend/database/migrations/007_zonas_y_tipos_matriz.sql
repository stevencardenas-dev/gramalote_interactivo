-- ============================================================================
-- 007 · Zonas y subcategorías según la Matriz del 30 de octubre
--
-- · Zonas de las fichas: «Casco urbano nuevo» (antes «Gramalote Nuevo») y
--   «Vereda / zona rural» (nueva). «Gramalote Viejo» se conserva porque la usan
--   las experiencias, pero ninguna ficha de establecimiento queda en ella.
-- · Subcategorías: las de la Matriz. Los tipos que queden sin fichas se borran.
-- ============================================================================

SET NAMES utf8mb4;

UPDATE zones SET name = 'Casco urbano nuevo' WHERE slug = 'nuevo';
INSERT INTO zones (slug, name, color, sort_order)
  SELECT 'rural', 'Vereda / zona rural', '#5b8c5a', 3 FROM DUAL
  WHERE NOT EXISTS (SELECT 1 FROM zones WHERE slug = 'rural');

INSERT IGNORE INTO establishment_types (category_id, slug, name, filter_group, sort_order) VALUES
  (1, 'comida-ejecutiva', 'Comida ejecutiva', 'Comida típica', 9),
  (3, 'artesania', 'Artesanía', 'Artesanía', 1),
  (3, 'otro', 'Otro', 'Otro', 2);
UPDATE establishment_types SET filter_group = 'Restaurantes' WHERE category_id = 1 AND slug = 'restaurante';

-- EST-01 · Glamping Vista Antigua: Vereda / zona rural / Glamping
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'rural'), type_id = (SELECT id FROM establishment_types WHERE category_id = 2 AND slug = 'glamping') WHERE slug = 'glamping-vista-antigua';
-- EST-02 · Verdeser Glampings: Vereda / zona rural / Glamping
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'rural'), type_id = (SELECT id FROM establishment_types WHERE category_id = 2 AND slug = 'glamping') WHERE slug = 'verdeser-glampings';
-- EST-03 · Hostal Campestre Camino Real: Vereda / zona rural / Hostal
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'rural'), type_id = (SELECT id FROM establishment_types WHERE category_id = 2 AND slug = 'hostal') WHERE slug = 'hostal-campestre-camino-real';
-- EST-04 · Hostal Luna Azul: Casco urbano nuevo / Hostal
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'nuevo'), type_id = (SELECT id FROM establishment_types WHERE category_id = 2 AND slug = 'hostal') WHERE slug = 'hostal-luna-azul';
-- EST-05 · Casa Hiedra Hotel Boutique: Casco urbano nuevo / Hotel boutique
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'nuevo'), type_id = (SELECT id FROM establishment_types WHERE category_id = 2 AND slug = 'hotel-boutique') WHERE slug = 'casa-hiedra-hotel-boutique';
-- EST-06 · Cabañas El Peñón: Vereda / zona rural / Cabañas
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'rural'), type_id = (SELECT id FROM establishment_types WHERE category_id = 2 AND slug = 'cabanas') WHERE slug = 'cabanas-el-penon';
-- EST-08 · Chelinarte: Casco urbano nuevo / Artesanía
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'nuevo'), type_id = (SELECT id FROM establishment_types WHERE category_id = 3 AND slug = 'artesania') WHERE slug = 'chelinarte';
-- EST-09 · Creaciones Martina: Vereda / zona rural / Artesanía
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'rural'), type_id = (SELECT id FROM establishment_types WHERE category_id = 3 AND slug = 'artesania') WHERE slug = 'creaciones-martina';
-- EST-10 · ArteLu: Casco urbano nuevo / Artesanía
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'nuevo'), type_id = (SELECT id FROM establishment_types WHERE category_id = 3 AND slug = 'artesania') WHERE slug = 'artelu';
-- EST-11 · Mi Hermoso Edén: Vereda / zona rural / Artesanía
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'rural'), type_id = (SELECT id FROM establishment_types WHERE category_id = 3 AND slug = 'artesania') WHERE slug = 'mi-hermoso-eden';
-- EST-12 · Maestros de la Madera: Casco urbano nuevo / Artesanía
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'nuevo'), type_id = (SELECT id FROM establishment_types WHERE category_id = 3 AND slug = 'artesania') WHERE slug = 'maestros-de-la-madera';
-- EST-13 · Mi Gordita Bella: Vereda / zona rural / Artesanía
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'rural'), type_id = (SELECT id FROM establishment_types WHERE category_id = 3 AND slug = 'artesania') WHERE slug = 'mi-gordita-bella';
-- EST-14 · Yawart: Casco urbano nuevo / Artesanía
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'nuevo'), type_id = (SELECT id FROM establishment_types WHERE category_id = 3 AND slug = 'artesania') WHERE slug = 'yawart';
-- EST-15 · Caliopes: Vereda / zona rural / Artesanía
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'rural'), type_id = (SELECT id FROM establishment_types WHERE category_id = 3 AND slug = 'artesania') WHERE slug = 'caliopes';
-- EST-16 · Bisutería MG: Vereda / zona rural / Artesanía
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'rural'), type_id = (SELECT id FROM establishment_types WHERE category_id = 3 AND slug = 'artesania') WHERE slug = 'bisuteria-mg';
-- EST-17 · Sombreros TECHA: Casco urbano nuevo / Artesanía
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'nuevo'), type_id = (SELECT id FROM establishment_types WHERE category_id = 3 AND slug = 'artesania') WHERE slug = 'sombreros-techa';
-- EST-18 · Aroma Twins: Casco urbano nuevo / Otro
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'nuevo'), type_id = (SELECT id FROM establishment_types WHERE category_id = 3 AND slug = 'otro') WHERE slug = 'aroma-twins';
-- EST-019 · Bambú: Casco urbano nuevo / Comidas rápidas
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'nuevo'), type_id = (SELECT id FROM establishment_types WHERE category_id = 1 AND slug = 'comidas-rapidas') WHERE slug = 'bambu';
-- EST-020 · Dulce Paseo: Casco urbano nuevo / Cafetería
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'nuevo'), type_id = (SELECT id FROM establishment_types WHERE category_id = 1 AND slug = 'cafeteria') WHERE slug = 'dulce-paseo';
-- EST-021 · Doña Claudia: Casco urbano nuevo / Comida casera
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'nuevo'), type_id = (SELECT id FROM establishment_types WHERE category_id = 1 AND slug = 'comida-casera') WHERE slug = 'dona-claudia';
-- EST-022 · Fresas con Crema Carvajal S.A.S.: Vereda / zona rural / Postres
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'rural'), type_id = (SELECT id FROM establishment_types WHERE category_id = 1 AND slug = 'postres') WHERE slug = 'fresas-con-crema-carvajal';
-- EST-023 · La Comarca: Casco urbano nuevo / Heladería
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'nuevo'), type_id = (SELECT id FROM establishment_types WHERE category_id = 1 AND slug = 'heladeria') WHERE slug = 'la-comarca';
-- EST-024 · La Sazón de la Tía: Casco urbano nuevo / Comida ejecutiva
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'nuevo'), type_id = (SELECT id FROM establishment_types WHERE category_id = 1 AND slug = 'comida-ejecutiva') WHERE slug = 'la-sazon-de-la-tia';
-- EST-025 · Lonchería Romero: Casco urbano nuevo / Restaurante
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'nuevo'), type_id = (SELECT id FROM establishment_types WHERE category_id = 1 AND slug = 'restaurante') WHERE slug = 'loncheria-romero';
-- EST-026 · Origen Cocina de Autor: Casco urbano nuevo / Restaurante
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'nuevo'), type_id = (SELECT id FROM establishment_types WHERE category_id = 1 AND slug = 'restaurante') WHERE slug = 'origen-cocina-de-autor';
-- EST-027 · El Sabor Gramalotero: Casco urbano nuevo / Restaurante
UPDATE establishments SET zone_id = (SELECT id FROM zones WHERE slug = 'nuevo'), type_id = (SELECT id FROM establishment_types WHERE category_id = 1 AND slug = 'restaurante') WHERE slug = 'el-sabor-gramalotero';

-- Tipos que ya no usa ninguna ficha
DELETE FROM establishment_types
WHERE slug IN ('hostal-campestre','comida-tipica','cocina-de-autor','tejidos-accesorios',
               'perfumeria-artesanal','regalos-manualidades','decoracion-hogar',
               'artesanias-madera','detalles-accesorios')
  AND NOT EXISTS (SELECT 1 FROM establishments e WHERE e.type_id = establishment_types.id);

-- Buscador: el cuerpo incluye tipo y zona
INSERT INTO search_documents (entity_type, entity_id, title, body, url, is_published)
SELECT 'establishment', e.id, e.name,
       CONCAT_WS(' ', e.summary, e.description, COALESCE(e.address, ''),
                 COALESCE(t.name, ''), COALESCE(z.name, '')),
       CONCAT('/establecimiento/', e.slug), e.is_published
FROM establishments e
LEFT JOIN establishment_types t ON t.id = e.type_id
LEFT JOIN zones z ON z.id = e.zone_id
WHERE e.deleted_at IS NULL
ON DUPLICATE KEY UPDATE
  title = VALUES(title), body = VALUES(body), url = VALUES(url),
  is_published = VALUES(is_published);
