-- ============================================================================
-- 031 · Cuadre con la matriz final de establecimientos
--
-- Fuente: `referencia/Matriz y Documentación/Matriz_establecimientos final 2.xlsx`
-- (16 nov 2026). La ubicación NO se toca aquí salvo lo que indica la matriz de
-- ubicaciones (`Matriz_mapa_interactivo_lista 3.xlsx`): dirección y enlace de
-- Google Maps ya coinciden con ella; solo faltaban las coordenadas de
-- Creaciones Martina (el enlace de la matriz abría la ficha sin punto) y tres
-- «detalles de ubicación» que repetían la zona en lugar de la vereda/barrio.
--
-- Se alinean el nombre comercial, la descripción corta (columna «Descripción
-- corta»), el segundo teléfono de Verdeser y los nombres de las cuatro fichas
-- en borrador, que arrastraban el sufijo «(Faltaron datos)».
--
-- No se copian las descripciones cortas de la matriz que están incompletas
-- (Creaciones Martina termina en coma; Origen es un fragmento en minúsculas):
-- ahí se conserva el texto del sitio. Se corrigen solo erratas evidentes de la
-- matriz (por ejemplo «Bisutertia», «en en foamy», «resiclaje»).
-- ============================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------- Dónde comer
UPDATE establishments SET
  summary = 'Amplia carta de hamburguesas de calidad, en ambiente cálido, agradable y familiar.'
WHERE slug = 'bambu';

UPDATE establishments SET
  summary = 'Emprendimiento nacido de la pasión por el arte; pasteles y el típico masato.'
WHERE slug = 'dulce-paseo';

UPDATE establishments SET
  summary = 'Desde 2021, la propietaria atiende personalmente; hoy es fuente de sustento para sus 4 hijos y aporte al comercio del municipio.',
  email = NULL
WHERE slug = 'dona-claudia';

UPDATE establishments SET
  name = 'Fresas con Crema Carvajal S.A.S.',
  summary = 'Proyecto familiar surgido en la pospandemia; alimentación natural y saludable a base de fruta.'
WHERE slug = 'fresas-con-crema-carvajal';

UPDATE establishments SET
  summary = 'Heladería artesanal con esencia gramalotera: frutas y tubérculos de la región.'
WHERE slug = 'la-comarca';

UPDATE establishments SET
  summary = 'Restaurante familiar de gastronomía tradicional colombiana; ingredientes frescos, atención cálida.'
WHERE slug = 'la-sazon-de-la-tia';

-- --------------------------------------------------------------- Dónde dormir
UPDATE establishments SET
  summary = 'Alojamiento rural que combina naturaleza, privacidad y confort, con vista a montañas y paisaje.',
  location_detail = 'Vereda Valderrama'
WHERE slug = 'glamping-vista-antigua';

UPDATE establishments SET
  name = 'Verdeser Glampings',
  summary = 'Descanso y conexión con la naturaleza; incluye desayuno, domicilios, salón social para eventos y parqueadero.',
  phone_secondary = '322 2488407'
WHERE slug = 'verdeser-glampings';

UPDATE establishments SET
  summary = 'Amplias zonas verdes, parqueadero privado, salón de eventos y área de fogata, a 2 min del parque principal.'
WHERE slug = 'hostal-campestre-camino-real';

UPDATE establishments SET
  summary = 'Ambiente familiar y atención personalizada, ubicado en el nuevo Gramalote.'
WHERE slug = 'hostal-luna-azul';

UPDATE establishments SET
  summary = 'Espacio acogedor con agua caliente, WiFi, TV y desayuno incluido; atención personalizada.'
WHERE slug = 'casa-hiedra-hotel-boutique';

UPDATE establishments SET
  summary = 'Cabañas con forma de animales, piscina, mesa de pool y mirador; ideal para desconectarse en familia.'
WHERE slug = 'cabanas-el-penon';

-- -------------------------------------------------------------- Dónde comprar
UPDATE establishments SET
  summary = 'Tejidos en crochet y limpiapipas; souvenirs para toda ocasión.'
WHERE slug = 'chelinarte';

UPDATE establishments SET
  summary = 'Perfumería de autor artesanal: perfumes recargables y aromas para autos y baños; asesoría personalizada.'
WHERE slug = 'aroma-twins';

-- La matriz solo trae el enlace de Google Maps, sin coordenadas: se tomaron del
-- lugar al que redirige ese enlace, para que la ficha aparezca en el mapa.
UPDATE establishments SET
  latitude = 7.8711407,
  longitude = -72.8014275,
  phone = '312 3856999'
WHERE slug = 'creaciones-martina';

UPDATE establishments SET
  summary = 'Figuras en porcelana fría y figuras en resina; trabajos personalizados.'
WHERE slug = 'artelu';

UPDATE establishments SET
  summary = 'Artesanías en cemento y yeso.'
WHERE slug = 'mi-hermoso-eden';

UPDATE establishments SET
  summary = 'Artesanías en foamy, trapillo, reciclaje y otros.'
WHERE slug = 'mi-gordita-bella';

UPDATE establishments SET
  summary = 'Tejidos, bordados, en crochet, porcelanicrón, yute y otros.'
WHERE slug = 'yawart';

UPDATE establishments SET
  summary = 'Bisutería hecha con limpiapipas.',
  location_detail = 'Vereda Miraflores'
WHERE slug = 'bisuteria-mg';

UPDATE establishments SET
  location_detail = 'Vereda Villanueva'
WHERE slug = 'caliopes';

-- La matriz trae el horario de Sombreros TECHA como una frase corrida («10
-- mañana a 2 tarde lunes a viernes 10a 4tarde tarde sábados y domingos»); se
-- deja legible sin cambiar los días ni las horas.
UPDATE establishments SET
  hours_text = 'Lun–vie, 10 a. m.–2 p. m. · Sáb. y dom., 10 a. m.–4 p. m.'
WHERE slug = 'sombreros-techa';

-- ------------------------------------------------- Fichas en borrador (estado)
-- La matriz las deja sin datos; el sufijo «(Faltaron datos)» era una nota
-- interna que quedaba en el nombre y se vería al publicarlas.
UPDATE establishments SET name = 'Glamping El Hacendado'      WHERE slug = 'glamping-el-hacendado';
UPDATE establishments SET name = 'La Chiquitina'              WHERE slug = 'la-chiquitina';
UPDATE establishments SET name = 'Restaurante El Gran Sazón'  WHERE slug = 'restaurante-el-gran-sazon';
UPDATE establishments SET name = 'Coofe Garden'               WHERE slug = 'coofe-garden';
