-- ============================================================================
-- Gramalote Interactivo — contenido del inventario
-- Origen: frontend/src/data/{establishments,experiences,curiosities,
--         practical,inicio,site}.js
-- Ejecutar después de schema.sql y seed.sql:  npm run seed:content
--
-- Es idempotente: vacía el contenido editorial y lo vuelve a insertar con ids
-- estables. No toca admin_users, admin_refresh_tokens, media ni audit_log.
--
-- Ids fijos de establecimientos (usados por relations y opening_hours):
--   1 bambu · 2 dulce-paseo · 3 dona-claudia · 4 fresas-con-crema-carvajal
--   5 la-comarca · 6 la-sazon-de-la-tia · 7 origen-cocina-de-autor (oculto)
--   8 glamping-vista-antigua · 9 verdeser-glampings
--  10 hostal-campestre-camino-real · 11 hostal-luna-azul
--  12 casa-hiedra-hotel-boutique · 13 cabanas-el-penon · 14 chelinarte
--  15 aroma-twins · 16 creaciones-martina · 17 mi-hermoso-eden
--  18 maestros-de-la-madera · 19 mi-gordita-bella
-- ============================================================================

USE gramalote;
SET NAMES utf8mb4;

-- Limpieza del contenido previo (los hijos caen por cascada o se borran antes)
DELETE FROM search_documents;
DELETE FROM establishment_relations;
DELETE FROM opening_hours_exceptions;
DELETE FROM opening_hours;
DELETE FROM establishment_payments;
DELETE FROM establishment_products;
DELETE FROM establishment_features;
DELETE FROM establishment_images;
DELETE FROM establishment_social_links;
DELETE FROM establishment_services;
DELETE FROM experience_establishments;
DELETE FROM experience_images;
DELETE FROM experience_social_links;
DELETE FROM experience_tips;
DELETE FROM experiences;
DELETE FROM curiosity_collection_items;
DELETE FROM curiosity_block_media;
DELETE FROM curiosity_blocks;
DELETE FROM curiosities;
DELETE FROM access_routes;
DELETE FROM transport_options;
DELETE FROM safety_tips;
DELETE FROM preparation_tips;
DELETE FROM useful_contacts;
DELETE FROM establishments;

-- ============================================================================
-- 1. Establecimientos (19 fichas: 18 publicadas + Origen oculto)
-- ============================================================================

INSERT INTO establishments
  (id, slug, name, category_id, type_id, zone_id, location_detail, summary,
   description, address, phone, hours_text, checkin_text, price_text,
   is_published, sort_order, published_at)
