-- La marca del sitio y de los correos pasa de «Gramalote Interactivo» a
-- «Turismo Gramalote». Solo se cambian los valores que quedaron con el nombre
-- anterior; un remitente personalizado se respeta.

UPDATE mail_settings
SET from_name = 'Turismo Gramalote'
WHERE from_name IS NULL OR from_name = '' OR from_name = 'Gramalote Interactivo';

UPDATE site_settings
SET value = JSON_SET(value, '$.value', 'Turismo Gramalote')
WHERE `key` = 'site.name'
  AND JSON_UNQUOTE(JSON_EXTRACT(value, '$.value')) = 'Gramalote Interactivo';
