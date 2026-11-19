-- ============================================================================
-- 035 · Productos de Dónde comprar solo con foto
--
-- En Dónde comprar los productos pasan a ser solo fotos: se vacían su nombre,
-- precio y descripción. La foto (media_id) y el orden se conservan. El nombre
-- es NOT NULL, así que queda como texto vacío.
-- ============================================================================

SET NAMES utf8mb4;

UPDATE establishment_products p
JOIN establishments e ON e.id = p.establishment_id
JOIN establishment_categories c ON c.id = e.category_id
SET p.name = '',
    p.description = NULL,
    p.price_cop = NULL
WHERE c.slug = 'comprar';