VALUES
  (1, 'bambu', 'Bambú', 1, 1, 1, NULL,
   'Hamburguesas y comidas rápidas en un ambiente cálido y familiar.',
   'Restaurante familiar de gastronomía tradicional colombiana con ingredientes frescos y atención cálida. Descubre las diferentes opciones que Bambú tiene para ti, desde comidas rápidas hasta bebidas para disfrutar en un ambiente agradable, con precios que van desde $4.000 hasta $35.000.',
   'Manzana 84, lote 4, segundo piso.', '322 464 4228',
   'Lunes a domingo, de 6:00 p. m. a 11:00 p. m.', NULL, NULL,
   1, 1, NOW()),

  (2, 'dulce-paseo', 'Dulce Paseo', 1, 2, 1, NULL,
   'Postres, jugos, helados, dulces y masato.',
   'Un espacio para disfrutar de postres, jugos naturales y dulces tradicionales mientras recorres el municipio.',
   'Calle 6 con carrera 4, Gramalote Nuevo.', NULL,
   'Lunes a sábado, de 9:00 a. m. a 8:00 p. m.', NULL, NULL,
   1, 2, NOW()),

  (3, 'dona-claudia', 'Doña Claudia', 1, 3, 1, NULL,
   'Comida casera y muy tradicional.',
   'Cocina casera preparada al momento, con recetas tradicionales de la región y atención cercana.',
   'Barrio Centro, Gramalote Nuevo.', NULL,
   'Lunes a domingo, de 7:00 a. m. a 5:00 p. m.', NULL, NULL,
   1, 3, NOW()),

  (4, 'fresas-con-crema-carvajal', 'Fresas con Crema Carvajal', 1, 4, 1, NULL,
   'Fresas con crema, maracumango, obleas y quesillo.',
   'Postres frescos y tradicionales para disfrutar durante el recorrido por Gramalote.',
   'Calle 5, Gramalote Nuevo.', NULL,
   'Martes a domingo, de 11:00 a. m. a 7:00 p. m.', NULL, NULL,
   1, 4, NOW()),

  (5, 'la-comarca', 'La Comarca', 1, 5, 1, NULL,
   'Helados artesanales con sabores como chocolate y yuca.',
   'Heladería artesanal con sabores de la región, elaborados con ingredientes locales.',
   'Carrera 4, Gramalote Nuevo.', NULL,
   'Lunes a domingo, de 10:00 a. m. a 8:00 p. m.', NULL, NULL,
   1, 5, NOW()),

  (6, 'la-sazon-de-la-tia', 'La Sazón de la Tía', 1, 6, 1, NULL,
   'Comida tradicional colombiana, ajíaco gramalotero y platos especiales.',
   'Cocina tradicional colombiana con platos especiales y el auténtico ajíaco gramalotero.',
   'Calle 4, Gramalote Nuevo.', NULL,
   'Martes a domingo, de 8:00 a. m. a 6:00 p. m.', NULL, NULL,
   1, 6, NOW()),

  (7, 'origen-cocina-de-autor', 'Origen Cocina de Autor', 1, 7, 1, NULL,
   'Sabores locales con una propuesta de cocina de autor.',
   'Una propuesta gastronómica que reinterpreta los sabores locales de Gramalote.',
   'Gramalote Nuevo.', NULL, NULL, NULL, NULL,
   0, 7, NULL),

  (8, 'glamping-vista-antigua', 'Glamping Vista Antigua', 2, 8, 2,
   'Vereda Vallestana',
   'Alojamiento rural con privacidad, confort y vistas a las montañas.',
   'Alojamiento rural con privacidad, confort y vistas a las montañas de Gramalote.',
   'Vereda Vallestana, Gramalote.', NULL, NULL,
   '3:00 p. m. / 12:00 m.', '$180.000 - $320.000',
   1, 8, NOW()),

  (9, 'verdeser-glampings', 'VerdeSer Glampings', 2, 8, 1,
   'Vereda Miraflores',
   'Descanso en la naturaleza con desayuno, domicilios y parqueadero.',
   'Descansa y conecta con la naturaleza. Disfruta de sus alojamientos, desayuno, servicio de domicilios, salón social para eventos y parqueadero.',
   'Finca Gratamira, vereda Miraflores, Gramalote.', '320 223 0392', NULL,
   '4:00 p. m. / 1:00 p. m.', '$200.000 - $500.000',
   1, 9, NOW()),

  (10, 'hostal-campestre-camino-real', 'Hostal Campestre Camino Real', 2, 9, 1,
   NULL,
   'Zonas verdes, parqueadero privado, salón de eventos y área de fogatas.',
   'Hostal campestre con zonas verdes, parqueadero privado, salón de eventos y área de fogatas.',
   'Gramalote Nuevo.', NULL, NULL,
   '2:00 p. m. / 12:00 m.', '$120.000 - $250.000',
   1, 10, NOW()),

  (11, 'hostal-luna-azul', 'Hostal Luna Azul', 2, 10, 1, NULL,
   'Ambiente familiar y atención personalizada.',
   'Hostal de ambiente familiar con atención personalizada en el nuevo Gramalote.',
   'Gramalote Nuevo.', NULL, NULL,
   '2:00 p. m. / 12:00 m.', '$90.000 - $180.000',
   1, 11, NOW()),

  (12, 'casa-hiedra-hotel-boutique', 'Casa Hiedra Hotel Boutique', 2, 11, 1,
   'Barrio Santa Anita',
   'Espacios acogedores con agua caliente, Wi-Fi, televisión y desayuno incluido.',
   'Hotel boutique con espacios acogedores, agua caliente, Wi-Fi, televisión y desayuno incluido.',
   'Barrio Santa Anita, Gramalote Nuevo.', NULL, NULL,
   '3:00 p. m. / 12:00 m.', '$220.000 - $380.000',
   1, 12, NOW()),

  (13, 'cabanas-el-penon', 'Cabañas El Peñón', 2, 12, 2,
   'Vereda Valderrama',
   'Cabañas con piscina, zona de pool y mirador para descansar en familia.',
   'Cabañas con piscina, zona de pool y mirador para descansar en familia.',
   'Vereda Valderrama, Gramalote.', NULL, NULL,
   '3:00 p. m. / 1:00 p. m.', '$160.000 - $300.000',
   1, 13, NOW()),

  (14, 'chelinarte', 'Chelinarte', 3, 13, 1, NULL,
   'Llaveros, mochilas, libros, aretes, pulseras, bolsos y tejidos en crochet.',
   'Taller de tejidos y accesorios hechos a mano: llaveros, mochilas, libros, aretes, pulseras y bolsos en crochet.',
   'Gramalote Nuevo.', NULL,
   'Lunes a sábado, de 9:00 a. m. a 6:00 p. m.', NULL, NULL,
   1, 14, NOW()),

  (15, 'aroma-twins', 'Aroma Twins', 3, 14, 1, NULL,
   'Perfumes recargables y aromas para autos y baños.',
   'Perfumería artesanal con perfumes recargables y aromas para autos y baños.',
   'Gramalote Nuevo.', NULL,
   'Lunes a viernes, de 8:00 a. m. a 6:00 p. m.', NULL, NULL,
   1, 15, NOW()),

  (16, 'creaciones-martina', 'Creaciones Martina', 3, 15, 1, NULL,
   'Amigurumis, figuras en porcelana fría, velas, llaveros, jabones y detalles personalizados.',
   'Crea detalles únicos y personalizados, desde amigurumis y velas artesanales hasta jabones, llaveros y figuras decorativas hechas a mano.',
   'Finca San Luis.', '312 385 6999',
   'Lunes a viernes, de 8:00 a. m. a 6:00 p. m.', NULL, NULL,
   1, 16, NOW()),

  (17, 'mi-hermoso-eden', 'Mi Hermoso Edén', 3, 16, 1, NULL,
   'Macetas, alhajeros y decoraciones elaboradas en cemento y yeso.',
   'Decoración para el hogar: macetas, alhajeros y piezas elaboradas en cemento y yeso.',
   'Gramalote Nuevo.', NULL,
   'Lunes a sábado, de 9:00 a. m. a 5:00 p. m.', NULL, NULL,
   1, 17, NOW()),

  (18, 'maestros-de-la-madera', 'Maestros de la Madera', 3, 17, 1, NULL,
   'Artesanías elaboradas en madera.',
   'Taller de artesanías en madera con piezas utilitarias y decorativas hechas a mano.',
   'Gramalote Nuevo.', NULL,
   'Lunes a viernes, de 8:00 a. m. a 4:00 p. m.', NULL, NULL,
   1, 18, NOW()),

  (19, 'mi-gordita-bella', 'Mi Gordita Bella', 3, 18, 1, NULL,
   'Flores en foamy, llaveros, escapularios y muñecas de trapo.',
   'Detalles y accesorios artesanales: flores en foamy, llaveros, escapularios y muñecas de trapo.',
   'Gramalote Nuevo.', NULL,
   'Lunes a sábado, de 9:00 a. m. a 5:00 p. m.', NULL, NULL,
   1, 19, NOW());

-- Tarjetas destacadas de la ficha -------------------------------------------
INSERT INTO establishment_features
  (establishment_id, title, description, sort_order)
VALUES
  (1, 'Hamburguesas', 'Variedad de hamburguesas para disfrutar.', 1),
  (1, 'Coctelería', 'Cócteles y bebidas para compartir.', 2),
  (1, 'Cafetería', 'Opciones de café y bebidas para acompañar tu visita.', 3),
  (9, 'Alojamiento', 'Espacios rodeados de naturaleza para descansar en pareja o en familia.', 1),
  (9, 'Desayuno', 'Desayuno incluido para comenzar el día con energía.', 2),
  (9, 'Salón social', 'Espacio para eventos y reuniones familiares.', 3),
  (9, 'Parqueadero', 'Parqueadero privado dentro de la finca.', 4),
  (9, 'Domicilios', 'Servicio de domicilios para mayor comodidad durante la estadía.', 5);

-- Productos de artesanos ----------------------------------------------------
INSERT INTO establishment_products
  (establishment_id, name, sort_order)
