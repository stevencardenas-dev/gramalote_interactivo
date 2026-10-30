-- ============================================================================
-- 002 · Matriz de establecimientos del 29 de octubre
--
-- · Coordenadas para el mapa. Origen: "g" = enlace de Google Maps de la matriz,
--   "c" = código Plus del enlace, "i" = INFERIDAS a partir de la dirección o
--   referencia (aproximadas; verificar con la Alcaldía).
-- · Completa solo datos vacíos de las fichas existentes (no pisa lo editado en
--   el panel) y agrega los establecimientos que aún no estaban.
-- · Las fichas sin datos o pendientes de la Alcaldía entran SIN publicar.
-- · Idempotente: se puede volver a aplicar sin duplicar filas.
-- ============================================================================

SET NAMES utf8mb4;

-- Tipos y servicios nuevos ----------------------------------------------------
INSERT IGNORE INTO establishment_types (category_id, slug, name, filter_group, sort_order)
VALUES (1, 'restaurante', 'Restaurante', 'Restaurantes', 8);

INSERT IGNORE INTO services (slug, name, icon, sort_order) VALUES
  ('cocina-disponible', 'Cocina disponible', NULL, 12),
  ('pet-friendly', 'Pet friendly', NULL, 13);

-- EST-01 · Glamping Vista Antigua (coords i)
UPDATE establishments SET latitude = COALESCE(latitude, 7.898), longitude = COALESCE(longitude, -72.7835), address = COALESCE(address, 'Vda. Valderrama, finca Poquitos, km 2, vía Gramalote–Cúcuta'), phone = COALESCE(phone, '313 4859671'), whatsapp = COALESCE(whatsapp, '313 4859671'), hours_text = COALESCE(hours_text, 'de lunes a lunes'), checkin_text = COALESCE(checkin_text, '2–3 p. m. / 12–1 p. m.'), price_text = COALESCE(price_text, '$150.000 – $250.000') WHERE slug = 'glamping-vista-antigua';

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'instagram', 'https://www.instagram.com/glampingvistaantigua', 1 FROM establishments WHERE slug = 'glamping-vista-antigua';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'efectivo' WHERE e.slug = 'glamping-vista-antigua';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'transferencia' WHERE e.slug = 'glamping-vista-antigua';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'tarjeta' WHERE e.slug = 'glamping-vista-antigua';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'nequi' WHERE e.slug = 'glamping-vista-antigua';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'daviplata' WHERE e.slug = 'glamping-vista-antigua';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'wifi' WHERE e.slug = 'glamping-vista-antigua';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'parqueadero' WHERE e.slug = 'glamping-vista-antigua';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'zonas-verdes' WHERE e.slug = 'glamping-vista-antigua';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'pet-friendly' WHERE e.slug = 'glamping-vista-antigua';

-- EST-02 · Verdeser Glampings (coords g)
UPDATE establishments SET latitude = COALESCE(latitude, 7.9225), longitude = COALESCE(longitude, -72.791111), address = COALESCE(address, 'W6C5+XF Gramalote · vereda Miraflores, finca Gratamira'), phone = COALESCE(phone, '320 2230392'), whatsapp = COALESCE(whatsapp, '320 2230392'), hours_text = COALESCE(hours_text, 'de lunes a domingo'), checkin_text = COALESCE(checkin_text, '4:00 p. m. / 1:00 p. m.'), price_text = COALESCE(price_text, '$200.000 – $500.000') WHERE slug = 'verdeser-glampings';

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'instagram', 'https://www.instagram.com/verdeserglamping', 1 FROM establishments WHERE slug = 'verdeser-glampings';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'efectivo' WHERE e.slug = 'verdeser-glampings';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'transferencia' WHERE e.slug = 'verdeser-glampings';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'nequi' WHERE e.slug = 'verdeser-glampings';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'wifi' WHERE e.slug = 'verdeser-glampings';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'parqueadero' WHERE e.slug = 'verdeser-glampings';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'desayuno' WHERE e.slug = 'verdeser-glampings';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'zonas-verdes' WHERE e.slug = 'verdeser-glampings';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'cocina-disponible' WHERE e.slug = 'verdeser-glampings';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'pet-friendly' WHERE e.slug = 'verdeser-glampings';

