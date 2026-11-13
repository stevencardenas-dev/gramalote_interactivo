-- Pines alineados con los enlaces de la Matriz del mapa (GR-043, GR-015 y
-- GR-056). Las coordenadas salen del punto que publica cada enlace corto.
--
-- Las ruinas del antiguo Gramalote: el enlace de la matriz (GR-043) apunta a
-- 7.9015955, -72.7983908; el pin seguía en el punto anterior (7.8878061).
UPDATE experiences
SET latitude = 7.9015955,
    longitude = -72.7983908,
    maps_url = 'https://maps.app.goo.gl/mhtTmzAU2BCD6jDaA'
WHERE slug = 'ruinas-antiguo-gramalote';

-- Café Marquetalia: el enlace de la matriz lleva una «t» en el código
-- (MeVwqt…); el guardado (MeVwq…) devolvía 404. Se corrige y se ajusta el pin
-- aproximado al punto exacto del enlace.
UPDATE experiences
SET latitude = 7.9341527,
    longitude = -72.7933709,
    maps_url = 'https://maps.app.goo.gl/MeVwqtCSUXvWWEbLA'
WHERE slug = 'cafe-marquetalia';

-- Coliseo Municipal: el pin estaba 783 m al norte del punto del enlace de la
-- matriz (GR-056).
UPDATE map_extras
SET latitude = 7.9144177,
    longitude = -72.7879130,
    maps_url = 'https://maps.app.goo.gl/uFpBEyAb7Pssixu46'
WHERE matrix_ref = 'GR-056';