VALUES
  (14, 'Mochilas', 1),
  (14, 'Llaveros', 2),
  (14, 'Aretes', 3),
  (14, 'Bolsos', 4),
  (15, 'Perfumes', 1),
  (15, 'Aromas para auto', 2),
  (15, 'Aromas para baño', 3),
  (15, 'Recargas', 4),
  (16, 'Amigurumis', 1),
  (16, 'Velas artesanales', 2),
  (16, 'Jabones', 3),
  (16, 'Figuras decorativas', 4),
  (17, 'Macetas', 1),
  (17, 'Alhajeros', 2),
  (17, 'Decoración en yeso', 3),
  (17, 'Piezas en cemento', 4),
  (18, 'Llaveros', 1),
  (18, 'Imanes', 2),
  (18, 'Letreros', 3),
  (18, 'Adornos', 4),
  (19, 'Flores en foamy', 1),
  (19, 'Llaveros', 2),
  (19, 'Escapularios', 3),
  (19, 'Muñecas de trapo', 4);

-- Medios de pago (1 efectivo, 2 transferencias) -----------------------------
INSERT INTO establishment_payments (establishment_id, payment_method_id) VALUES
  (1, 1), (1, 2),
  (2, 1), (2, 2),
  (3, 1),
  (4, 1), (4, 2),
  (5, 1),
  (6, 1), (6, 2),
  (7, 1), (7, 2),
  (14, 1), (14, 2),
  (15, 1),
  (16, 1),
  (17, 1),
  (18, 1), (18, 2),
  (19, 1);

-- Servicios de alojamientos ------------------------------------------------
INSERT INTO establishment_services (establishment_id, service_id) VALUES
  (9, 1), (9, 2), (9, 7), (9, 10),
  (10, 2), (10, 7), (10, 8), (10, 9),
  (12, 1), (12, 4), (12, 5), (12, 6),
  (13, 3), (13, 11);

-- “También puedes disfrutar…” ----------------------------------------------
INSERT INTO establishment_relations
  (establishment_id, related_establishment_id, sort_order)
VALUES
  (1, 6, 1), (1, 2, 2), (1, 7, 3),
  (2, 1, 1), (2, 6, 2), (2, 7, 3),
  (3, 6, 1), (3, 1, 2), (3, 2, 3),
  (4, 2, 1), (4, 5, 2), (4, 1, 3),
  (5, 4, 1), (5, 2, 2), (5, 1, 3),
  (6, 1, 1), (6, 3, 2), (6, 7, 3),
  (7, 1, 1), (7, 6, 2), (7, 2, 3),
  (8, 13, 1), (8, 10, 2), (8, 9, 3),
  (9, 8, 1), (9, 13, 2), (9, 10, 3),
  (10, 8, 1), (10, 13, 2), (10, 9, 3),
  (11, 8, 1), (11, 13, 2), (11, 10, 3),
  (12, 11, 1), (12, 8, 2), (12, 13, 3),
  (13, 8, 1), (13, 10, 2), (13, 9, 3),
  (14, 8, 1), (14, 13, 2), (14, 10, 3),
  (15, 8, 1), (15, 13, 2), (15, 10, 3),
  (16, 8, 1), (16, 13, 2), (16, 10, 3),
  (17, 8, 1), (17, 13, 2), (17, 10, 3),
  (18, 8, 1), (18, 13, 2), (18, 10, 3),
  (19, 8, 1), (19, 13, 2), (19, 10, 3);

-- ============================================================================
-- 2. Horarios normalizados (derivados de hours_text)
--    Sábado = 6, domingo = 7; sin turnos partidos en los datos actuales.
-- ============================================================================

INSERT INTO opening_hours
  (establishment_id, day_of_week, opens_at, closes_at, is_closed, sort_order)
SELECT s.establishment_id, d.n, s.opens_at, s.closes_at, 0, 1
FROM (
  SELECT 1 AS establishment_id, 1 AS first_day, 7 AS last_day,
         '18:00:00' AS opens_at, '23:00:00' AS closes_at
  UNION ALL SELECT 2, 1, 6, '09:00:00', '20:00:00'
  UNION ALL SELECT 3, 1, 7, '07:00:00', '17:00:00'
  UNION ALL SELECT 4, 2, 7, '11:00:00', '19:00:00'
  UNION ALL SELECT 5, 1, 7, '10:00:00', '20:00:00'
  UNION ALL SELECT 6, 2, 7, '08:00:00', '18:00:00'
  UNION ALL SELECT 14, 1, 6, '09:00:00', '18:00:00'
  UNION ALL SELECT 15, 1, 5, '08:00:00', '18:00:00'
  UNION ALL SELECT 16, 1, 5, '08:00:00', '18:00:00'
  UNION ALL SELECT 17, 1, 6, '09:00:00', '17:00:00'
  UNION ALL SELECT 18, 1, 5, '08:00:00', '16:00:00'
  UNION ALL SELECT 19, 1, 6, '09:00:00', '17:00:00'
) AS s
JOIN (
  SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
  UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
) AS d ON d.n BETWEEN s.first_day AND s.last_day
ORDER BY s.establishment_id, d.n;

-- ============================================================================
-- 3. Experiencias (3 fichas)
-- ============================================================================

INSERT INTO experiences
  (id, slug, title, category_id, summary, description, hours_text, address,
   parking_text, phone, is_published, sort_order, published_at)
VALUES
  (1, 'cascadas-arco-iris', 'Cascadas Arco Iris', 1,
   'Las Cascadas Arcoíris destacan por sus arcoíris naturales y el avistamiento nocturno de golondrinas en Gramalote.',
   'Cascadas Arcoíris es un atractivo turístico del municipio de Gramalote en la finca Limoncito, donde vivió los últimos años de vida nuestro fundador Gregorio Montes. Tiene una característica óptica muy interesante: cuando los rayos de sol entran en la espesura del entorno logra separar los colores del haz de luz al pasar por cada gotica de agua que cae roca abajo, generando ese espectáculo visual de muchos arcoíris. Propiamente el nombre a la quebrada que siempre se conoció como Las Golondrinas, ya que en ella posaban estas aves hasta nuestros tiempos en horas nocturnas, como un plan extra para avistarlas.',
   'Lunes a domingo, de 8:00 a. m. a 9:00 p. m.',
   'Calle 5 #4-20, Gramalote Nuevo.',
   'Sí, parqueadero para clientes.', '+57 310 123 4567', 1, 1, NOW()),

  (2, 'cafe-marquetalia', 'Café Marquetalia', 4,
   'Consulta la información de este establecimiento y descubre qué ofrece para complementar tu visita a Gramalote.',
   'Un espacio para disfrutar del café de la región y del paisaje de montaña, con atención para visitantes y habitantes de Gramalote.',
   NULL, 'Gramalote, Norte de Santander.', NULL, NULL, 1, 2, NOW()),

  (3, 'otro-sitio', 'Otro sitio', 5,
   'Atractivos, naturaleza, gastronomía, eventos y la memoria del municipio en una sola guía pensada para el celular: qué hay para hacer y cómo llegar a cada lugar.',
   'Atractivos, naturaleza, gastronomía, eventos y la memoria del municipio en una sola guía pensada para el celular: qué hay para hacer y cómo llegar a cada lugar.',
   NULL, 'Gramalote, Norte de Santander.', NULL, NULL, 1, 3, NOW());