-- EST-03 · Hostal Campestre Camino Real (coords g)
UPDATE establishments SET latitude = COALESCE(latitude, 7.9131), longitude = COALESCE(longitude, -72.7849), address = COALESCE(address, 'Finca Cristalito, vereda Miraflores'), phone = COALESCE(phone, '313 4138279'), whatsapp = COALESCE(whatsapp, '313 4138279'), hours_text = COALESCE(hours_text, 'de lunes a domingo'), checkin_text = COALESCE(checkin_text, '2:00 p. m. / 12:00 p. m.'), price_text = COALESCE(price_text, 'Desde $30.000 por persona') WHERE slug = 'hostal-campestre-camino-real';

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'instagram', 'https://www.instagram.com/hostal.caminoreal', 3 FROM establishments WHERE slug = 'hostal-campestre-camino-real';
INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'facebook', 'https://m.facebook.com/caminorealnuevogramalote/', 3 FROM establishments WHERE slug = 'hostal-campestre-camino-real';
INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'tiktok', 'https://www.tiktok.com/@hostalcaminoreal', 3 FROM establishments WHERE slug = 'hostal-campestre-camino-real';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'efectivo' WHERE e.slug = 'hostal-campestre-camino-real';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'transferencia' WHERE e.slug = 'hostal-campestre-camino-real';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'tarjeta' WHERE e.slug = 'hostal-campestre-camino-real';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'wifi' WHERE e.slug = 'hostal-campestre-camino-real';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'parqueadero' WHERE e.slug = 'hostal-campestre-camino-real';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'zonas-verdes' WHERE e.slug = 'hostal-campestre-camino-real';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'cocina-disponible' WHERE e.slug = 'hostal-campestre-camino-real';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'pet-friendly' WHERE e.slug = 'hostal-campestre-camino-real';

-- EST-04 · Hostal Luna Azul (coords g)
UPDATE establishments SET latitude = COALESCE(latitude, 7.9135867), longitude = COALESCE(longitude, -72.7905758), address = COALESCE(address, 'Mz 4, casa 15, Santa Rosa La Grande'), phone = COALESCE(phone, '311 7906933'), whatsapp = COALESCE(whatsapp, '311 7906933'), hours_text = COALESCE(hours_text, 'de lunes a domingo de 6am a 9pm'), checkin_text = COALESCE(checkin_text, '3:00 p. m. / 1:00 p. m.'), price_text = COALESCE(price_text, '$30.000 por persona') WHERE slug = 'hostal-luna-azul';

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'facebook', 'https://www.facebook.com/people/Hostal-luna-azul/100054245510564/', 2 FROM establishments WHERE slug = 'hostal-luna-azul';
INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'tiktok', 'https://www.tiktok.com/@hostallunaazul0', 2 FROM establishments WHERE slug = 'hostal-luna-azul';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'efectivo' WHERE e.slug = 'hostal-luna-azul';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'transferencia' WHERE e.slug = 'hostal-luna-azul';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'nequi' WHERE e.slug = 'hostal-luna-azul';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'wifi' WHERE e.slug = 'hostal-luna-azul';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'zonas-verdes' WHERE e.slug = 'hostal-luna-azul';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'cocina-disponible' WHERE e.slug = 'hostal-luna-azul';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'pet-friendly' WHERE e.slug = 'hostal-luna-azul';

-- EST-05 · Casa Hiedra Hotel Boutique (coords g)
UPDATE establishments SET latitude = COALESCE(latitude, 7.9187065), longitude = COALESCE(longitude, -72.7883109), address = COALESCE(address, 'Mz 40, lote 6, barrio Santa Anita'), phone = COALESCE(phone, '311 4663939'), whatsapp = COALESCE(whatsapp, '311 4663939'), hours_text = COALESCE(hours_text, 'de lunes a domingo de 6am a 10pm'), checkin_text = COALESCE(checkin_text, '2:00 p. m. / 12:00 p. m. (día sig.)'), price_text = COALESCE(price_text, '$100.000 – $290.000') WHERE slug = 'casa-hiedra-hotel-boutique';

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'instagram', 'https://www.instagram.com/casahiedrahotelboutique', 1 FROM establishments WHERE slug = 'casa-hiedra-hotel-boutique';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'efectivo' WHERE e.slug = 'casa-hiedra-hotel-boutique';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'transferencia' WHERE e.slug = 'casa-hiedra-hotel-boutique';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'nequi' WHERE e.slug = 'casa-hiedra-hotel-boutique';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'daviplata' WHERE e.slug = 'casa-hiedra-hotel-boutique';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'wifi' WHERE e.slug = 'casa-hiedra-hotel-boutique';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'desayuno' WHERE e.slug = 'casa-hiedra-hotel-boutique';

