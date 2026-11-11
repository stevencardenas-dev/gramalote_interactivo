-- ============================================================================
-- 016 · Fichas de «Qué hacer» con los textos y las fotos oficiales
--
-- Completa las cinco experiencias con lo documentado en «Textos de Qué hacer y
-- fichas de lugares» (entrega 03): descripción larga, horario, ubicación,
-- tarifa, teléfono, enlace de Google Maps, coordenadas y las cuatro tarjetas
-- «Ten en cuenta». Añade las fotos de galería que entrega el documento y que
-- hasta ahora solo existían en referencia/fotos-establecimientos.
--
-- Las fotos se sirven como estáticos desde /img/experiencias/<lugar>/ y se
-- registran como medios externos, igual que las de la migración 014.
-- Coordenadas tomadas de los enlaces oficiales de Google Maps (la de Café
-- Marquetalia sigue siendo aproximada: su enlace no las publica).
-- ============================================================================

SET NAMES utf8mb4;

-- Contenido de las fichas ----------------------------------------------------

UPDATE experiences SET
  summary = 'Un camino veredal junto a la quebrada Calderera, con el puente de Pueblo Viejo y los vestigios de la primera cabecera municipal.',
  description = 'Pueblo Viejo es un camino veredal en la vereda Miraflores, dividido por la quebrada Calderera, la más grande, extensa y caudalosa del pueblo, que dio origen al primer nombre del caserío: Caldereros. Allí está el icónico puente de Pueblo Viejo, hoy reconocido como el puente del Divino Niño, en alusión a la gruta elevada en honor al Divino Niño del 20 de Julio. Puedes ver vestigios de la primera cabecera municipal, el puente Gregorio Montes, tres íconos religiosos, entre ellos los dedicados a la Virgen y al Divino Niño, y un pozo espectacular en la quebrada. Hay un estadero para conseguir otros servicios y fincas cercanas que ofrecen bebidas hidratantes y típicas.',
  hours_text = 'Todos los días',
  address = 'Vereda Miraflores',
  access_text = 'Desde la vía antigua a Lourdes, desvío hacia la quebrada por el camino a mano derecha. A 30 min en vehículo del casco urbano.',
  price_text = 'No aplica',
  phone = '312 4160301',
  difficulty_text = 'Media baja',
  maps_url = 'https://maps.app.goo.gl/mUan6ZVf56pQzjtm8',
  latitude = 7.9015955,
  longitude = -72.7983908,
  open_daily = 1,
  schedule_json = CAST('{"mode":"always","days":{"1":[],"2":[],"3":[],"4":[],"5":[],"6":[],"7":[]}}' AS JSON)
WHERE slug = 'pueblo-viejo';

UPDATE experiences SET
  summary = 'Lo que queda de la segunda cabecera municipal de Gramalote, en pie a pesar del paso del tiempo y de la furia de la naturaleza.',
  description = 'Las ruinas del antiguo Gramalote son un espacio público que albergó la segunda cabecera municipal y que se mantiene en pie a pesar del paso del tiempo, las inclemencias del clima y la furia de la naturaleza. En el recorrido se pueden ver la plaza de la Restauración, la torre, el kiosco, el samán, las calles principales y algunas estructuras de las bases de los equipamientos de la época.',
  hours_text = 'Todos los días',
  address = 'Vereda Jácome',
  access_text = 'Por la vía hacia Villacaro, desviando hacia Lourdes a mano derecha por la vía antigua. A 31 min en vehículo del casco urbano.',
  price_text = 'No aplica',
  phone = '310 8664036',
  difficulty_text = 'Baja',
  maps_url = 'https://maps.app.goo.gl/dYMkfgvXAmU2HUA79',
  latitude = 7.8878061,
  longitude = -72.7977203,
  open_daily = 1,
  schedule_json = CAST('{"mode":"always","days":{"1":[],"2":[],"3":[],"4":[],"5":[],"6":[],"7":[]}}' AS JSON)
WHERE slug = 'ruinas-antiguo-gramalote';