INSERT INTO experience_tips
  (experience_id, title, description, sort_order)
VALUES
  (1, 'Tiempo de caminata', 'Aproximadamente 50 minutos a pie desde la plaza principal.', 1),
  (1, 'Dificultad', 'Media-alta. Ten en cuenta las condiciones del acceso.', 2),
  (1, 'Recomendaciones', 'Lleva ropa cómoda, zapatos cerrados, agua, gorra y protector solar.', 3),
  (1, 'Estado del lugar', 'Cierre temporal. Verifica si se autoriza la visita antes de desplazarte.', 4),
  (2, 'Tiempo de caminata', 'Consulta el tiempo aproximado de recorrido desde el punto de referencia.', 1),
  (2, 'Dificultad', 'Revisa el nivel de dificultad y las condiciones generales del acceso.', 2),
  (2, 'Recomendaciones', 'Lleva ropa cómoda, calzado adecuado, agua, gorra y protección solar.', 3),
  (2, 'Estado del lugar', 'Verifica restricciones y recomendaciones vigentes antes de salir.', 4),
  (3, 'Tiempo de caminata', 'Pendiente de confirmar.', 1),
  (3, 'Dificultad', 'Pendiente de confirmar.', 2),
  (3, 'Recomendaciones', 'Lleva ropa cómoda, calzado adecuado, agua, gorra y protección solar.', 3),
  (3, 'Estado del lugar', 'Verifica restricciones y recomendaciones vigentes antes de salir.', 4);

-- ============================================================================
-- 4. Curiosidades
-- ============================================================================

INSERT INTO curiosity_sections
  (id, slug, eyebrow, title, summary, cta_label, sort_order, is_published)
VALUES
  (1, 'territorio', 'Territorio e identidad', 'Territorio e identidad',
   'Conoce los símbolos, productos y referentes culturales que representan a Gramalote y reflejan la relación de su comunidad con la tierra.',
   'Explorar territorio', 1, 1),
  (2, 'tradiciones', 'Tradiciones y celebraciones', 'Tradiciones y celebraciones',
   'Descubre las fiestas, comparsas y celebraciones que han reunido a generaciones de gramaloteros y forman parte de su memoria colectiva.',
   'Conocer tradiciones', 2, 1),
  (3, 'sabores', 'Sabores tradicionales', 'Sabores tradicionales',
   'Acércate a los ingredientes, las preparaciones y las costumbres culinarias que conservan parte de la historia gastronómica del municipio.',
   'Descubrir sabores', 3, 1),
  (4, 'naturaleza', 'Naturaleza y vida', 'Naturaleza y vida',
   'Explora los árboles, las flores, las aves, los animales y los paisajes naturales que forman parte del entorno de Gramalote.',
   'Explorar naturaleza', 4, 1)
AS new
ON DUPLICATE KEY UPDATE
  eyebrow = new.eyebrow,
  title = new.title,
  summary = new.summary,
  cta_label = new.cta_label,
  sort_order = new.sort_order,
  is_published = new.is_published;

INSERT INTO curiosities
  (id, section_id, intro_title, intro_text, closing_title, closing_text,
   closing_media_side)
VALUES
  (1, 1, 'Un territorio que nos identifica',
   'Gramalote es un municipio de montañas y tradición agrícola, cuya identidad está ligada al trabajo campesino, las expresiones religiosas y los productos de su tierra. Sus símbolos y referentes culturales permiten conocer las costumbres y los vínculos que han acompañado la historia de su comunidad.',
   'Descubrir Gramalote a través de sus símbolos',
   'El café, la devoción a la Virgen de Monguí, el chocheco y los elementos naturales permiten acercarse a distintas expresiones de la identidad de Gramalote. Cada uno conecta aspectos de la vida cotidiana, las tradiciones y el territorio.',
   'left'),

  (2, 2, 'Celebraciones que nos unen',
   'Las celebraciones han sido espacios de encuentro para las familias, los vecinos y los visitantes de Gramalote. Las fiestas populares, las comparsas, las representaciones y las tradiciones religiosas contribuyeron a construir una vida cultural en la que la participación comunitaria tenía un papel central. Recordar estas festividades permite acercarse a las costumbres del antiguo Gramalote y comprender cómo los encuentros y las expresiones colectivas fortalecieron el sentido de pertenencia.',
   NULL,
   'Las celebraciones permanecen en las fotografías, los relatos y los recuerdos de quienes participaron en ellas. A través de estas memorias es posible conocer cómo se organizaba la comunidad, qué actividades disfrutaba y cuáles eran los momentos más esperados del año.\n\nConservar estas historias permite transmitir a las nuevas generaciones una parte de la vida cultural de Gramalote y reconocer el valor de las tradiciones en la construcción de su identidad.',
   'left'),

  (3, 3, 'Sabores que cuentan nuestra historia',
   'La gastronomía de Gramalote reúne productos del campo, recetas tradicionales y costumbres que se transmiten entre generaciones. En sus preparaciones se encuentran sabores relacionados con la vida campesina y con los momentos en que cocinar y compartir alrededor de la mesa se convierten en parte de la vida familiar.',
   'La cocina también cuenta quiénes somos',
   'Las recetas tradicionales conservan conocimientos sobre ingredientes, técnicas y formas de preparar los alimentos. Muchas se aprenden observando y acompañando a quienes cocinan, por lo que su transmisión depende de las personas que mantienen vivas estas prácticas.\n\nEn Gramalote, la gastronomía permite acercarse a la memoria familiar y a la relación entre el campo y la cocina. Cada preparación ofrece una oportunidad para conocer los sabores del municipio y escuchar las historias que acompañan sus recetas.',
   'left'),

  (4, 4, 'Una naturaleza llena de vida',
   'Las montañas, los bosques y los paisajes rurales forman parte del entorno de Gramalote. Entre sus referencias naturales se encuentran árboles, flores, aves y animales silvestres que permiten descubrir la diversidad del territorio y la relación entre sus habitantes y la naturaleza.',
   NULL,
   'Los bosques, los árboles relacionados con los antiguos cafetales, las flores, las aves y los animales silvestres forman parte de las distintas maneras de conocer Gramalote. Sus paisajes permiten acercarse a la riqueza natural del territorio y comprender la importancia de cuidar los espacios que sostienen la vida.\n\nExplorar esta faceta del municipio es una invitación a observar con atención, aprender sobre el entorno y disfrutar de la naturaleza de manera responsable.',
   'right');

