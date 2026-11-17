-- Fichas editables de Patrimonio y Extras (panel de administración).
--
-- * heritage_sites gana los campos de la ficha pública de Historia (subtítulo,
--   introducción, estado, datos de visita, fuentes…) y show_on_map, para separar
--   "se ve en la ficha de Historia" (is_published) de "se ve en /mapa".
-- * map_extras gana resumen, descripción y datos de contacto.
-- * heritage_images y extra_images enlazan fotos de media con un uso (portada,
--   histórica, actual, galería, detalle) y, en las históricas, la época.
-- * Se siembran con el contenido actual de Historia para que la base nazca igual
--   que el sitio. Es idempotente y no pisa lo editado: los textos solo se cargan
--   mientras la ficha no tenga contenido propio.
-- Generada con scripts de apoyo a partir de frontend/src/data/historia.js.

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'heritage_sites' AND COLUMN_NAME = 'show_on_map');
SET @sql := IF(@has = 0, 'ALTER TABLE heritage_sites ADD COLUMN show_on_map TINYINT(1) NOT NULL DEFAULT 1 COMMENT ''Se ve en /mapa (is_published controla la ficha de Historia)''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'heritage_sites' AND COLUMN_NAME = 'zone_key');
SET @sql := IF(@has = 0, 'ALTER TABLE heritage_sites ADD COLUMN zone_key VARCHAR(40) NULL COMMENT ''caldereros, gramalote-viejo o nuevo-gramalote''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'heritage_sites' AND COLUMN_NAME = 'zone_tag');
SET @sql := IF(@has = 0, 'ALTER TABLE heritage_sites ADD COLUMN zone_tag VARCHAR(120) NULL COMMENT ''Texto de la etiqueta de zona en la ficha''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'heritage_sites' AND COLUMN_NAME = 'ficha_category');
SET @sql := IF(@has = 0, 'ALTER TABLE heritage_sites ADD COLUMN ficha_category VARCHAR(80) NULL COMMENT ''Categoría que se muestra en la ficha (Patrimonio religioso…)''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'heritage_sites' AND COLUMN_NAME = 'status');
SET @sql := IF(@has = 0, 'ALTER TABLE heritage_sites ADD COLUMN status VARCHAR(40) NOT NULL DEFAULT ''Visitable'' COMMENT ''Visitable, Con restricciones o Solo memoria''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'heritage_sites' AND COLUMN_NAME = 'subtitle');
SET @sql := IF(@has = 0, 'ALTER TABLE heritage_sites ADD COLUMN subtitle VARCHAR(200) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'heritage_sites' AND COLUMN_NAME = 'intro');
SET @sql := IF(@has = 0, 'ALTER TABLE heritage_sites ADD COLUMN intro VARCHAR(600) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'heritage_sites' AND COLUMN_NAME = 'visit_location');
SET @sql := IF(@has = 0, 'ALTER TABLE heritage_sites ADD COLUMN visit_location VARCHAR(500) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'heritage_sites' AND COLUMN_NAME = 'visit_access');
SET @sql := IF(@has = 0, 'ALTER TABLE heritage_sites ADD COLUMN visit_access VARCHAR(300) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'heritage_sites' AND COLUMN_NAME = 'visit_recommendation');
SET @sql := IF(@has = 0, 'ALTER TABLE heritage_sites ADD COLUMN visit_recommendation VARCHAR(1000) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'heritage_sites' AND COLUMN_NAME = 'hours_text');
SET @sql := IF(@has = 0, 'ALTER TABLE heritage_sites ADD COLUMN hours_text VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'heritage_sites' AND COLUMN_NAME = 'address');
SET @sql := IF(@has = 0, 'ALTER TABLE heritage_sites ADD COLUMN address VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'heritage_sites' AND COLUMN_NAME = 'historical_period');
SET @sql := IF(@has = 0, 'ALTER TABLE heritage_sites ADD COLUMN historical_period VARCHAR(120) NULL COMMENT ''Época o años del bien (1910 – 1953…)''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'heritage_sites' AND COLUMN_NAME = 'sources');
SET @sql := IF(@has = 0, 'ALTER TABLE heritage_sites ADD COLUMN sources TEXT NULL COMMENT ''Fuentes consultadas''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'heritage_sites' AND COLUMN_NAME = 'coords_approx');
SET @sql := IF(@has = 0, 'ALTER TABLE heritage_sites ADD COLUMN coords_approx TINYINT(1) NOT NULL DEFAULT 0 COMMENT ''1 = ubicación aproximada''', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'map_extras' AND COLUMN_NAME = 'summary');
SET @sql := IF(@has = 0, 'ALTER TABLE map_extras ADD COLUMN summary VARCHAR(320) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'map_extras' AND COLUMN_NAME = 'description');
SET @sql := IF(@has = 0, 'ALTER TABLE map_extras ADD COLUMN description TEXT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'map_extras' AND COLUMN_NAME = 'location_detail');
SET @sql := IF(@has = 0, 'ALTER TABLE map_extras ADD COLUMN location_detail VARCHAR(180) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'map_extras' AND COLUMN_NAME = 'address');
SET @sql := IF(@has = 0, 'ALTER TABLE map_extras ADD COLUMN address VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'map_extras' AND COLUMN_NAME = 'phone');
SET @sql := IF(@has = 0, 'ALTER TABLE map_extras ADD COLUMN phone VARCHAR(40) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'map_extras' AND COLUMN_NAME = 'whatsapp');
SET @sql := IF(@has = 0, 'ALTER TABLE map_extras ADD COLUMN whatsapp VARCHAR(40) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'map_extras' AND COLUMN_NAME = 'email');
SET @sql := IF(@has = 0, 'ALTER TABLE map_extras ADD COLUMN email VARCHAR(190) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'map_extras' AND COLUMN_NAME = 'website');
SET @sql := IF(@has = 0, 'ALTER TABLE map_extras ADD COLUMN website VARCHAR(500) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'map_extras' AND COLUMN_NAME = 'hours_text');
SET @sql := IF(@has = 0, 'ALTER TABLE map_extras ADD COLUMN hours_text VARCHAR(255) NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS heritage_images (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  heritage_id  BIGINT UNSIGNED NOT NULL,
  media_id     BIGINT UNSIGNED NOT NULL,
  role         ENUM('cover', 'historic', 'current', 'gallery', 'detail') NOT NULL DEFAULT 'gallery',
  era_label    VARCHAR(60) NULL COMMENT 'Época de una foto histórica (1910 – 1953)',
  sort_order   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_heritage_image (heritage_id, media_id, role),
  KEY idx_heritage_images_order (heritage_id, role, sort_order),
  CONSTRAINT fk_heritage_images_site FOREIGN KEY (heritage_id) REFERENCES heritage_sites (id) ON DELETE CASCADE,
  CONSTRAINT fk_heritage_images_media FOREIGN KEY (media_id) REFERENCES media (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS extra_images (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  extra_id     BIGINT UNSIGNED NOT NULL,
  media_id     BIGINT UNSIGNED NOT NULL,
  role         ENUM('cover', 'current', 'gallery', 'detail') NOT NULL DEFAULT 'gallery',
  sort_order   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_extra_image (extra_id, media_id, role),
  KEY idx_extra_images_order (extra_id, role, sort_order),
  CONSTRAINT fk_extra_images_extra FOREIGN KEY (extra_id) REFERENCES map_extras (id) ON DELETE CASCADE,
  CONSTRAINT fk_extra_images_media FOREIGN KEY (media_id) REFERENCES media (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- La Estatua de Jácome sale de /mapa pero sigue en Historia (la migración 030 la
-- había despublicado). Lo que ya estaba publicado sigue viéndose en el mapa.
UPDATE heritage_sites SET show_on_map = is_published WHERE show_on_map = 1 AND is_published = 0;
UPDATE heritage_sites
   SET is_published = 1, show_on_map = 0, latitude = 7.8890000, longitude = -72.7976000, coords_approx = 1
 WHERE slug = 'estatua-de-secundino-jacome';

-- Ruinas del primer templo (Caldereros): sin fila en la Matriz; se ubica junto al
-- Puente Gregorio Montes y no aparece en /mapa hasta confirmar su ubicación.
INSERT IGNORE INTO heritage_sites
  (matrix_ref, slug, name, category, zone, latitude, longitude, maps_url, map_icon,
   sort_order, is_published, show_on_map, coords_approx)
VALUES
  ('GR-009', 'ruinas-del-primer-templo', 'Ruinas del primer templo (Pueblo Viejo)', 'Histórico', 'Caldereros',
   7.9022955, -72.7977908, 'https://www.google.com/maps/search/?api=1&query=7.9022955,-72.7977908',
   'monumento', 90, 1, 0, 1);

-- Contenido de cada ficha (solo si todavía no tiene resumen propio guardado).

UPDATE heritage_sites SET
  zone_key = 'gramalote-viejo', zone_tag = NULL, ficha_category = 'Patrimonio religioso',
  status = 'Con restricciones', subtitle = 'El corazón religioso del antiguo pueblo', intro = 'El templo que durante generaciones reunió la fe y la vida religiosa de los habitantes del antiguo Gramalote.',
  summary = 'Fue el centro religioso del antiguo casco urbano. Una torre agrietada permaneció en pie tras el movimiento del terreno, según las fuentes consultadas.', description = 'El templo de San Rafael fue uno de los principales referentes religiosos y arquitectónicos de Gramalote Viejo. Durante décadas, sus espacios acogieron celebraciones, encuentros comunitarios y acontecimientos importantes para la población.

El movimiento del terreno de 2010 causó graves daños en la estructura. Sus ruinas permanecen como testimonio de la historia religiosa del municipio y de la transformación que vivió su territorio.',
  visit_location = 'Antiguo casco urbano de Gramalote, sector de Gramalote Viejo.', visit_access = 'Con restricciones.',
  visit_recommendation = 'Consultar previamente con la Alcaldía las condiciones de seguridad y autorización. No acercarse ni ingresar a las ruinas sin permiso.'
WHERE slug = 'templo-san-rafael-antiguo' AND (description IS NULL OR description = '');

UPDATE heritage_sites SET
  zone_key = 'nuevo-gramalote', zone_tag = NULL, ficha_category = 'Patrimonio religioso',
  status = 'Con restricciones', subtitle = 'La fe que acompaña al nuevo pueblo', intro = 'Un nuevo espacio de encuentro que mantiene viva la tradición religiosa de la comunidad gramalotera.',
  summary = 'La comunidad sostiene la construcción del nuevo templo mediante donaciones de gramaloteros y benefactores.', description = 'Después de la tragedia de 2010, la comunidad tuvo que reconstruir los espacios que hacían parte de su vida colectiva. Entre ellos, el templo ocupó un lugar especial por su importancia religiosa y cultural.

La construcción del nuevo templo ha contado con el esfuerzo de los habitantes, gramaloteros y benefactores, mediante donaciones destinadas a recuperar un espacio de encuentro y celebración religiosa.',
  visit_location = 'Nuevo Gramalote.', visit_access = 'Con restricciones, según el inventario.',
  visit_recommendation = 'Consultar previamente las condiciones de ingreso y respetar los horarios y actividades religiosas.'
WHERE slug = 'templo-san-rafael-arcangel' AND (description IS NULL OR description = '');

UPDATE heritage_sites SET
  zone_key = 'nuevo-gramalote', zone_tag = NULL, ficha_category = 'Espacio público',
  status = 'Visitable', subtitle = 'El lugar donde vuelve a encontrarse la comunidad', intro = 'Un espacio de encuentro que conserva la memoria de la plaza y acompaña la vida cotidiana del nuevo municipio.',
  summary = 'Centro social del pueblo desde el trazado de 1884; la plaza actual tiene 4.300 m² configurada en terrazas urbanas integradas al valle.', description = 'La plaza ha sido históricamente uno de los principales escenarios de encuentro de los habitantes de Gramalote. En el antiguo municipio reunía actividades comerciales, celebraciones religiosas y acontecimientos de la vida pública.

En el Nuevo Gramalote, la Plaza de la Restauración cuenta, según el documento de contenidos, con aproximadamente 4.300 m² distribuidos en terrazas urbanas integradas al paisaje del valle. Hoy constituye uno de los espacios centrales de la vida comunitaria.',
  visit_location = 'Plaza principal, Nuevo Gramalote.', visit_access = 'Libre.',
  visit_recommendation = 'Visitar durante el día y recorrer respetuosamente sus espacios públicos.'
WHERE slug = 'plaza-de-la-restauracion' AND (description IS NULL OR description = '');

UPDATE heritage_sites SET
  zone_key = 'gramalote-viejo', zone_tag = NULL, ficha_category = 'Edificio histórico',
  status = 'Con restricciones', subtitle = 'La memoria de la administración municipal', intro = 'Un edificio que representó la organización administrativa y la vida institucional del antiguo municipio.',
  summary = 'Sede de la administración municipal desde 1903, quedó reducida a ruinas después de la tragedia de 2010.', description = 'La Casa Municipal Gregorio Montes fue sede de la administración de Gramalote desde 1903. Desde allí se desarrollaron actividades relacionadas con el gobierno local y la organización institucional del municipio.

Su estructura formó parte del paisaje urbano del antiguo pueblo. Después de la tragedia de 2010, el edificio quedó reducido a ruinas, que conservan el recuerdo de una de las construcciones representativas de la vida pública gramalotera.',
  visit_location = 'Antiguo casco urbano, Gramalote Viejo.', visit_access = 'Con restricciones.',
  visit_recommendation = 'No ingresar a las ruinas. Consultar con la Alcaldía si existe un punto seguro de observación y autorización para acercarse.'
WHERE slug = 'casa-municipal-gregorio-montes' AND (description IS NULL OR description = '');

UPDATE heritage_sites SET
  zone_key = 'gramalote-viejo', zone_tag = NULL, ficha_category = 'Monumento',
  status = 'Visitable', subtitle = 'El puente que abrió nuevos caminos', intro = 'Una obra de infraestructura que transformó la comunicación y el desarrollo comercial de Gramalote.',
  summary = 'Inaugurado en febrero de 1932, facilitó la llegada del automóvil y el desarrollo de las actividades comerciales.', description = 'La inauguración del Puente Cuervo, en febrero de 1932, representó un avance importante para la comunicación del municipio. Su construcción permitió la llegada del automóvil y favoreció el crecimiento de las actividades comerciales.

Con el paso de los años, el puente se convirtió en un referente de la infraestructura regional. Su permanencia después de la tragedia de 2010 conserva el recuerdo de una etapa fundamental en la transformación del territorio.',
  visit_location = 'Sector de Puente Cuervo, vía departamental.', visit_access = 'Visitable, sujeto a las condiciones de la vía y del lugar.',
  visit_recommendation = 'Visitar durante el día. Transitar con precaución y comprobar previamente el estado de la vía; no detenerse en zonas que comprometan la seguridad vial.'
WHERE slug = 'puente-cuervo' AND (description IS NULL OR description = '');

UPDATE heritage_sites SET
  zone_key = 'nuevo-gramalote', zone_tag = NULL, ficha_category = 'Edificio histórico',
  status = 'Visitable', subtitle = 'Una historia de servicio y solidaridad', intro = 'Una obra construida gracias al esfuerzo colectivo y dedicada al cuidado de la salud de la comunidad.',
  summary = 'Inaugurado el 6 de agosto de 1941, se convirtió en un importante centro de atención para Gramalote y los municipios vecinos.', description = 'La historia del hospital comenzó con iniciativas de asistencia impulsadas por el padre Secundino Jácome para atender a las personas más necesitadas. Posteriormente, la llegada de las Hijas de la Caridad de San Vicente de Paúl, en 1936, fortaleció la atención social y sanitaria.

El edificio hospitalario fue inaugurado el 6 de agosto de 1941, gracias al esfuerzo conjunto de la comunidad, las autoridades y las religiosas. Se convirtió en un importante centro de atención para Gramalote y los municipios vecinos.',
  visit_location = 'Nuevo Gramalote.', visit_access = 'Acceso sujeto a las condiciones del establecimiento.',
  visit_recommendation = 'Es un centro de salud en funcionamiento: respetar las áreas de atención, la privacidad de los pacientes y las normas del establecimiento. No realizar visitas turísticas que interfieran con los servicios médicos.'
WHERE slug = 'hospital-san-vicente-de-paul' AND (description IS NULL OR description = '');

UPDATE heritage_sites SET
  zone_key = 'nuevo-gramalote', zone_tag = NULL, ficha_category = 'Edificio histórico',
  status = 'Visitable', subtitle = 'La educación como legado de comunidad', intro = 'Una institución que marcó la formación académica y la vida de generaciones de gramaloteros.',
  summary = 'Impulsado por las Hermanas Bethlemitas, fue uno de los principales referentes educativos del antiguo Gramalote.', description = 'El Colegio Sagrado Corazón de Jesús fue impulsado por la comunidad de Hermanas Bethlemitas, bajo la dirección de la madre Encarnación. Su labor educativa contribuyó a la formación de numerosas generaciones de niñas y jóvenes del municipio.

Su trayectoria lo convirtió en uno de los referentes educativos y culturales de Gramalote. El documento de contenidos lo vincula con la memoria del antiguo municipio, mientras que el inventario lo registra en Nuevo Gramalote; esta correspondencia territorial debe confirmarse antes de publicar la ubicación.',
  visit_location = 'Nuevo Gramalote, según el inventario. Confirmar si el punto corresponde a la sede actual o a la referencia histórica.', visit_access = 'Requiere autorización institucional.',
  visit_recommendation = 'Consultar previamente con la institución. No ingresar a las instalaciones sin autorización ni interrumpir las actividades académicas.'
WHERE slug = 'colegio-sagrado-corazon-de-jesus' AND (description IS NULL OR description = '');

UPDATE heritage_sites SET
  zone_key = 'gramalote-viejo', zone_tag = NULL, ficha_category = 'Patrimonio religioso',
  status = 'Solo memoria', subtitle = 'La huella de una arquitectura desaparecida', intro = 'Una construcción religiosa de estilo gótico que permanece en la memoria arquitectónica y espiritual del antiguo pueblo.',
  summary = 'La Capilla de los Dolores Internos del Sagrado Corazón fue una de las construcciones religiosas más representativas del antiguo Gramalote.', description = 'La Capilla de los Dolores Internos del Sagrado Corazón, vinculada a la comunidad Bethlemita, fue una de las construcciones religiosas más representativas del antiguo Gramalote. Su arquitectura de estilo gótico destacaba dentro del paisaje urbano.

El documento histórico sitúa su construcción en 1936. Durante la tragedia de diciembre de 2010 sufrió daños irreversibles y su torre sur colapsó. La capilla se conserva hoy en la memoria de la comunidad y en los registros históricos.',
  visit_location = 'Gramalote Viejo, ubicación histórica.', visit_access = 'Solo memoria; no se presenta como un sitio actualmente visitable.',
  visit_recommendation = 'Conocer su historia mediante fotografías, testimonios y documentos históricos. No ofrecer una visita física a las ruinas sin confirmación de su existencia, acceso y seguridad.'
WHERE slug = 'capilla-bethlemita' AND (description IS NULL OR description = '');

UPDATE heritage_sites SET
  zone_key = 'caldereros', zone_tag = NULL, ficha_category = 'Patrimonio religioso',
  status = 'Con restricciones', subtitle = 'Las primeras huellas de Caldereros', intro = 'Los vestigios de uno de los primeros espacios religiosos del territorio donde comenzó la historia de Gramalote.',
  summary = 'Restos del primer templo del antiguo asentamiento de Caldereros, testimonio de los orígenes del territorio.', description = 'En el antiguo asentamiento de Caldereros, ubicado en la vereda Miraflores, la vida religiosa fue fundamental para la organización de sus primeros habitantes. La construcción de espacios de culto acompañó el crecimiento de aquella comunidad.

Los restos del primer templo constituyen un testimonio de los orígenes del municipio y de su primera ubicación. Su valor histórico permite reconocer las huellas materiales de los primeros asentamientos gramaloteros.',
  visit_location = 'Vereda Miraflores, sector de Caldereros.', visit_access = 'Con restricciones.',
  visit_recommendation = 'No acercarse sin verificar previamente las condiciones de seguridad, el estado del terreno y la autorización de acceso.'
WHERE slug = 'ruinas-del-primer-templo' AND (description IS NULL OR description = '');
UPDATE heritage_sites SET name = 'Ruinas del primer templo (Pueblo Viejo)' WHERE slug = 'ruinas-del-primer-templo' AND name LIKE 'Ruinas del primer templo (Pueblo Viejo)';

UPDATE heritage_sites SET
  zone_key = 'gramalote-viejo', zone_tag = 'Gramalote Viejo — emplazamiento histórico', ficha_category = 'Monumento',
  status = 'Solo memoria', subtitle = 'El legado del padre Secundino Jácome', intro = 'Un homenaje al primer párroco de Gramalote, cuya labor hizo parte de la historia religiosa del municipio.',
  summary = 'Homenaje al primer párroco de Gramalote, colocado en 1962 en la iglesia parroquial del antiguo pueblo; hoy se conserva en fotografías.', description = 'Secundino Jácome fue el primer párroco de Gramalote y una figura vinculada a la vida religiosa de sus habitantes. Su labor pastoral acompañó los primeros años de organización de la comunidad y el desarrollo del municipio.

En su honor se levantó una estatua, colocada el 8 de diciembre de 1962. De acuerdo con los registros históricos de la Universidad de Pamplona, la escultura fue instalada en la iglesia parroquial del antiguo Gramalote, mientras que la estatua de Laureano Gómez ocupó el parque principal.

La escultura ya no se conserva como monumento físico. Su recuerdo permanece en los registros fotográficos que permiten conocer cómo era y el lugar que ocupó en el antiguo municipio.',
  visit_location = NULL, visit_access = NULL,
  visit_recommendation = NULL
WHERE slug = 'estatua-de-secundino-jacome' AND (description IS NULL OR description = '');

UPDATE heritage_sites SET
  zone_key = 'nuevo-gramalote', zone_tag = 'Nuevo Gramalote (según el inventario)', ficha_category = 'Monumento',
  status = 'Visitable', subtitle = 'Laureano Gómez: del antiguo al nuevo Gramalote', intro = 'Una escultura dedicada al expresidente Laureano Gómez, recuperada e instalada nuevamente en el municipio después de la tragedia de 2010.',
  summary = 'Escultura del expresidente Laureano Gómez: trasladada a la Gobernación en 2010 y devuelta restaurada al Nuevo Gramalote en 2016.', description = 'La estatua de Laureano Gómez fue realizada en homenaje al expresidente colombiano y estuvo ubicada durante décadas en el parque principal del antiguo Gramalote. Su instalación fue promovida desde 1950 y finalmente llegó a la plaza en 1973.

En diciembre de 2010, ante el deterioro del terreno y la evacuación del municipio, la escultura fue trasladada a la Gobernación de Norte de Santander para protegerla de los daños ocasionados por la falla geológica.

El 16 de diciembre de 2016, después de su restauración, fue devuelta al Nuevo Gramalote. Desde entonces forma parte del patrimonio monumental del municipio y puede apreciarse nuevamente en su espacio público.',
  visit_location = 'Plaza principal (Plaza de la Restauración).', visit_access = 'Visitable. Se encuentra en un espacio público.',
  visit_recommendation = 'Aprovechar la visita para recorrer la plaza principal y conocer otros espacios representativos del nuevo municipio.'
WHERE slug = 'estatua-de-laureano-gomez' AND (description IS NULL OR description = '');

UPDATE heritage_sites SET
  zone_key = 'nuevo-gramalote', zone_tag = NULL, ficha_category = 'Monumento',
  status = 'Visitable', subtitle = 'La diosa que volvió a la plaza', intro = 'Una escultura que acompañó durante décadas la vida cotidiana de la plaza y volvió a ocupar un lugar en el nuevo Gramalote.',
  summary = 'Instalada en 1912 sobre la pila de la plaza, fue recuperada tras la tragedia y hoy vuelve a ocupar un lugar en el nuevo Gramalote.', description = 'La Diosa de la Fuente es una escultura que forma parte de la vida pública de Gramalote desde inicios del siglo XX. Según el documento de contenidos, fue instalada en 1912 sobre la pila de la plaza, como un elemento de embellecimiento del espacio público.

Con el paso del tiempo se convirtió en un punto de encuentro, presente en celebraciones y en la vida cotidiana del pueblo. Tras la tragedia de 2010, la estatua fue recuperada y hoy vuelve a presidir la plaza del Nuevo Gramalote, como vínculo entre la memoria del antiguo municipio y la vida actual.',
  visit_location = 'Plaza principal, Nuevo Gramalote.', visit_access = 'Libre, según la ficha.',
  visit_recommendation = 'Visitar durante el día y recorrer la plaza, respetando el espacio público y a sus visitantes.'
WHERE slug = 'diosa-de-la-fuente' AND (description IS NULL OR description = '');

UPDATE heritage_sites SET
  zone_key = 'caldereros', zone_tag = NULL, ficha_category = 'Monumento',
  status = 'Visitable', subtitle = 'Un puente ligado a los orígenes del territorio', intro = 'Una estructura vinculada a los caminos y a la memoria del primer asentamiento de Gramalote.',
  summary = 'Sobre la quebrada Calderera, recuerda la importancia de los caminos y pasos naturales para las comunidades rurales.', description = 'El puente Gregorio Montes se encuentra sobre la quebrada Calderera, en el territorio de Caldereros, donde se estableció el primer asentamiento de la población. Su ubicación permite reconocer la importancia de los caminos y de los pasos naturales para la comunicación entre las comunidades rurales.

Su nombre rinde homenaje a Gregorio Montes, personaje recordado por su participación en los orígenes de Gramalote. El puente permanece como un referente de la memoria territorial del municipio.',
  visit_location = 'Quebrada Calderera, sector Caldereros.', visit_access = 'Visitable, sujeto al estado del camino y a las condiciones de seguridad.',
  visit_recommendation = 'Visitar durante el día y verificar previamente el estado del camino y las condiciones del terreno.'
WHERE slug = 'puente-gregorio-montes' AND (description IS NULL OR description = '');

-- Fotos actuales del sitio (archivos de /img/historia) como inventario de medios.
INSERT IGNORE INTO media (storage_disk, storage_path, public_url, mime_type, alt_text, caption, source)
VALUES ('public', 'img/historia/pat-01.jpg', '/img/historia/pat-01.jpg', 'image/jpeg', 'Templo de San Rafael · antiguo', NULL, 'external');
INSERT IGNORE INTO media (storage_disk, storage_path, public_url, mime_type, alt_text, caption, source)
VALUES ('public', 'img/historia/tiempo-07.jpg', '/img/historia/tiempo-07.jpg', 'image/jpeg', 'Templo de San Rafael entre 1910 y 1953', NULL, 'external');
INSERT IGNORE INTO media (storage_disk, storage_path, public_url, mime_type, alt_text, caption, source)
VALUES ('public', 'img/historia/tiempo-07a.jpg', '/img/historia/tiempo-07a.jpg', 'image/jpeg', 'Templo de San Rafael entre 1957 y 2010', NULL, 'external');
INSERT IGNORE INTO media (storage_disk, storage_path, public_url, mime_type, alt_text, caption, source)
VALUES ('public', 'img/historia/tiempo-07b.jpg', '/img/historia/tiempo-07b.jpg', 'image/jpeg', 'Ruinas del templo de San Rafael desde 2010', NULL, 'external');
INSERT IGNORE INTO media (storage_disk, storage_path, public_url, mime_type, alt_text, caption, source)
VALUES ('public', 'img/historia/pat-02.jpg', '/img/historia/pat-02.jpg', 'image/jpeg', 'Templo San Rafael Arcángel', NULL, 'external');
INSERT IGNORE INTO media (storage_disk, storage_path, public_url, mime_type, alt_text, caption, source)
VALUES ('public', 'img/historia/pat-03.jpg', '/img/historia/pat-03.jpg', 'image/jpeg', 'Plaza de la Restauración', NULL, 'external');
INSERT IGNORE INTO media (storage_disk, storage_path, public_url, mime_type, alt_text, caption, source)
VALUES ('public', 'img/historia/pat-04.jpg', '/img/historia/pat-04.jpg', 'image/jpeg', 'Casa Municipal Gregorio Montes', NULL, 'external');
INSERT IGNORE INTO media (storage_disk, storage_path, public_url, mime_type, alt_text, caption, source)
VALUES ('public', 'img/historia/pat-05.jpg', '/img/historia/pat-05.jpg', 'image/jpeg', 'Puente Cuervo', NULL, 'external');
INSERT IGNORE INTO media (storage_disk, storage_path, public_url, mime_type, alt_text, caption, source)
VALUES ('public', 'img/historia/pat-06.jpg', '/img/historia/pat-06.jpg', 'image/jpeg', 'Hospital San Vicente de Paúl', NULL, 'external');
INSERT IGNORE INTO media (storage_disk, storage_path, public_url, mime_type, alt_text, caption, source)
VALUES ('public', 'img/historia/pat-06b.jpg', '/img/historia/pat-06b.jpg', 'image/jpeg', NULL, NULL, 'external');
INSERT IGNORE INTO media (storage_disk, storage_path, public_url, mime_type, alt_text, caption, source)
VALUES ('public', 'img/historia/pat-07.jpg', '/img/historia/pat-07.jpg', 'image/jpeg', 'Colegio Sagrado Corazón de Jesús', NULL, 'external');
INSERT IGNORE INTO media (storage_disk, storage_path, public_url, mime_type, alt_text, caption, source)
VALUES ('public', 'img/historia/pat-07b.jpg', '/img/historia/pat-07b.jpg', 'image/jpeg', NULL, NULL, 'external');
INSERT IGNORE INTO media (storage_disk, storage_path, public_url, mime_type, alt_text, caption, source)
VALUES ('public', 'img/historia/pat-08.jpg', '/img/historia/pat-08.jpg', 'image/jpeg', 'Capilla Bethlemita', NULL, 'external');
INSERT IGNORE INTO media (storage_disk, storage_path, public_url, mime_type, alt_text, caption, source)
VALUES ('public', 'img/historia/pat-09.jpg', '/img/historia/pat-09.jpg', 'image/jpeg', 'Ruinas del primer templo (Pueblo Viejo)', NULL, 'external');
INSERT IGNORE INTO media (storage_disk, storage_path, public_url, mime_type, alt_text, caption, source)
VALUES ('public', 'img/historia/pat-10.jpg', '/img/historia/pat-10.jpg', 'image/jpeg', 'Estatua del padre Secundino Jácome en el antiguo Gramalote', 'Fotografía histórica: estatua del padre Secundino Jácome en el antiguo Gramalote.', 'external');
INSERT IGNORE INTO media (storage_disk, storage_path, public_url, mime_type, alt_text, caption, source)
VALUES ('public', 'img/historia/pat-11.jpg', '/img/historia/pat-11.jpg', 'image/jpeg', 'Estatua de Laureano Gómez', NULL, 'external');
INSERT IGNORE INTO media (storage_disk, storage_path, public_url, mime_type, alt_text, caption, source)
VALUES ('public', 'img/historia/pat-12.jpg', '/img/historia/pat-12.jpg', 'image/jpeg', 'Diosa de la Fuente', NULL, 'external');
INSERT IGNORE INTO media (storage_disk, storage_path, public_url, mime_type, alt_text, caption, source)
VALUES ('public', 'img/historia/pat-13.jpg', '/img/historia/pat-13.jpg', 'image/jpeg', 'Puente Gregorio Montes', NULL, 'external');

INSERT IGNORE INTO heritage_images (heritage_id, media_id, role, era_label, sort_order)
SELECT h.id, m.id, 'cover', NULL, 0
FROM heritage_sites h JOIN media m ON m.storage_disk = 'public' AND m.storage_path = 'img/historia/pat-01.jpg'
WHERE h.slug = 'templo-san-rafael-antiguo'
  AND NOT EXISTS (SELECT 1 FROM heritage_images x WHERE x.heritage_id = h.id AND x.role = 'cover' AND 1 = 1);
INSERT IGNORE INTO heritage_images (heritage_id, media_id, role, era_label, sort_order)
SELECT h.id, m.id, 'historic', '1910 – 1953', 10
FROM heritage_sites h JOIN media m ON m.storage_disk = 'public' AND m.storage_path = 'img/historia/tiempo-07.jpg'
WHERE h.slug = 'templo-san-rafael-antiguo'
  AND NOT EXISTS (SELECT 1 FROM heritage_images x WHERE x.heritage_id = h.id AND x.role = 'historic' AND x.media_id = m.id);
INSERT IGNORE INTO heritage_images (heritage_id, media_id, role, era_label, sort_order)
SELECT h.id, m.id, 'historic', '1957 – 2010', 20
FROM heritage_sites h JOIN media m ON m.storage_disk = 'public' AND m.storage_path = 'img/historia/tiempo-07a.jpg'
WHERE h.slug = 'templo-san-rafael-antiguo'
  AND NOT EXISTS (SELECT 1 FROM heritage_images x WHERE x.heritage_id = h.id AND x.role = 'historic' AND x.media_id = m.id);
INSERT IGNORE INTO heritage_images (heritage_id, media_id, role, era_label, sort_order)
SELECT h.id, m.id, 'historic', 'Desde 2010', 30
FROM heritage_sites h JOIN media m ON m.storage_disk = 'public' AND m.storage_path = 'img/historia/tiempo-07b.jpg'
WHERE h.slug = 'templo-san-rafael-antiguo'
  AND NOT EXISTS (SELECT 1 FROM heritage_images x WHERE x.heritage_id = h.id AND x.role = 'historic' AND x.media_id = m.id);
INSERT IGNORE INTO heritage_images (heritage_id, media_id, role, era_label, sort_order)
SELECT h.id, m.id, 'cover', NULL, 0
FROM heritage_sites h JOIN media m ON m.storage_disk = 'public' AND m.storage_path = 'img/historia/pat-02.jpg'
WHERE h.slug = 'templo-san-rafael-arcangel'
  AND NOT EXISTS (SELECT 1 FROM heritage_images x WHERE x.heritage_id = h.id AND x.role = 'cover' AND 1 = 1);
INSERT IGNORE INTO heritage_images (heritage_id, media_id, role, era_label, sort_order)
SELECT h.id, m.id, 'cover', NULL, 0
FROM heritage_sites h JOIN media m ON m.storage_disk = 'public' AND m.storage_path = 'img/historia/pat-03.jpg'
WHERE h.slug = 'plaza-de-la-restauracion'
  AND NOT EXISTS (SELECT 1 FROM heritage_images x WHERE x.heritage_id = h.id AND x.role = 'cover' AND 1 = 1);
INSERT IGNORE INTO heritage_images (heritage_id, media_id, role, era_label, sort_order)
SELECT h.id, m.id, 'cover', NULL, 0
FROM heritage_sites h JOIN media m ON m.storage_disk = 'public' AND m.storage_path = 'img/historia/pat-04.jpg'
WHERE h.slug = 'casa-municipal-gregorio-montes'
  AND NOT EXISTS (SELECT 1 FROM heritage_images x WHERE x.heritage_id = h.id AND x.role = 'cover' AND 1 = 1);
INSERT IGNORE INTO heritage_images (heritage_id, media_id, role, era_label, sort_order)
SELECT h.id, m.id, 'cover', NULL, 0
FROM heritage_sites h JOIN media m ON m.storage_disk = 'public' AND m.storage_path = 'img/historia/pat-05.jpg'
WHERE h.slug = 'puente-cuervo'
  AND NOT EXISTS (SELECT 1 FROM heritage_images x WHERE x.heritage_id = h.id AND x.role = 'cover' AND 1 = 1);
INSERT IGNORE INTO heritage_images (heritage_id, media_id, role, era_label, sort_order)
SELECT h.id, m.id, 'cover', NULL, 0
FROM heritage_sites h JOIN media m ON m.storage_disk = 'public' AND m.storage_path = 'img/historia/pat-06.jpg'
WHERE h.slug = 'hospital-san-vicente-de-paul'
  AND NOT EXISTS (SELECT 1 FROM heritage_images x WHERE x.heritage_id = h.id AND x.role = 'cover' AND 1 = 1);
INSERT IGNORE INTO heritage_images (heritage_id, media_id, role, era_label, sort_order)
SELECT h.id, m.id, 'gallery', NULL, 10
FROM heritage_sites h JOIN media m ON m.storage_disk = 'public' AND m.storage_path = 'img/historia/pat-06b.jpg'
WHERE h.slug = 'hospital-san-vicente-de-paul'
  AND NOT EXISTS (SELECT 1 FROM heritage_images x WHERE x.heritage_id = h.id AND x.role = 'gallery' AND x.media_id = m.id);
INSERT IGNORE INTO heritage_images (heritage_id, media_id, role, era_label, sort_order)
SELECT h.id, m.id, 'cover', NULL, 0
FROM heritage_sites h JOIN media m ON m.storage_disk = 'public' AND m.storage_path = 'img/historia/pat-07.jpg'
WHERE h.slug = 'colegio-sagrado-corazon-de-jesus'
  AND NOT EXISTS (SELECT 1 FROM heritage_images x WHERE x.heritage_id = h.id AND x.role = 'cover' AND 1 = 1);
INSERT IGNORE INTO heritage_images (heritage_id, media_id, role, era_label, sort_order)
SELECT h.id, m.id, 'gallery', NULL, 10
FROM heritage_sites h JOIN media m ON m.storage_disk = 'public' AND m.storage_path = 'img/historia/pat-07b.jpg'
WHERE h.slug = 'colegio-sagrado-corazon-de-jesus'
  AND NOT EXISTS (SELECT 1 FROM heritage_images x WHERE x.heritage_id = h.id AND x.role = 'gallery' AND x.media_id = m.id);
INSERT IGNORE INTO heritage_images (heritage_id, media_id, role, era_label, sort_order)
SELECT h.id, m.id, 'cover', NULL, 0
FROM heritage_sites h JOIN media m ON m.storage_disk = 'public' AND m.storage_path = 'img/historia/pat-08.jpg'
WHERE h.slug = 'capilla-bethlemita'
  AND NOT EXISTS (SELECT 1 FROM heritage_images x WHERE x.heritage_id = h.id AND x.role = 'cover' AND 1 = 1);
INSERT IGNORE INTO heritage_images (heritage_id, media_id, role, era_label, sort_order)
SELECT h.id, m.id, 'cover', NULL, 0
FROM heritage_sites h JOIN media m ON m.storage_disk = 'public' AND m.storage_path = 'img/historia/pat-09.jpg'
WHERE h.slug = 'ruinas-del-primer-templo'
  AND NOT EXISTS (SELECT 1 FROM heritage_images x WHERE x.heritage_id = h.id AND x.role = 'cover' AND 1 = 1);
INSERT IGNORE INTO heritage_images (heritage_id, media_id, role, era_label, sort_order)
SELECT h.id, m.id, 'cover', NULL, 0
FROM heritage_sites h JOIN media m ON m.storage_disk = 'public' AND m.storage_path = 'img/historia/pat-10.jpg'
WHERE h.slug = 'estatua-de-secundino-jacome'
  AND NOT EXISTS (SELECT 1 FROM heritage_images x WHERE x.heritage_id = h.id AND x.role = 'cover' AND 1 = 1);
INSERT IGNORE INTO heritage_images (heritage_id, media_id, role, era_label, sort_order)
SELECT h.id, m.id, 'cover', NULL, 0
FROM heritage_sites h JOIN media m ON m.storage_disk = 'public' AND m.storage_path = 'img/historia/pat-11.jpg'
WHERE h.slug = 'estatua-de-laureano-gomez'
  AND NOT EXISTS (SELECT 1 FROM heritage_images x WHERE x.heritage_id = h.id AND x.role = 'cover' AND 1 = 1);
INSERT IGNORE INTO heritage_images (heritage_id, media_id, role, era_label, sort_order)
SELECT h.id, m.id, 'cover', NULL, 0
FROM heritage_sites h JOIN media m ON m.storage_disk = 'public' AND m.storage_path = 'img/historia/pat-12.jpg'
WHERE h.slug = 'diosa-de-la-fuente'
  AND NOT EXISTS (SELECT 1 FROM heritage_images x WHERE x.heritage_id = h.id AND x.role = 'cover' AND 1 = 1);
INSERT IGNORE INTO heritage_images (heritage_id, media_id, role, era_label, sort_order)
SELECT h.id, m.id, 'cover', NULL, 0
FROM heritage_sites h JOIN media m ON m.storage_disk = 'public' AND m.storage_path = 'img/historia/pat-13.jpg'
WHERE h.slug = 'puente-gregorio-montes'
  AND NOT EXISTS (SELECT 1 FROM heritage_images x WHERE x.heritage_id = h.id AND x.role = 'cover' AND 1 = 1);