-- EST-06 · Cabañas El Peñón (coords g)
UPDATE establishments SET latitude = COALESCE(latitude, 7.8676839), longitude = COALESCE(longitude, -72.7811843), address = COALESCE(address, 'Vereda Valderrama, salida a Cúcuta'), phone = COALESCE(phone, '321 3403855'), whatsapp = COALESCE(whatsapp, '321 3403855'), hours_text = COALESCE(hours_text, 'horario de atención 24/7'), checkin_text = COALESCE(checkin_text, '2:00 p. m. / 2:00 p. m. (día sig.) · 24/7'), price_text = COALESCE(price_text, 'Pareja $80.000 · familiar $35.000/persona') WHERE slug = 'cabanas-el-penon';

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'instagram', 'https://www.instagram.com/el_penon13', 3 FROM establishments WHERE slug = 'cabanas-el-penon';
INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'facebook', 'https://www.facebook.com/profile.php?id=100092449005644', 3 FROM establishments WHERE slug = 'cabanas-el-penon';
INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'tiktok', 'https://www.tiktok.com/@cabanaselpenon78', 3 FROM establishments WHERE slug = 'cabanas-el-penon';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'transferencia' WHERE e.slug = 'cabanas-el-penon';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'nequi' WHERE e.slug = 'cabanas-el-penon';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'daviplata' WHERE e.slug = 'cabanas-el-penon';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'wifi' WHERE e.slug = 'cabanas-el-penon';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'parqueadero' WHERE e.slug = 'cabanas-el-penon';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'piscina' WHERE e.slug = 'cabanas-el-penon';
INSERT IGNORE INTO establishment_services (establishment_id, service_id)
  SELECT e.id, s.id FROM establishments e JOIN services s ON s.slug = 'zonas-verdes' WHERE e.slug = 'cabanas-el-penon';

-- EST-07 · Glamping El Hacendado (sin coordenadas)
INSERT INTO establishments
  (slug, name, category_id, type_id, zone_id, location_detail, summary, description,
   address, latitude, longitude, phone, phone_secondary, whatsapp, email, hours_text,
   checkin_text, price_text, is_published, sort_order, published_at)
SELECT 'glamping-el-hacendado', 'Glamping El Hacendado', 2,
       (SELECT id FROM establishment_types WHERE category_id = 2 AND slug = 'glamping'),
       NULL, NULL, 'Glamping El Hacendado: ficha pendiente de información.', 'Ficha pendiente de información: Glamping El Hacendado.',
       NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
       NULL, NULL, 0, 100, NULL
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM establishments WHERE slug = 'glamping-el-hacendado');


-- EST-08 · Chelinarte (coords i)
UPDATE establishments SET latitude = COALESCE(latitude, 7.9158), longitude = COALESCE(longitude, -72.7869), address = COALESCE(address, 'Parque principal, frente al súper La Morrocota (carpa blanca)'), phone = COALESCE(phone, '350 5262124'), whatsapp = COALESCE(whatsapp, '350 5262124'), hours_text = COALESCE(hours_text, 'Sáb., dom. y festivos, 9 a. m.–6 p. m.'), price_text = COALESCE(price_text, 'Llaveros $2.000–$20.000 · Tejidos $10.000–$240.000') WHERE slug = 'chelinarte';

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'facebook', 'https://facebook.com/profile.php?id=61587321850818', 1 FROM establishments WHERE slug = 'chelinarte';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'efectivo' WHERE e.slug = 'chelinarte';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'transferencia' WHERE e.slug = 'chelinarte';

-- EST-09 · Creaciones Martina (sin coordenadas)
UPDATE establishments SET address = COALESCE(address, 'Finca San Luis'), phone = COALESCE(phone, '312 3856999'), whatsapp = COALESCE(whatsapp, '312 3856999'), email = COALESCE(email, 'creacionesmartina31@gmail.com'), hours_text = COALESCE(hours_text, 'Lun–vie 8 a. m.–6 p. m. · Sáb. 8 a. m.–12 m.'), price_text = COALESCE(price_text, '$5.000 – $150.000 según producto') WHERE slug = 'creaciones-martina';

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'instagram', 'https://www.instagram.com/creaciones_martina31', 1 FROM establishments WHERE slug = 'creaciones-martina';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'efectivo' WHERE e.slug = 'creaciones-martina';

-- EST-10 · ArteLu (coords c)
INSERT INTO establishments
  (slug, name, category_id, type_id, zone_id, location_detail, summary, description,
   address, latitude, longitude, phone, phone_secondary, whatsapp, email, hours_text,
   checkin_text, price_text, is_published, sort_order, published_at)