-- Bloques editoriales -------------------------------------------------------
INSERT INTO curiosity_blocks
  (id, curiosity_id, block_type, title, eyebrow, body_text, media_side,
   media_count, column_count, paragraphs, sort_order)
VALUES
  -- Territorio
  (1, 1, 'row', 'Un territorio que nos identifica', NULL, NULL, 'left', 1, NULL,
   JSON_ARRAY(
     'El café fue uno de los productos que impulsó la economía de Gramalote y marcó la relación de sus habitantes con el trabajo del campo. Su cultivo contribuyó al desarrollo económico del municipio y al sustento de las familias campesinas, convirtiéndose en un referente de la historia y la identidad gramalotera.',
     'Su importancia también se refleja en la simbología municipal, especialmente en el himno, donde se evocan los cafetales y la esperanza de las cosechas. Las flores del cafeto representan la conexión entre la tierra, el esfuerzo de quienes la trabajan y el desarrollo de una comunidad cuya historia se ha construido alrededor de tres dimensiones fundamentales: la economía, la religión y la política.'
   ), 1),
  (2, 1, 'row', 'La Virgen de Monguí, una tradición que permanece', NULL, NULL, 'right', 1, NULL,
   JSON_ARRAY(
     'La Virgen de Monguí ocupa un lugar importante en la tradición religiosa y cultural de Gramalote. Su imagen ha acompañado celebraciones y encuentros comunitarios, y está vinculada con prácticas que reúnen a familias y habitantes de distintas generaciones.',
     'Durante las festividades tradicionales, la devoción a la Virgen ha estado relacionada con recorridos por las veredas y visitas a hogares campesinos, fortaleciendo los vínculos entre la fe y la vida comunitaria.'
   ), 2),
  (3, 1, 'row', 'El chocheco, parte de nuestra identidad gastronómica', NULL, NULL, 'left', 2, NULL,
   JSON_ARRAY(
     'El chocheco es un producto reconocido en la cocina tradicional de Gramalote. Se utiliza en preparaciones como la arepa de chocheco y representa una conexión entre los productos del campo y las costumbres alimentarias de sus habitantes.',
     'Su presencia en la gastronomía local permite reconocer cómo los ingredientes del territorio se convierten en parte de las recetas familiares y de los sabores que identifican a una comunidad.'
   ), 3),
  (4, 1, 'collection', 'Los elementos naturales que nos representan', NULL, NULL, NULL, 1, 3,
   JSON_ARRAY(
     'Los árboles, las flores y las aves hacen parte del paisaje, pero también pueden adquirir un significado cultural cuando la comunidad los reconoce como referentes de su entorno.'
   ), 4),

  -- Tradiciones
  (5, 2, 'row', 'Festinavidad: mucho más que una fiesta', NULL, NULL, 'left', 1, NULL,
   JSON_ARRAY(
     'Gramalote es un municipio de montañas y tradición agrícola, cuya identidad está ligada al trabajo campesino, las expresiones religiosas y el paisaje. El café fue uno de los productos que impulsó la economía de Gramalote y marcó la relación de sus habitantes con el trabajo del campo. Su cultivo contribuyó al desarrollo económico del municipio y al sustento de las familias campesinas, convirtiéndose en un referente de la historia y la identidad gramalotera.',
     'Sus símbolos y referentes culturales permiten conocer las costumbres y los vínculos que han acompañado la historia de su comunidad.'
   ), 1),
  (6, 2, 'featured', 'El regreso de la Virgen de Monguí', '26 DE NOVIEMBRE',
   'Una fecha que marcaba el comienzo de la temporada festiva.', NULL, 1, NULL,
   JSON_ARRAY(), 2),
  (7, 2, 'row', NULL, NULL, NULL, 'left', 1, NULL,
   JSON_ARRAY(
     'La temporada comenzaba el 26 de noviembre con el regreso de la imagen de la Virgen de Monguí al casco urbano, después de recorrer las veredas y visitar hogares campesinos. A partir de ese momento se desarrollaban encuentros familiares, comparsas, disfraces, canciones, representaciones teatrales y otras actividades que acompañaban la época navideña.'
   ), 3),
  (8, 2, 'row', 'Cuando el pueblo se convertía en escenario', NULL, NULL, 'right', 1, NULL,
   JSON_ARRAY(
     'Las comparsas y las representaciones en vivo transformaban las calles del antiguo Gramalote en espacios de encuentro y expresión cultural. Vecinos y amigos participaban en la preparación de disfraces, carrozas, canciones y escenas que hacían parte de las festividades.',
     'Estas actividades reflejaban la creatividad y la colaboración de la comunidad. Su preparación requería tiempo y participación colectiva, y permitía que personas de distintas edades contribuyeran a mantener vivas las celebraciones.'
   ), 4),
  (9, 2, 'row', 'El Seis de Reyes: una tradición con historia', NULL, NULL, 'right', 1, NULL,
   JSON_ARRAY(
     'El Seis de Reyes es recordado como una de las celebraciones tradicionales de Gramalote. La festividad incluía representaciones relacionadas con la llegada de los Reyes Magos y reunía a participantes y espectadores en una actividad que combinaba elementos religiosos y populares.',
     'Su continuidad a lo largo de las generaciones muestra la importancia de las celebraciones tradicionales en la vida comunitaria y en la memoria cultural del municipio.'
   ), 5),
  (10, 2, 'row', 'El 31 de diciembre y sus recuerdos', NULL, NULL, 'right', 1, NULL,
   JSON_ARRAY(
     'El cierre del año también dejó recuerdos importantes en la vida festiva de Gramalote. Los relatos sobre el antiguo municipio evocan la música, los bailes, los encuentros familiares y los globos que acompañaban las celebraciones del 31 de diciembre.',
     'Estas reuniones marcaban el final de un ciclo y ofrecían una oportunidad para compartir con familiares, vecinos y amigos. Hoy, los recuerdos de aquellas celebraciones permiten conocer cómo se vivían las fiestas y cómo contribuían a fortalecer los vínculos de la comunidad.'
   ), 6),

  -- Sabores
  (11, 3, 'row', 'El chocheco, un sabor de nuestra tierra', NULL, NULL, 'left', 1, NULL,
   JSON_ARRAY(
     'El chocheco es uno de los productos asociados con la gastronomía tradicional de Gramalote. Se utiliza en preparaciones como la arepa de chocheco y en recetas que aprovechan sus características para crear platos con identidad local.',
     'Su presencia en la cocina permite reconocer la importancia de los productos agrícolas y de los conocimientos que las familias han conservado para incorporarlos a su alimentación cotidiana.'
   ), 1),
  (12, 3, 'collection', 'Preparaciones que conservan la tradición', NULL, NULL, NULL, 1, 2,
   JSON_ARRAY(
     'Ambas recetas forman parte de las preparaciones gastronómicas documentadas en relación con Gramalote y permiten conocer técnicas culinarias transmitidas a través del tiempo.'
   ), 2),
  (13, 3, 'collection', 'Los amasijos: sabores para compartir', NULL, NULL, NULL, 1, 3,
   JSON_ARRAY(
     'Las preparaciones a base de maíz tienen presencia en la cocina tradicional. Entre las recetas asociadas con Gramalote se encuentran la arepa cariseca, la arepa de chocheco y los bollitos de maíz.',
     'La arepa cariseca se distingue por su preparación a base de maíz y por su textura característica, mientras que la arepa de chocheco incorpora este producto a la receta. Los bollitos de maíz son otra forma de aprovechar este ingrediente en preparaciones sencillas de la cocina tradicional.',
     'Estos alimentos muestran cómo los ingredientes cotidianos pueden transformarse en recetas que conservan conocimientos y costumbres familiares.'
   ), 3),
  (14, 3, 'row', 'Bebidas tradicionales y encuentros familiares', NULL, NULL, 'right', 1, NULL,
   JSON_ARRAY(
     'Las bebidas tradicionales acompañan reuniones y celebraciones en distintas comunidades de la región. Las chichas y los guarapos aparecen relacionados con encuentros festivos, mientras que el masato forma parte de la oferta gastronómica registrada en un establecimiento de Gramalote.',
     'La preparación de estas bebidas puede variar según los ingredientes y las costumbres de cada familia o productor. Compartirlas también hace parte de las experiencias en las que la comida y la bebida reúnen a las personas.'
   ), 4),

  -- Naturaleza
  (15, 4, 'feature', 'El Bojoso, un refugio natural', NULL, NULL, NULL, 1, NULL,
   JSON_ARRAY(
     'La Reserva Forestal Protectora Regional El Bojoso comprende áreas de Gramalote, Santiago y El Zulia, en Norte de Santander. Su importancia ambiental está relacionada con la conservación de los bosques, la protección de las fuentes de agua y el cuidado de los ecosistemas que sirven de hábitat para diferentes especies.',
     'Este espacio permite reconocer el valor de las áreas naturales para el equilibrio ambiental de la región y la importancia de conservarlas.'
   ), 1),
  (16, 4, 'row', 'Los ceibos y su relación con los cafetales', NULL, NULL, 'right', 1, NULL,
   JSON_ARRAY(
     'Los ceibos están vinculados con los paisajes rurales y los recuerdos de los antiguos cafetales de Gramalote. Su presencia forma parte de un entorno donde la vegetación y la actividad agrícola han acompañado la vida campesina.',
     'Estos árboles permiten recordar la relación entre el paisaje, los ciclos naturales y el trabajo del campo, elementos que han tenido importancia en la historia del municipio.'
   ), 2),
  (17, 4, 'row', 'La dalia, una flor que representa renovación', NULL, NULL, 'left', 1, NULL,
   JSON_ARRAY(
     'La dalia es una de las flores asociadas con los elementos naturales representativos de Gramalote. Por sus formas y colores, es una planta ornamental que puede destacar en jardines y espacios cultivados.',
     'Dentro de las referencias simbólicas del municipio, su imagen se relaciona con la renovación y la capacidad de seguir adelante. Así, una flor puede convertirse en una representación de esperanza y transformación para la comunidad.'
   ), 3),
  (18, 4, 'row', 'La chocheca, un ave de nuestro entorno', NULL, NULL, 'left', 1, NULL,
   JSON_ARRAY(
     'La chocheca, conocida también como urraca verde, es presentada en materiales educativos locales como un ave característica del entorno de Gramalote. Su plumaje combina tonos verdes, azules, amarillos y negros, y suele desplazarse en grupos ruidosos por bordes de bosque, cultivos y áreas arboladas.',
     'Su alimentación incluye frutos, semillas, insectos y pequeños vertebrados. En los relatos populares, sus llamados también se han relacionado con interpretaciones y creencias de la comunidad. La chocheca permite conocer tanto la fauna del entorno como las historias con las que sus habitantes interpretan la naturaleza.'
   ), 4),
  (19, 4, 'collection', 'Animales que habitan los bosques de la región', NULL, NULL, NULL, 1, 2,
   JSON_ARRAY(
     'El tigrillo y el oso mielero son animales silvestres asociados con los ambientes naturales de la región. El tigrillo es un felino de hábitos discretos que se alimenta de pequeños animales, mientras que el oso mielero es un mamífero que utiliza su lengua alargada para alimentarse principalmente de hormigas y termitas.',
     'Estas especies muestran la variedad de formas de vida que pueden encontrarse en los ecosistemas naturales y la importancia de conservar los espacios donde los animales consiguen alimento, refugio y condiciones para sobrevivir.'
   ), 5),
  (20, 4, 'row', 'Cascadas Arco Iris, un paisaje por descubrir', NULL, NULL, 'left', 2, NULL,
   JSON_ARRAY(
     'Las Cascadas Arco Iris se encuentran en la finca Limoncito, en la vereda Valderrama de Gramalote. Este atractivo natural ofrece una oportunidad para conocer el paisaje rural del municipio y disfrutar de un recorrido en contacto con la naturaleza.',
     'La visita requiere ropa cómoda, calzado cerrado e hidratación. También es recomendable llevar protección solar y consultar previamente las condiciones de acceso, los horarios y las tarifas para planear el recorrido con mayor seguridad.'
   ), 6);

