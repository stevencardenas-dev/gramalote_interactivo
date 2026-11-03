-- ============================================================================
-- 009 · Publica El Sabor Gramalotero (ficha 26 de la Matriz)
--
-- La Matriz del 30 de octubre trae 25 fichas «listas» y El Sabor Gramalotero
-- como «pendiente de la Alcaldía». Ya tiene todos sus datos (006/008); lo único
-- que le faltaba era foto de portada, que se importa desde media-seed
-- (imagen de stock con licencia CC BY 4.0, ver docs/CREDITOS-IMAGENES.md).
-- Se reemplaza por una foto propia cuando la Alcaldía la entregue.
-- ============================================================================

SET NAMES utf8mb4;

UPDATE establishments
SET summary = 'Comidas rápidas y almuerzos, una mezcla cultural entre costeña y gramalotera.',
    description = 'Comidas rápidas y almuerzos, una mezcla cultural entre costeña y gramalotera. Hamburguesas, papas, perros calientes y arepa burger, con precios entre $25.000 y $216.000. Abre de viernes a domingo, de 5 p. m. a 10 p. m.',
    is_published = 1, published_at = COALESCE(published_at, NOW())
WHERE slug = 'el-sabor-gramalotero';

UPDATE search_documents sd
JOIN establishments e ON e.id = sd.entity_id AND sd.entity_type = 'establishment'
SET sd.is_published = e.is_published,
    sd.body = CONCAT_WS(' ', e.summary, e.description, COALESCE(e.address, ''))
WHERE e.slug = 'el-sabor-gramalotero';