SELECT 'artelu', 'ArteLu', 3,
       (SELECT id FROM establishment_types WHERE category_id = 3 AND slug = 'regalos-manualidades'),
       1, NULL, 'Figuras en porcelana fría y figuras en resina; trabajos personalizados.', 'Figuras en porcelana fría y figuras en resina; trabajos personalizados. Ofrece: Amigurumis, figuras en porcelana fría, velas aromatizadas, llaveros y figuras en resina; trabajos personalizados.',
       'Los Santos', '7.9184375', '-72.7894375', '320 2947005', NULL, '320 2947005', NULL, '7:00 a. m.–7:00 p. m.',
       NULL, 'Desde $22.000', 1, 100, NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM establishments WHERE slug = 'artelu');

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'instagram', 'https://www.instagram.com/artelu_03', 1 FROM establishments WHERE slug = 'artelu';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'efectivo' WHERE e.slug = 'artelu';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'transferencia' WHERE e.slug = 'artelu';

-- EST-11 · Mi Hermoso Edén (coords g)
UPDATE establishments SET latitude = COALESCE(latitude, 7.8804), longitude = COALESCE(longitude, -72.7863), address = COALESCE(address, 'Vía Santuario, Gramalote'), phone = COALESCE(phone, '311 5841937'), whatsapp = COALESCE(whatsapp, '311 5841937'), hours_text = COALESCE(hours_text, '6:00 a. m.–7:00 p. m.'), price_text = COALESCE(price_text, '$3.000 – $50.000') WHERE slug = 'mi-hermoso-eden';

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'facebook', 'https://www.facebook.com/profile.php?id=61572464730760', 2 FROM establishments WHERE slug = 'mi-hermoso-eden';
INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'tiktok', 'https://tiktok.com/@indrid.detall.gme', 2 FROM establishments WHERE slug = 'mi-hermoso-eden';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'nequi' WHERE e.slug = 'mi-hermoso-eden';

-- EST-12 · Maestros de la Madera (coords i)
UPDATE establishments SET latitude = COALESCE(latitude, 7.916), longitude = COALESCE(longitude, -72.7866), address = COALESCE(address, 'Plaza principal de nuevo Gramalote'), phone = COALESCE(phone, '311 8117950'), whatsapp = COALESCE(whatsapp, '311 8117950'), hours_text = COALESCE(hours_text, 'Dom. y festivos, 9 a. m.–6 p. m.'), price_text = COALESCE(price_text, 'Desde $5.000') WHERE slug = 'maestros-de-la-madera';

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'facebook', 'https://www.facebook.com/arnaldo.saravia.31', 1 FROM establishments WHERE slug = 'maestros-de-la-madera';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'efectivo' WHERE e.slug = 'maestros-de-la-madera';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'nequi' WHERE e.slug = 'maestros-de-la-madera';

-- EST-13 · Mi Gordita Bella (coords g)
UPDATE establishments SET latitude = COALESCE(latitude, 7.91608), longitude = COALESCE(longitude, -72.785622), address = COALESCE(address, 'Vía a Villa Caro, Loma de Valduz'), phone = COALESCE(phone, '313 3812029'), whatsapp = COALESCE(whatsapp, '313 3812029'), hours_text = COALESCE(hours_text, '6:00 a. m.–7:00 p. m.'), price_text = COALESCE(price_text, '$2.000 – $15.000') WHERE slug = 'mi-gordita-bella';

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'facebook', 'https://www.facebook.com/share/1DrZRo6P41/', 1 FROM establishments WHERE slug = 'mi-gordita-bella';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'efectivo' WHERE e.slug = 'mi-gordita-bella';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'nequi' WHERE e.slug = 'mi-gordita-bella';

-- EST-14 · Yawart (coords g)
INSERT INTO establishments
  (slug, name, category_id, type_id, zone_id, location_detail, summary, description,
   address, latitude, longitude, phone, phone_secondary, whatsapp, email, hours_text,
   checkin_text, price_text, is_published, sort_order, published_at)
SELECT 'yawart', 'Yawart', 3,
       (SELECT id FROM establishment_types WHERE category_id = 3 AND slug = 'tejidos-accesorios'),
       1, NULL, 'Tejidos, bordados, en crochet, porcelanicrón, yute y otros.', 'Tejidos, bordados, en crochet, porcelanicrón, yute y otros. Ofrece: adornos navideños, llaveros y souvenirs, cojines tejas con adornos en porcelanicron.',
       'Manzana 46-23A', '7.9195026', '-72.7847273', '320 4039695', NULL, '320 4039695', NULL, '6:00 a. m.–7:00 p. m.',
       NULL, 'Cojines $ 100000', 1, 100, NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM establishments WHERE slug = 'yawart');

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'facebook', 'https://facebook.com/share/p/1Di55fLiNj', 1 FROM establishments WHERE slug = 'yawart';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'efectivo' WHERE e.slug = 'yawart';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'nequi' WHERE e.slug = 'yawart';