INSERT INTO curiosity_collection_items
  (block_id, label, text, sort_order)
VALUES
  (4, 'Los ceibos', NULL, 1),
  (4, 'La dalia', NULL, 2),
  (4, 'La chocheca', NULL, 3),
  (12, 'Sopa de ruyas',
   'La sopa de ruyas es una preparación tradicional de la región que se elabora con pequeñas porciones de masa, incorporadas a una sopa que puede llevar otros ingredientes de la cocina casera.', 1),
  (12, 'La chocheca',
   'La jalea de pata de res es una preparación hecha a partir de la cocción de las patas de res, cuyo contenido de gelatina natural permite obtener una consistencia firme al enfriarse.', 2),
  (13, 'Arepa cariseca', NULL, 1),
  (13, 'Arepa de chocheco', NULL, 2),
  (13, 'Bollitos de maíz', NULL, 3),
  (19, 'El tigrillo', NULL, 1),
  (19, 'El oso mielero', NULL, 2);

-- ============================================================================
-- 5. Información práctica
-- ============================================================================

INSERT INTO access_routes (id, title, description, sort_order) VALUES
  (1, 'Desde Cúcuta', 'Consulta el recorrido hasta Gramalote.', 1),
  (2, 'Desde Pamplona', 'Consulta el recorrido hasta Gramalote.', 2),
  (3, 'Otros municipios', 'Consulta cómo llegar desde tu ubicación.', 3);