UPDATE experiences SET
  summary = 'El tercer asentamiento urbano en la historia de Gramalote, planeado desde cero como proyecto piloto.',
  description = 'Nuevo Gramalote es el tercer asentamiento urbano en la historia del municipio, el más moderno de Colombia, catalogado como proyecto piloto y planeado desde cero con componentes ambientales, urbanísticos y sismorresistentes, entre otros. Cuenta con la casa de la cultura, cuyo auditorio convoca los viernes a una noche de películas en plan familiar; la biblioteca Gonzalo Canal Ramírez, en honor a un genio de las letras hijo de esta tierra; y escuelas de música y pintura, cuyos pequeños talentos se muestran en la plaza pública los fines de semana. También están la icónica casa campesina, que ofrece un espacio para que los productores pernocten y reciban asistencia técnica, y la cooperativa de café. Los visitantes encuentran oferta de gastronomía, hospedaje y artesanías, y el parque del café, en el mirador natural de Santa Anita, con vistas panorámicas y senderos para recorrer.',
  hours_text = 'Todos los días',
  address = 'Cabecera municipal',
  access_text = 'Desde Cúcuta, a una hora en vehículo particular o en empresas de servicio público.',
  price_text = 'A convenir',
  phone = NULL,
  email = 'turismo@gramalote-nortedesantander.gov.co',
  difficulty_text = 'Media alta',
  maps_url = 'https://maps.app.goo.gl/TWUNp359gLqdiA3ZA',
  latitude = 7.9150179,
  longitude = -72.7855365,
  open_daily = 1,
  schedule_json = CAST('{"mode":"always","days":{"1":[],"2":[],"3":[],"4":[],"5":[],"6":[],"7":[]}}' AS JSON)
WHERE slug = 'nuevo-gramalote';

UPDATE experiences SET
  summary = 'Espacios verdes para fotografías, hamacas, kioscos, cafetería y camping en Gramalote.',
  description = 'Café Marquetalia es un parque en la vereda Las Violetas con espacios verdes y atractivos para fotografías, hamacas, kioscos, cafetería, camping y alquiler de cocina para asados o sancocho. No cuenta con restaurante. En diciembre, enero y Semana Santa, consulta la disponibilidad.',
  hours_text = 'Sábados, domingos y lunes festivos, 9:00 a. m. – 6:00 p. m.',
  address = 'Vereda Las Violetas',
  access_text = 'Por la vía a Lourdes, desvío a mano derecha por la placa huella de asfalto inicial. A 20 min en carro o moto del casco urbano (2,5 km).',
  price_text = '$5.000',
  phone = '310 5770326',
  difficulty_text = 'Media baja',
  maps_url = 'https://maps.app.goo.gl/rrMCdWafA5XmGomJ9',
  latitude = 7.9300000,
  longitude = -72.7960000,
  open_daily = 0,
  schedule_json = CAST('{"mode":"multi","days":{"6":[{"opensAt":"09:00","closesAt":"18:00"}],"7":[{"opensAt":"09:00","closesAt":"18:00"}]}}' AS JSON)
WHERE slug = 'cafe-marquetalia';

UPDATE experiences SET
  access_text = 'Por la vía a Cúcuta, desvío a mano izquierda por trocha. A 15 min en vehículo del casco urbano.',
  maps_url = 'https://maps.app.goo.gl/gQ75yjS3BnRjhtfC6',
  latitude = 7.8827262,
  longitude = -72.7803418,
  open_daily = 1,
  schedule_json = CAST('{"mode":"always","days":{"1":[{"opensAt":"09:00","closesAt":"18:00"}],"2":[{"opensAt":"09:00","closesAt":"18:00"}],"3":[{"opensAt":"09:00","closesAt":"18:00"}],"4":[{"opensAt":"09:00","closesAt":"18:00"}],"5":[{"opensAt":"09:00","closesAt":"18:00"}],"6":[{"opensAt":"09:00","closesAt":"18:00"}],"7":[{"opensAt":"09:00","closesAt":"18:00"}]}}' AS JSON)
WHERE slug = 'cascadas-arco-iris';

-- «Ten en cuenta» oficial de cada ficha --------------------------------------

DELETE t FROM experience_tips t JOIN experiences x ON x.id = t.experience_id
WHERE x.slug IN ('pueblo-viejo', 'ruinas-antiguo-gramalote', 'nuevo-gramalote', 'cafe-marquetalia');