-- EST-15 · Caliopes (coords g)
INSERT INTO establishments
  (slug, name, category_id, type_id, zone_id, location_detail, summary, description,
   address, latitude, longitude, phone, phone_secondary, whatsapp, email, hours_text,
   checkin_text, price_text, is_published, sort_order, published_at)
SELECT 'caliopes', 'Caliopes', 3,
       (SELECT id FROM establishment_types WHERE category_id = 3 AND slug = 'decoracion-hogar'),
       NULL, 'Vereda / zona rural', 'Fabricación y venta de macetas pequeñas para decoración interior, y plantas.', 'Fabricación y venta de macetas pequeñas para decoración interior, y plantas. Ofrece: macetas pequeñas.',
       'Vereda Villanueva', '7.9083831', '-72.8306801', '322 2028431', NULL, '322 2028431', NULL, '6:00 a. m.–7:00 p. m.',
       NULL, 'Llaveros $ 8000 a 15000.', 1, 100, NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM establishments WHERE slug = 'caliopes');

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'instagram', 'https://www.instagram.com/caliopes_pots', 1 FROM establishments WHERE slug = 'caliopes';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'efectivo' WHERE e.slug = 'caliopes';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'nequi' WHERE e.slug = 'caliopes';

-- EST-16 · Bisutería MG (coords g)
INSERT INTO establishments
  (slug, name, category_id, type_id, zone_id, location_detail, summary, description,
   address, latitude, longitude, phone, phone_secondary, whatsapp, email, hours_text,
   checkin_text, price_text, is_published, sort_order, published_at)
SELECT 'bisuteria-mg', 'Bisutería MG', 3,
       (SELECT id FROM establishment_types WHERE category_id = 3 AND slug = 'detalles-accesorios'),
       NULL, 'Vereda / zona rural', 'Bisutertia hechas con limpiapipas.', 'Bisutertia hechas con limpiapipas. Ofrece: manillas, pulseras, brasaletes, otros.',
       'Vereda Miraflores, finca Las Margaritas', '7.923257', '-72.791304', '313 4407359', NULL, '313 4407359', NULL, '6:00 a. m.–7:00 p. m.',
       NULL, 'La teja $ 40000', 1, 100, NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM establishments WHERE slug = 'bisuteria-mg');

INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'efectivo' WHERE e.slug = 'bisuteria-mg';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'nequi' WHERE e.slug = 'bisuteria-mg';

-- EST-17 · Sombreros TECHA (coords g)
INSERT INTO establishments
  (slug, name, category_id, type_id, zone_id, location_detail, summary, description,
   address, latitude, longitude, phone, phone_secondary, whatsapp, email, hours_text,
   checkin_text, price_text, is_published, sort_order, published_at)
SELECT 'sombreros-techa', 'Sombreros TECHA', 3,
       (SELECT id FROM establishment_types WHERE category_id = 3 AND slug = 'tejidos-accesorios'),
       1, NULL, 'Sombreros, blusas, faldas, vestidos y accesorios tejidos a mano que rescatan la tradición del tejido artesanal con un toque moderno.', 'Sombreros, blusas, faldas, vestidos y accesorios tejidos a mano que rescatan la tradición del tejido artesanal con un toque moderno. Ofrece: Productos sombreros tejidos 60.000 a 140.000 blusas tejidas 80.000 a 200.000 faldas tejidas 150.000 a 250.000 vestidos tejidos 350.000 a 700.000 collares aretes 25.000 a 90.000 monederos tejidos 35.000 a 55.000 bolsos tejidos 90.000 150.000 vestidos de baño tejidos 150.000 a 200.000 boinas tejidas 55.000 a 70.000 muñecas barbie con vestido tejido 50.000.',
       'MZ1 Casa Calle Real', '7.9161583', '-72.7875621', '314 8903271', NULL, '314 8903271', NULL, '10 mañana a 2 tarde lunes a viernes 10a 4tarde tarde sábados y domingos',
       NULL, 'desde 35k asta 700k', 1, 100, NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM establishments WHERE slug = 'sombreros-techa');

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'instagram', 'https://www.instagram.com/sombrerostecha', 3 FROM establishments WHERE slug = 'sombreros-techa';
INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'facebook', 'https://www.facebook.com/share/1C24QxtxA7/', 3 FROM establishments WHERE slug = 'sombreros-techa';
INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'youtube', 'http://www.youtube.com/@sombrerostechamariateresac6050', 3 FROM establishments WHERE slug = 'sombreros-techa';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'nequi' WHERE e.slug = 'sombreros-techa';

