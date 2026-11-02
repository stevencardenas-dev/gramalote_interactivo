-- ============================================================================
-- 008 · Origen Cocina de Autor y El Sabor Gramalotero ya existían (migración 002)
--
-- La 006 solo las dio de alta si no existían, así que sus datos de la Matriz no
-- se aplicaron. Aquí se aplican; Origen se publica (la Matriz la marca lista) y
-- El Sabor Gramalotero sigue sin publicar (pendiente de la Alcaldía).
-- ============================================================================

SET NAMES utf8mb4;

UPDATE establishments
SET address = 'Manzana 18, lote 11, barrio Los Santos',
    hours_text = 'Mar–dom, 12–3 p. m. y 6–10 p. m.',
    price_text = '$20.000 – $40.000', price_min_cop = NULL, price_max_cop = NULL,
    latitude = 7.9174536, longitude = -72.7878984,
    is_published = 1, published_at = COALESCE(published_at, NOW())
WHERE slug = 'origen-cocina-de-autor';

UPDATE establishments
SET address = 'MZ 13 CASA 7 LOS SANTOS',
    hours_text = 'Viernes a domingo de 5pm a 10pm',
    price_text = '$25.000 – $216.000', price_min_cop = NULL, price_max_cop = NULL
WHERE slug = 'el-sabor-gramalotero';

UPDATE search_documents sd
JOIN establishments e ON e.id = sd.entity_id AND sd.entity_type = 'establishment'
SET sd.is_published = e.is_published
WHERE e.slug IN ('origen-cocina-de-autor', 'el-sabor-gramalotero');