INSERT INTO experience_tips (experience_id, icon, title, description, sort_order)
SELECT x.id, t.icon, t.title, t.description, t.sort_order
FROM experiences x
JOIN (
  SELECT 'pueblo-viejo' AS slug, 'huellas' AS icon, 'Tiempo de caminata' AS title,
         'Desde el desvío, 5 minutos en vehículo o unos 15 minutos a pie.' AS description, 1 AS sort_order
  UNION ALL SELECT 'pueblo-viejo', 'camino', 'Dificultad',
         'Media-baja. Se recomienda ir con guía y tener en cuenta las condiciones del acceso.', 2
  UNION ALL SELECT 'pueblo-viejo', 'bolso', 'Recomendaciones',
         'Lleva ropa cómoda, zapatos cerrados, agua, gorra y protector solar. No fumar. Hay zona amplia de parqueo.', 3
  UNION ALL SELECT 'pueblo-viejo', 'info', 'Estado del lugar',
         'Abierto todos los días. Hay estadero y fincas cercanas con bebidas.', 4
  UNION ALL SELECT 'ruinas-antiguo-gramalote', 'huellas', 'Tiempo de caminata',
         'El recorrido por las ruinas y la antigua plaza toma unas 2 horas.', 1
  UNION ALL SELECT 'ruinas-antiguo-gramalote', 'camino', 'Dificultad',
         'Baja. Se recomienda ir con guía y respetar las zonas restringidas.', 2
  UNION ALL SELECT 'ruinas-antiguo-gramalote', 'bolso', 'Recomendaciones',
         'No fumes ni consumas alcohol, no entres a las ruinas ni al templo, no toques osamentas y no uses pólvora.', 3
  UNION ALL SELECT 'ruinas-antiguo-gramalote', 'info', 'Estado del lugar',
         'Abierto todos los días. No hay parqueadero: se deja el vehículo alrededor de la plaza.', 4
  UNION ALL SELECT 'nuevo-gramalote', 'huellas', 'Tiempo de caminata',
         'Hasta 3 horas a pie, según el recorrido que elijas por el pueblo.', 1
  UNION ALL SELECT 'nuevo-gramalote', 'camino', 'Dificultad',
         'Media-alta. Se recomienda ir con guía, sobre todo si vas a recorrerlo a pie.', 2
  UNION ALL SELECT 'nuevo-gramalote', 'bolso', 'Recomendaciones',
         'Usa ropa y zapatos cómodos, hidrátate y protégete del sol. Cuida el medio ambiente. Solo hay bahías de estacionamiento.', 3
  UNION ALL SELECT 'nuevo-gramalote', 'info', 'Estado del lugar',
         'Abierto todos los días. Recorrerlo no tiene costo; guía y transporte se pagan aparte.', 4
  UNION ALL SELECT 'cafe-marquetalia', 'huellas', 'Tiempo de caminata',
         'Unos 20 minutos de recorrido desde la entrada del lugar, donde se puede dejar el vehículo.', 1
  UNION ALL SELECT 'cafe-marquetalia', 'camino', 'Dificultad',
         'Media-baja. Se recomienda ir con guía y tener en cuenta las condiciones del acceso.', 2
  UNION ALL SELECT 'cafe-marquetalia', 'bolso', 'Recomendaciones',
         'Lleva ropa cómoda, zapatos cerrados, agua, gorra y protector solar. No fumar. Hay parqueadero en la entrada.', 3
  UNION ALL SELECT 'cafe-marquetalia', 'info', 'Estado del lugar',
         'Sábados, domingos y lunes festivos, 9:00 a. m. – 6:00 p. m. En diciembre, enero y Semana Santa, consulta disponibilidad.', 4
) t ON t.slug = x.slug;

-- Fotos de galería entregadas por diseño -------------------------------------