-- EST-18 · Aroma Twins (coords g)
UPDATE establishments SET latitude = COALESCE(latitude, 7.917544), longitude = COALESCE(longitude, -72.789285), address = COALESCE(address, 'Mz 11, casa 9, Santa Rosa parte baja, vía al estadio'), phone = COALESCE(phone, '314 2468039'), whatsapp = COALESCE(whatsapp, '314 2468039'), hours_text = COALESCE(hours_text, '3:00 p. m.–8:00 p. m.'), price_text = COALESCE(price_text, 'Desde $10.000 (100 ml)') WHERE slug = 'aroma-twins';

INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'efectivo' WHERE e.slug = 'aroma-twins';

-- EST-019 · Bambú (coords i)
UPDATE establishments SET latitude = COALESCE(latitude, 7.9164), longitude = COALESCE(longitude, -72.7869), address = COALESCE(address, 'Mz 84, LT4, 2do piso'), phone = COALESCE(phone, '322 4644228'), whatsapp = COALESCE(whatsapp, '322 4644228'), hours_text = COALESCE(hours_text, 'Lun–dom, 6 p. m.–11 p. m.'), price_text = COALESCE(price_text, '$4.000 – $35.000') WHERE slug = 'bambu';

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'instagram', 'https://www.instagram.com/bambuterraza_col', 2 FROM establishments WHERE slug = 'bambu';
INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'website', 'https://linktr.ee/Bambuterrz', 2 FROM establishments WHERE slug = 'bambu';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'efectivo' WHERE e.slug = 'bambu';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'transferencia' WHERE e.slug = 'bambu';

-- EST-020 · Dulce Paseo (coords i)
UPDATE establishments SET latitude = COALESCE(latitude, 7.9157), longitude = COALESCE(longitude, -72.788), address = COALESCE(address, 'Mz 2, casa 11'), phone = COALESCE(phone, '320 7666774'), whatsapp = COALESCE(whatsapp, '320 7666774'), hours_text = COALESCE(hours_text, 'Mar–dom, 8 a. m.–8 p. m.'), price_text = COALESCE(price_text, 'Desde $3.000') WHERE slug = 'dulce-paseo';

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'facebook', 'https://facebook.com/share/p/1FdRvXhFqR', 1 FROM establishments WHERE slug = 'dulce-paseo';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'efectivo' WHERE e.slug = 'dulce-paseo';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'transferencia' WHERE e.slug = 'dulce-paseo';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'nequi' WHERE e.slug = 'dulce-paseo';

-- EST-021 · Doña Claudia (coords g)
UPDATE establishments SET latitude = COALESCE(latitude, 7.9134677), longitude = COALESCE(longitude, -72.7878309), address = COALESCE(address, 'Mz 6, casa 6A, Santa Rosa, La Grande'), phone = COALESCE(phone, '313 2204150'), whatsapp = COALESCE(whatsapp, '313 2204150'), hours_text = COALESCE(hours_text, 'Todos los días, 12:30 (almuerzos)'), price_text = COALESCE(price_text, 'Almuerzos $14.000') WHERE slug = 'dona-claudia';

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'facebook', 'https://facebook.com/share/1K7E8vCse6', 1 FROM establishments WHERE slug = 'dona-claudia';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'efectivo' WHERE e.slug = 'dona-claudia';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'nequi' WHERE e.slug = 'dona-claudia';

-- EST-022 · Fresas con Crema Carvajal S.A.S. (coords i)
UPDATE establishments SET latitude = COALESCE(latitude, 7.919), longitude = COALESCE(longitude, -72.786), address = COALESCE(address, 'Vereda Miraflores, entrada al pueblo nuevo'), phone = COALESCE(phone, '316 8000333'), whatsapp = COALESCE(whatsapp, '316 8000333'), hours_text = COALESCE(hours_text, 'Lun–vie 1–6 p. m. · Sáb./dom./fest. 8 a. m.–6 p. m.'), price_text = COALESCE(price_text, '$2.500 – $12.000') WHERE slug = 'fresas-con-crema-carvajal';

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'instagram', 'https://www.instagram.com/fresasconcremacarvajal/', 3 FROM establishments WHERE slug = 'fresas-con-crema-carvajal';
INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'facebook', 'https://www.facebook.com/FresasconCremaCarvajal', 3 FROM establishments WHERE slug = 'fresas-con-crema-carvajal';
INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'tiktok', 'https://www.tiktok.com/@FresasconCremaCarvajal', 3 FROM establishments WHERE slug = 'fresas-con-crema-carvajal';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'efectivo' WHERE e.slug = 'fresas-con-crema-carvajal';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'transferencia' WHERE e.slug = 'fresas-con-crema-carvajal';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'tarjeta' WHERE e.slug = 'fresas-con-crema-carvajal';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'nequi' WHERE e.slug = 'fresas-con-crema-carvajal';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'daviplata' WHERE e.slug = 'fresas-con-crema-carvajal';

