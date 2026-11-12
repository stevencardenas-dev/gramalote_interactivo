-- Lugares sin ubicación confirmada en Google Maps (o con un pin incorrecto):
-- los seis extras que no traen enlace en la matriz y el Centro de salud, cuyo
-- enlace apunta al casco antiguo. Se despublican hasta recibir el pin exacto.
UPDATE map_extras
SET is_published = 0
WHERE matrix_ref IN ('GR-046', 'GR-047', 'GR-048', 'GR-053', 'GR-054', 'GR-057', 'GR-058');

-- Las fichas que ya estaban despublicadas antes de este cambio se marcan para
-- no confundirlas con las que se despublican ahora por falta de ubicación.
UPDATE establishments
SET name = CONCAT(name, ' (Faltaron datos)')
WHERE is_published = 0
  AND deleted_at IS NULL
  AND name NOT LIKE '%(Faltaron datos)%';
