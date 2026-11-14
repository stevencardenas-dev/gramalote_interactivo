-- La marca del sitio y de los correos pasa de «Gramalote Interactivo» a
-- «Turismo Gramalote». Solo se cambian los valores que quedaron con el nombre
-- anterior; un remitente personalizado se respeta.
--
-- site_settings guarda la clave en `setting_key` (no en `key`): con el nombre
-- viejo la migración fallaba y frenaba todas las siguientes.

UPDATE mail_settings
SET from_name = 'Turismo Gramalote'
WHERE from_name IS NULL OR from_name = '' OR from_name = 'Gramalote Interactivo';

UPDATE site_settings
SET setting_value = JSON_SET(setting_value, '$.value', 'Turismo Gramalote')
WHERE setting_key = 'site.name'
  AND JSON_UNQUOTE(JSON_EXTRACT(setting_value, '$.value')) = 'Gramalote Interactivo';