-- EST-023 · La Comarca (coords i)
UPDATE establishments SET latitude = COALESCE(latitude, 7.9166), longitude = COALESCE(longitude, -72.7867), address = COALESCE(address, 'Mz 84, lote 3-2, Centro'), phone = COALESCE(phone, '321 4672694'), whatsapp = COALESCE(whatsapp, '321 4672694'), hours_text = COALESCE(hours_text, '10:00 a. m.–7:00 p. m.'), price_text = COALESCE(price_text, '$4.000 – $14.000') WHERE slug = 'la-comarca';

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'instagram', 'https://www.instagram.com/lacteoslacomarca', 1 FROM establishments WHERE slug = 'la-comarca';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'efectivo' WHERE e.slug = 'la-comarca';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'transferencia' WHERE e.slug = 'la-comarca';

-- EST-024 · La Sazón de la Tía (coords i)
UPDATE establishments SET latitude = COALESCE(latitude, 7.916), longitude = COALESCE(longitude, -72.7881), address = COALESCE(address, 'Manzana 1, casa 25, calle real'), phone = COALESCE(phone, '310 3020065'), phone_secondary = COALESCE(phone_secondary, '322 3217305'), whatsapp = COALESCE(whatsapp, '310 3020065'), hours_text = COALESCE(hours_text, 'Lun–dom, 7 a. m.–3 p. m.'), price_text = COALESCE(price_text, 'Desde $15.000') WHERE slug = 'la-sazon-de-la-tia';

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'instagram', 'https://www.instagram.com/la_tia_gramalote', 1 FROM establishments WHERE slug = 'la-sazon-de-la-tia';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'efectivo' WHERE e.slug = 'la-sazon-de-la-tia';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'transferencia' WHERE e.slug = 'la-sazon-de-la-tia';

-- EST-025 · Lonchería Romero (coords g)
INSERT INTO establishments
  (slug, name, category_id, type_id, zone_id, location_detail, summary, description,
   address, latitude, longitude, phone, phone_secondary, whatsapp, email, hours_text,
   checkin_text, price_text, is_published, sort_order, published_at)
SELECT 'loncheria-romero', 'Lonchería Romero', 1,
       (SELECT id FROM establishment_types WHERE category_id = 1 AND slug = 'restaurante'),
       1, NULL, 'Restaurante de tradición familiar, junto a uno de los molinos de viento representativos del municipio.', 'Restaurante de tradición familiar, junto a uno de los molinos de viento representativos del municipio. Ofrece: Pechuga milanesa $15.000, cachama frita $20.000.',
       'Mz 3, casa 5, Gramalote', '7.915291', '-72.786325', '313 8998219', NULL, '313 8998219', NULL, 'Mar–dom · desayunos 7–9 a. m. · almuerzos 11:30–2 p. m.',
       NULL, '15k, 20k', 1, 100, NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM establishments WHERE slug = 'loncheria-romero');

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'facebook', 'https://www.facebook.com/share/1DkFxZjrm9/', 1 FROM establishments WHERE slug = 'loncheria-romero';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'efectivo' WHERE e.slug = 'loncheria-romero';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'transferencia' WHERE e.slug = 'loncheria-romero';

-- EST-026 · Origen Cocina de Autor (coords g)
UPDATE establishments SET latitude = COALESCE(latitude, 7.9174536), longitude = COALESCE(longitude, -72.7904733), address = COALESCE(address, 'Manzana 18, lote 11, barrio Los Santos'), phone = COALESCE(phone, '316 0499467'), whatsapp = COALESCE(whatsapp, '316 0499467'), hours_text = COALESCE(hours_text, 'Mar–dom, 12–3 p. m. y 6–10 p. m.'), price_text = COALESCE(price_text, '20k a 40k') WHERE slug = 'origen-cocina-de-autor';

INSERT IGNORE INTO establishment_social_links (establishment_id, platform, url, sort_order)
  SELECT id, 'instagram', 'https://www.instagram.com/origencocinadeautor', 1 FROM establishments WHERE slug = 'origen-cocina-de-autor';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'nequi' WHERE e.slug = 'origen-cocina-de-autor';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'daviplata' WHERE e.slug = 'origen-cocina-de-autor';