INSERT INTO transport_options (id, title, description, sort_order) VALUES
  (1, 'Vehículo particular',
   'Consulta el recorrido por carretera y revisa las condiciones de las vías.', 1),
  (2, 'Transporte público',
   'Verifica las alternativas disponibles y sus horarios antes de viajar.', 2);

INSERT INTO safety_tips (id, title, description, icon, sort_order) VALUES
  (1, 'Sigue las indicaciones locales',
   'Respeta las normas y recomendaciones de las autoridades.', 'shield', 1),
  (2, 'Precaución en senderos',
   'Consulta las condiciones del camino antes de realizar caminatas.', 'route', 2),
  (3, 'Zonas y acompañamiento',
   'Verifica si el lugar tiene restricciones o requiere guía.', 'user', 3),
  (4, 'Consulta el clima',
   'Revisa las condiciones meteorológicas antes de salir.', 'info', 4),
  (5, 'Cuida el entorno',
   'Respeta la naturaleza y las indicaciones de cada lugar.', 'shield', 5);

INSERT INTO preparation_tips (id, title, description, icon, sort_order) VALUES
  (1, 'Horarios', 'Confirma los horarios de los lugares que deseas visitar.', 'clock', 1),
  (2, 'Clima', 'Consulta el pronóstico y considera las condiciones de las vías.', 'info', 2),
  (3, 'Qué llevar', 'Prepara agua, ropa cómoda y lo necesario según tu actividad.', 'route', 3),
  (4, 'Conectividad', 'Guarda la información importante por si tienes poca señal.', 'phone', 4);

INSERT INTO useful_contacts
  (id, title, description, phone, hours, sort_order)
VALUES
  (1, 'Alcaldía de Gramalote',
   'Información institucional y orientación al visitante.',
   '+57 7 123 4567', 'Lun - Vie / 8:00 a. m. - 5:00 p. m.', 1),
  (2, 'Policía Nacional',
   'Orientación y atención en situaciones de emergencia.',
   '+57 7 123 4567', 'Lun - Vie / 8:00 a. m. - 5:00 p. m.', 2),
  (3, 'Salud y urgencias',
   'Información sobre atención médica y servicios de salud.',
   '+57 7 123 4567', 'Lun - Vie / 8:00 a. m. - 5:00 p. m.', 3),
  (4, 'Defensa Civil',
   'Apoyo en emergencias, prevención de riesgos y actividades de respuesta.',
   '+57 7 123 4567', 'Lun - Vie / 8:00 a. m. - 5:00 p. m.', 4);

-- ============================================================================
-- 6. Contenido de página sin tabla propia (site_settings como JSON)
--    Las páginas lo consumen desde GET /api/site.
-- ============================================================================

