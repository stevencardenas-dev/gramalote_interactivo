-- Fotografías de Patrimonio y Extras: dos usos y una sola portada.
--
-- * Patrimonio: en el panel desaparecen «Histórica», «Actual» y «Detalle».
--   Todas pasan a «Galería» y conservan su época; las que tienen época forman
--   el carrusel de la ficha y el resto, la cuadrícula de fotos.
-- * Extras: su única foto es la portada del punto en el mapa. Si alguna ficha
--   tenía más de una, se conserva la primera como portada y se sueltan las
--   demás asociaciones; los archivos siguen en la biblioteca de medios.

UPDATE heritage_images
SET role = 'gallery'
WHERE role NOT IN ('cover', 'gallery');

UPDATE extra_images
SET role = 'cover'
WHERE id IN (
  SELECT primera FROM (
    SELECT MIN(id) AS primera FROM extra_images GROUP BY extra_id
  ) AS portadas
);

DELETE FROM extra_images
WHERE role <> 'cover';