INSERT IGNORE INTO media (storage_disk, storage_path, public_url, mime_type, alt_text, source)
SELECT 'static', m.path, m.url, 'image/webp', m.alt, 'figma'
FROM (
  SELECT 'img/experiencias/marquetalia/sendero-bosque.webp' AS path,
         '/img/experiencias/marquetalia/sendero-bosque.webp' AS url,
         'Sendero del café en el bosque' AS alt
  UNION ALL SELECT 'img/experiencias/marquetalia/entrada.webp',
         '/img/experiencias/marquetalia/entrada.webp', 'Acceso y letrero de Café Marquetalia'
  UNION ALL SELECT 'img/experiencias/marquetalia/zonas-verdes.webp',
         '/img/experiencias/marquetalia/zonas-verdes.webp', 'Zonas verdes de Café Marquetalia'
  UNION ALL SELECT 'img/experiencias/marquetalia/zona-recreativa.webp',
         '/img/experiencias/marquetalia/zona-recreativa.webp', 'Zona recreativa de Café Marquetalia'
  UNION ALL SELECT 'img/experiencias/marquetalia/kiosco.webp',
         '/img/experiencias/marquetalia/kiosco.webp', 'Kiosco de Café Marquetalia'
  UNION ALL SELECT 'img/experiencias/ruinas/panoramica-aerea.webp',
         '/img/experiencias/ruinas/panoramica-aerea.webp', 'Panorámica aérea de las ruinas del antiguo Gramalote'
  UNION ALL SELECT 'img/experiencias/ruinas/iglesia-lateral.webp',
         '/img/experiencias/ruinas/iglesia-lateral.webp', 'Iglesia en ruinas vista lateral'
  UNION ALL SELECT 'img/experiencias/ruinas/iglesia-lateral-2.webp',
         '/img/experiencias/ruinas/iglesia-lateral-2.webp', 'Iglesia en ruinas desde otro ángulo lateral'
  UNION ALL SELECT 'img/experiencias/ruinas/iglesia-montanas.webp',
         '/img/experiencias/ruinas/iglesia-montanas.webp', 'Iglesia en ruinas entre las montañas'
  UNION ALL SELECT 'img/experiencias/ruinas/vista-aerea.webp',
         '/img/experiencias/ruinas/vista-aerea.webp', 'Vista aérea de las ruinas y su entorno'
  UNION ALL SELECT 'img/experiencias/nuevo-gramalote/plaza-aerea.webp',
         '/img/experiencias/nuevo-gramalote/plaza-aerea.webp', 'Vista aérea de la plaza de Nuevo Gramalote'
  UNION ALL SELECT 'img/experiencias/nuevo-gramalote/viviendas.webp',
         '/img/experiencias/nuevo-gramalote/viviendas.webp', 'Viviendas de Nuevo Gramalote'
  UNION ALL SELECT 'img/experiencias/nuevo-gramalote/calle-colorida.webp',
         '/img/experiencias/nuevo-gramalote/calle-colorida.webp', 'Calle colorida de Nuevo Gramalote entre las montañas'
  UNION ALL SELECT 'img/experiencias/nuevo-gramalote/espacio-publico.webp',
         '/img/experiencias/nuevo-gramalote/espacio-publico.webp', 'Espacio público de Nuevo Gramalote'
  UNION ALL SELECT 'img/experiencias/nuevo-gramalote/plaza-principal.webp',
         '/img/experiencias/nuevo-gramalote/plaza-principal.webp', 'Plaza principal de Nuevo Gramalote'
) m;
SELECT x.id, m.id, 'gallery', i.sort_order
FROM (
  SELECT 'cafe-marquetalia' AS slug, '/img/experiencias/marquetalia/sendero-bosque.webp' AS url, 2 AS sort_order
  UNION ALL SELECT 'cafe-marquetalia', '/img/experiencias/marquetalia/entrada.webp', 3
  UNION ALL SELECT 'cafe-marquetalia', '/img/experiencias/marquetalia/zonas-verdes.webp', 4
  UNION ALL SELECT 'cafe-marquetalia', '/img/experiencias/marquetalia/zona-recreativa.webp', 5
  UNION ALL SELECT 'cafe-marquetalia', '/img/experiencias/marquetalia/kiosco.webp', 6
  UNION ALL SELECT 'ruinas-antiguo-gramalote', '/img/experiencias/ruinas/panoramica-aerea.webp', 2
  UNION ALL SELECT 'ruinas-antiguo-gramalote', '/img/experiencias/ruinas/iglesia-lateral.webp', 3
  UNION ALL SELECT 'ruinas-antiguo-gramalote', '/img/experiencias/ruinas/iglesia-lateral-2.webp', 4
  UNION ALL SELECT 'ruinas-antiguo-gramalote', '/img/experiencias/ruinas/iglesia-montanas.webp', 5
  UNION ALL SELECT 'ruinas-antiguo-gramalote', '/img/experiencias/ruinas/vista-aerea.webp', 6
  UNION ALL SELECT 'nuevo-gramalote', '/img/experiencias/nuevo-gramalote/plaza-aerea.webp', 2
  UNION ALL SELECT 'nuevo-gramalote', '/img/experiencias/nuevo-gramalote/viviendas.webp', 3
  UNION ALL SELECT 'nuevo-gramalote', '/img/experiencias/nuevo-gramalote/calle-colorida.webp', 4
  UNION ALL SELECT 'nuevo-gramalote', '/img/experiencias/nuevo-gramalote/espacio-publico.webp', 5
  UNION ALL SELECT 'nuevo-gramalote', '/img/experiencias/nuevo-gramalote/plaza-principal.webp', 6
) i
JOIN experiences x ON x.slug = i.slug
JOIN media m ON m.public_url = i.url AND m.storage_disk = 'static';