-- EST-027 · El Sabor Gramalotero (coords i)
INSERT INTO establishments
  (slug, name, category_id, type_id, zone_id, location_detail, summary, description,
   address, latitude, longitude, phone, phone_secondary, whatsapp, email, hours_text,
   checkin_text, price_text, is_published, sort_order, published_at)
SELECT 'el-sabor-gramalotero', 'El Sabor Gramalotero', 1,
       (SELECT id FROM establishment_types WHERE category_id = 1 AND slug = 'restaurante'),
       1, NULL, 'Comidas rapidas y almuerzos, una mezca cultural entre costeña y gramalotera.', 'Comidas rapidas y almuerzos, una mezca cultural entre costeña y gramalotera. Ofrece: hamburguesas, papas, perros calientes, arepa burguer, otros.',
       'MZ 13 CASA 7 LOS SANTOS', '7.9172', '-72.7899', '311 5143719', NULL, '311 5143719', NULL, 'viernes a domingo de 5pm a 10pm',
       NULL, '25k a 216k', 0, 100, NULL
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM establishments WHERE slug = 'el-sabor-gramalotero');

INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'efectivo' WHERE e.slug = 'el-sabor-gramalotero';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id)
  SELECT e.id, m.id FROM establishments e JOIN payment_methods m ON m.slug = 'nequi' WHERE e.slug = 'el-sabor-gramalotero';

-- EST-028 · La Chiquitina (sin coordenadas)
INSERT INTO establishments
  (slug, name, category_id, type_id, zone_id, location_detail, summary, description,
   address, latitude, longitude, phone, phone_secondary, whatsapp, email, hours_text,
   checkin_text, price_text, is_published, sort_order, published_at)
SELECT 'la-chiquitina', 'La Chiquitina', 1,
       (SELECT id FROM establishment_types WHERE category_id = 1 AND slug = 'restaurante'),
       NULL, NULL, 'La Chiquitina: ficha pendiente de información.', 'Ficha pendiente de información: La Chiquitina.',
       NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
       NULL, NULL, 0, 100, NULL
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM establishments WHERE slug = 'la-chiquitina');


-- EST-029 · Restaurante El Gran Sazón (sin coordenadas)
INSERT INTO establishments
  (slug, name, category_id, type_id, zone_id, location_detail, summary, description,
   address, latitude, longitude, phone, phone_secondary, whatsapp, email, hours_text,
   checkin_text, price_text, is_published, sort_order, published_at)
SELECT 'restaurante-el-gran-sazon', 'Restaurante El Gran Sazón', 1,
       (SELECT id FROM establishment_types WHERE category_id = 1 AND slug = 'restaurante'),
       NULL, NULL, 'Restaurante El Gran Sazón: ficha pendiente de información.', 'Ficha pendiente de información: Restaurante El Gran Sazón.',
       NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
       NULL, NULL, 0, 100, NULL
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM establishments WHERE slug = 'restaurante-el-gran-sazon');


-- EST-030 · Coofe Garden (sin coordenadas)
INSERT INTO establishments
  (slug, name, category_id, type_id, zone_id, location_detail, summary, description,
   address, latitude, longitude, phone, phone_secondary, whatsapp, email, hours_text,
   checkin_text, price_text, is_published, sort_order, published_at)
SELECT 'coofe-garden', 'Coofe Garden', 1,
       (SELECT id FROM establishment_types WHERE category_id = 1 AND slug = 'cafeteria'),
       NULL, NULL, 'Coofe Garden: ficha pendiente de información.', 'Ficha pendiente de información: Coofe Garden.',
       NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
       NULL, NULL, 0, 100, NULL
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM establishments WHERE slug = 'coofe-garden');


-- Buscador: documentos de las fichas nuevas ------------------------------------
INSERT INTO search_documents (entity_type, entity_id, title, body, url, is_published)
SELECT 'establishment', e.id, e.name,
       CONCAT_WS(' ', e.summary, e.description, COALESCE(e.address, ''),
                 COALESCE(t.name, ''), COALESCE(z.name, '')),
       CONCAT('/establecimiento/', e.slug), e.is_published
FROM establishments e
LEFT JOIN establishment_types t ON t.id = e.type_id
LEFT JOIN zones z ON z.id = e.zone_id
WHERE e.deleted_at IS NULL
ON DUPLICATE KEY UPDATE
  title = VALUES(title), body = VALUES(body), url = VALUES(url),
  is_published = VALUES(is_published);
