-- ============================================================================
-- 010 · Los platos de «Dónde comer» pasan a ser productos
--
-- Las fichas de comer mostraban su oferta desde `establishment_features`
-- (título, descripción y foto, sin precio), mientras que «Productos» del panel
-- estaba vacío. Ahora la oferta vive en `establishment_products` (nombre, precio,
-- descripción y foto de la galería) y el sitio la muestra igual que antes.
--
-- Se copian solo las fichas de comer que tienen platos y ningún producto; luego
-- se borran esos platos para no editar dos listas. La foto es la misma (media_id),
-- así que la galería no cambia. Es idempotente: una segunda ejecución no copia nada.
-- ============================================================================

SET NAMES utf8mb4;

INSERT INTO establishment_products
  (establishment_id, name, description, price_cop, media_id, sort_order, is_active)
SELECT f.establishment_id, f.title, f.description, NULL, f.media_id, f.sort_order, 1
FROM establishment_features f
JOIN establishments e ON e.id = f.establishment_id
JOIN establishment_categories c ON c.id = e.category_id
WHERE c.slug = 'comer'
  AND e.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM establishment_products p WHERE p.establishment_id = f.establishment_id
  )
ORDER BY f.establishment_id, f.sort_order, f.id;

DELETE f FROM establishment_features f
JOIN establishments e ON e.id = f.establishment_id
JOIN establishment_categories c ON c.id = e.category_id
WHERE c.slug = 'comer'
  AND EXISTS (
    SELECT 1 FROM establishment_products p WHERE p.establishment_id = f.establishment_id
  );
