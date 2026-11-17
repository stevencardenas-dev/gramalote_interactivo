-- La Estatua de Secundino Jácome sale del mapa interactivo (/mapa); sigue en el
-- apartado de Patrimonio (Historia). Y la Estatua de Laureano Gómez usa el
-- enlace de Google Maps validado de su ficha.
UPDATE heritage_sites
   SET is_published = 0
 WHERE slug = 'estatua-de-secundino-jacome';

UPDATE heritage_sites
   SET maps_url = 'https://maps.app.goo.gl/Eej6XoywhVfRkx8v7'
 WHERE slug = 'estatua-de-laureano-gomez';