INSERT INTO site_settings (setting_key, setting_value, description) VALUES
  ('home.highlights',
   JSON_ARRAY(
     JSON_OBJECT('id', 'cascadas-arco-iris', 'title', 'Cascadas Arco Iris', 'category', 'Naturaleza', 'to', '/que-hacer/cascadas-arco-iris'),
     JSON_OBJECT('id', 'cafe-marquetalia', 'title', 'Café Marquetalia', 'category', 'Café', 'to', '/que-hacer/cafe-marquetalia'),
     JSON_OBJECT('id', 'la-sazon-de-la-tia', 'title', 'Restaurante El Gran Sazón', 'category', 'Restaurante', 'to', '/establecimiento/la-sazon-de-la-tia'),
     JSON_OBJECT('id', 'verdeser-glampings', 'title', 'VerdeSer Glampings', 'category', 'Glamping', 'to', '/establecimiento/verdeser-glampings'),
     JSON_OBJECT('id', 'hostal-luna-azul', 'title', 'Hostal Luna Azul', 'category', 'Hostal', 'to', '/establecimiento/hostal-luna-azul'),
     JSON_OBJECT('id', 'coofe-garden', 'title', 'Coofe Garden', 'category', 'Cafetería', 'to', '/donde-comer')
   ),
   'Tarjetas de “Abierto hoy” en el inicio'),
  ('home.experienceCards',
   JSON_ARRAY(
     JSON_OBJECT('id', 'cascadas-escondidas', 'slug', 'cascadas-arco-iris', 'title', 'Cascadas escondidas entre la niebla', 'category', 'Naturaleza', 'description', 'El sonido del agua te guía por el sendero. Al final, la recompensa es un arcoíris entre la niebla.', 'to', '/que-hacer/cascadas-arco-iris'),
     JSON_OBJECT('id', 'sabores-de-gramalote', 'slug', 'sabores-de-gramalote', 'title', 'Sabores de Gramalote', 'category', 'Gastronomía', 'description', 'Descubre los platos y sabores que reúnen historias, tradiciones y memoria del municipio.', 'to', '/donde-comer'),
     JSON_OBJECT('id', 'artesanias-con-identidad-local', 'slug', 'artesanias-con-identidad-local', 'title', 'Artesanías con identidad local', 'category', 'Cultura', 'description', 'Conoce los productos y las creaciones de los artesanos de Gramalote, piezas que guardan su historia.', 'to', '/donde-comprar')
   ),
   'Tarjetas de experiencias del inicio'),
  ('pages.categories',
   JSON_OBJECT(
     'comer', JSON_OBJECT(
       'label', 'Dónde comer',
       'eyebrow', 'Gastronomía local',
       'to', '/donde-comer',
       'intro', 'Descubre dónde comer en Gramalote. Consulta restaurantes, cafeterías y otros establecimientos gastronómicos para planear tu visita.',
       'filterLabel', 'Tipo',
       'filterAll', 'Todos los tipos',
       'filters', JSON_ARRAY('Restaurantes', 'Cafeterías', 'Comida típica', 'Postres'),
       'mapTitle', 'Mapa de establecimientos gastronómicos',
       'mapCta', 'Ver restaurantes en el mapa',
       'relationTitle', 'También puedes disfrutar en Gramalote',
       'relationText', 'Explora otras opciones gastronómicas del municipio y descubre lugares donde disfrutar de sabores locales y diferentes propuestas para compartir.'
     ),
     'dormir', JSON_OBJECT(
       'label', 'Dónde dormir',
       'eyebrow', 'Alojamientos en Gramalote',
       'to', '/donde-dormir',
       'intro', 'Encuentra alojamientos en Gramalote, conoce sus servicios y consulta la información necesaria para planear tu estadía.',
       'filterLabel', 'Tipo de alojamiento',
       'filterAll', 'Todos los tipos',
       'filters', JSON_ARRAY('Glamping', 'Hostal', 'Hotel', 'Cabañas'),
       'serviceLabel', 'Servicios',
       'serviceAll', 'Todos los servicios',
       'services', JSON_ARRAY('Desayuno', 'Parqueadero', 'Piscina', 'Wi-Fi'),
       'mapTitle', 'Mapa de alojamientos en Gramalote',
       'mapCta', 'Ver alojamientos en el mapa',
       'relationTitle', 'Dónde comprar',
       'relationText', 'Descubre las creaciones de los artesanos de Gramalote y encuentra tejidos, bisutería, decoración y recuerdos elaborados a mano.',
       'relationCta', 'Ver artesanos'
     ),
     'comprar', JSON_OBJECT(
       'label', 'Dónde comprar',
       'eyebrow', 'Artesanías y productos locales',
       'to', '/donde-comprar',
       'intro', 'Descubre las artesanías y creaciones locales de Gramalote. Encuentra productos hechos a mano, conoce a sus creadores y consulta cómo contactarlos.',
       'filterLabel', 'Tipo de producto',
       'filterAll', 'Todos los productos',
       'filters', JSON_ARRAY('Tejidos', 'Perfumería', 'Decoración', 'Regalos'),
       'priceLabel', 'Precio',
       'priceAll', 'Todos los precios',
       'prices', JSON_ARRAY('Hasta $50.000', '$50.000 - $150.000', 'Más de $150.000'),
       'mapTitle', 'Mapa de artesanos y establecimientos',
       'mapCta', 'Ver artesanos en el mapa'
     )
   ),
   'Textos de las páginas de listado por categoría'),
  ('site.explore',
   JSON_OBJECT(
     'label', 'Explorar',
     'items', JSON_ARRAY(
       JSON_OBJECT('label', 'Curiosidades', 'to', '/curiosidades'),
       JSON_OBJECT('label', 'Información práctica', 'to', '/informacion-practica')
     )
   ),
   'Menú “Explorar” de la cabecera'),
  ('site.practical',
   JSON_ARRAY(
     JSON_OBJECT('title', 'Cómo llegar', 'text', 'Orientación para llegar al municipio.', 'icon', 'route', 'to', '/informacion-practica#como-llegar'),
     JSON_OBJECT('title', 'Seguridad', 'text', 'Recomendaciones para un recorrido tranquilo.', 'icon', 'shield', 'to', '/informacion-practica#seguridad'),
     JSON_OBJECT('title', 'Contactos útiles', 'text', 'Números y entidades de apoyo en Gramalote.', 'icon', 'phone', 'to', '/informacion-practica#contactos'),
     JSON_OBJECT('title', 'Antes de salir', 'text', 'Qué llevar y qué tener en cuenta.', 'icon', 'info', 'to', '/informacion-practica#antes-de-salir')
   ),
   'Accesos de información práctica del footer')
AS new
ON DUPLICATE KEY UPDATE
  setting_value = new.setting_value,
  description = new.description;

-- ============================================================================
-- 7. Índice de búsqueda global
-- ============================================================================

INSERT INTO search_documents
  (entity_type, entity_id, title, body, url, is_published)
SELECT 'establishment', e.id, e.name,
       CONCAT_WS(' ', e.summary, e.description, COALESCE(e.address, ''),
                 COALESCE(t.name, ''), COALESCE(z.name, '')),
       CONCAT('/establecimiento/', e.slug), 1
FROM establishments e
LEFT JOIN establishment_types t ON t.id = e.type_id
LEFT JOIN zones z ON z.id = e.zone_id
WHERE e.is_published = 1 AND e.deleted_at IS NULL;

INSERT INTO search_documents
  (entity_type, entity_id, title, body, url, is_published)
SELECT 'experience', x.id, x.title,
       CONCAT_WS(' ', x.summary, x.description, COALESCE(x.address, ''),
                 COALESCE(c.name, '')),
       CONCAT('/que-hacer/', x.slug), 1
FROM experiences x
LEFT JOIN experience_categories c ON c.id = x.category_id
WHERE x.is_published = 1 AND x.deleted_at IS NULL;

INSERT INTO search_documents
  (entity_type, entity_id, title, body, url, is_published)
SELECT 'curiosity', s.id, s.title,
       CONCAT_WS(' ', s.summary, c.intro_text, COALESCE(c.closing_text, '')),
       CONCAT('/curiosidades/', s.slug), 1
FROM curiosity_sections s
JOIN curiosities c ON c.section_id = s.id
WHERE s.is_published = 1 AND s.deleted_at IS NULL;

INSERT INTO search_documents
  (entity_type, entity_id, title, body, url, is_published)
SELECT 'contact', c.id, c.title,
       CONCAT_WS(' ', c.description, COALESCE(c.hours, '')),
       '/informacion-practica#contactos', 1
FROM useful_contacts c
WHERE c.is_published = 1;
