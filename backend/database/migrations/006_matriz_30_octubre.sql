-- ============================================================================
-- 006 · Sincroniza las fichas con la Matriz de establecimientos del 30 de octubre
--
-- La Matriz es la fuente de verdad: dirección, horario, precios, check-in,
-- métodos de pago y redes se reemplazan por lo que dice la Matriz. El horario
-- estructurado (el que alimenta "Abierto hoy") solo se carga cuando la Matriz
-- da días y horas; si solo da horas, se borra el estructurado y queda el texto.
-- No se tocan fotos, descripciones, coordenadas, tipo ni zona.
-- Se agregan Origen Cocina de Autor (publicada) y El Sabor Gramalotero (sin
-- publicar: la Matriz la marca pendiente de la Alcaldía).
-- ============================================================================

SET NAMES utf8mb4;

INSERT IGNORE INTO payment_methods (slug, name, sort_order) VALUES
  ('llave', 'Llave', 6), ('bre-b', 'Bre-B', 7), ('consignacion', 'Consignación', 8);

-- EST-01 · Glamping Vista Antigua
UPDATE establishments SET address = 'Vda. Valderrama, finca Poquitos, km 2, vía Gramalote–Cúcuta', hours_text = 'De lunes a lunes', price_text = '$150.000 – $250.000', price_min_cop = NULL, price_max_cop = NULL, checkin_text = '2–3 p. m. / 12–1 p. m.' WHERE slug = 'glamping-vista-antigua';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'glamping-vista-antigua');
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'glamping-vista-antigua');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'efectivo' WHERE e.slug = 'glamping-vista-antigua';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'transferencia' WHERE e.slug = 'glamping-vista-antigua';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'tarjeta' WHERE e.slug = 'glamping-vista-antigua';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'nequi' WHERE e.slug = 'glamping-vista-antigua';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'daviplata' WHERE e.slug = 'glamping-vista-antigua';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'instagram', 'https://www.instagram.com/glampingvistaantigua', 1 FROM establishments WHERE slug = 'glamping-vista-antigua' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-02 · Verdeser Glampings
UPDATE establishments SET address = 'W6C5+XF Gramalote · vereda Miraflores, finca Gratamira', hours_text = 'De lunes a domingo', price_text = '$200.000 – $500.000', price_min_cop = NULL, price_max_cop = NULL, checkin_text = '4:00 p. m. / 1:00 p. m.' WHERE slug = 'verdeser-glampings';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'verdeser-glampings');
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'verdeser-glampings');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'efectivo' WHERE e.slug = 'verdeser-glampings';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'transferencia' WHERE e.slug = 'verdeser-glampings';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'nequi' WHERE e.slug = 'verdeser-glampings';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'llave' WHERE e.slug = 'verdeser-glampings';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'instagram', 'https://www.instagram.com/verdeserglamping', 1 FROM establishments WHERE slug = 'verdeser-glampings' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-03 · Hostal Campestre Camino Real
UPDATE establishments SET address = 'Finca Cristalito, vereda Miraflores', hours_text = 'De lunes a domingo', price_text = 'Desde $30.000 por persona', price_min_cop = NULL, price_max_cop = NULL, checkin_text = '2:00 p. m. / 12:00 p. m.' WHERE slug = 'hostal-campestre-camino-real';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'hostal-campestre-camino-real');
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'hostal-campestre-camino-real');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'efectivo' WHERE e.slug = 'hostal-campestre-camino-real';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'transferencia' WHERE e.slug = 'hostal-campestre-camino-real';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'tarjeta' WHERE e.slug = 'hostal-campestre-camino-real';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'instagram', 'https://www.instagram.com/hostal.caminoreal', 1 FROM establishments WHERE slug = 'hostal-campestre-camino-real' ON DUPLICATE KEY UPDATE url = VALUES(url);
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'facebook', 'https://m.facebook.com/caminorealnuevogramalote/', 2 FROM establishments WHERE slug = 'hostal-campestre-camino-real' ON DUPLICATE KEY UPDATE url = VALUES(url);
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'tiktok', 'https://www.tiktok.com/@hostalcaminoreal', 3 FROM establishments WHERE slug = 'hostal-campestre-camino-real' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-04 · Hostal Luna Azul
UPDATE establishments SET address = 'Mz 4, casa 15, Santa Rosa La Grande', hours_text = 'De lunes a domingo de 6am a 9pm', price_text = '$30.000 por persona', price_min_cop = NULL, price_max_cop = NULL, checkin_text = '3:00 p. m. / 1:00 p. m.' WHERE slug = 'hostal-luna-azul';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'hostal-luna-azul');
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'hostal-luna-azul');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'efectivo' WHERE e.slug = 'hostal-luna-azul';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'transferencia' WHERE e.slug = 'hostal-luna-azul';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'nequi' WHERE e.slug = 'hostal-luna-azul';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'llave' WHERE e.slug = 'hostal-luna-azul';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'instagram', 'https://www.instagram.com/p/DFjLtSRSC2J/', 1 FROM establishments WHERE slug = 'hostal-luna-azul' ON DUPLICATE KEY UPDATE url = VALUES(url);
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'facebook', 'https://www.facebook.com/people/Hostal-luna-azul/100054245510564/', 2 FROM establishments WHERE slug = 'hostal-luna-azul' ON DUPLICATE KEY UPDATE url = VALUES(url);
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'tiktok', 'https://www.tiktok.com/@hostallunaazul0', 3 FROM establishments WHERE slug = 'hostal-luna-azul' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-05 · Casa Hiedra Hotel Boutique
UPDATE establishments SET address = 'Mz 40, lote 6, barrio Santa Anita', hours_text = 'De lunes a domingo de 6am a 10pm', price_text = '$100.000 – $290.000', price_min_cop = NULL, price_max_cop = NULL, checkin_text = '2:00 p. m. / 12:00 p. m. (día sig.)' WHERE slug = 'casa-hiedra-hotel-boutique';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'casa-hiedra-hotel-boutique');
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'casa-hiedra-hotel-boutique');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'efectivo' WHERE e.slug = 'casa-hiedra-hotel-boutique';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'transferencia' WHERE e.slug = 'casa-hiedra-hotel-boutique';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'nequi' WHERE e.slug = 'casa-hiedra-hotel-boutique';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'daviplata' WHERE e.slug = 'casa-hiedra-hotel-boutique';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'bre-b' WHERE e.slug = 'casa-hiedra-hotel-boutique';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'instagram', 'https://www.instagram.com/casahiedrahotelboutique', 1 FROM establishments WHERE slug = 'casa-hiedra-hotel-boutique' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-06 · Cabañas El Peñón
UPDATE establishments SET address = 'Vereda Valderrama, salida a Cúcuta', hours_text = 'Horario de atención 24/7', price_text = 'Pareja $80.000 · familiar $35.000/persona', price_min_cop = NULL, price_max_cop = NULL, checkin_text = '2:00 p. m. / 2:00 p. m. (día sig.) · 24/7' WHERE slug = 'cabanas-el-penon';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'cabanas-el-penon');
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'cabanas-el-penon');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'transferencia' WHERE e.slug = 'cabanas-el-penon';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'nequi' WHERE e.slug = 'cabanas-el-penon';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'daviplata' WHERE e.slug = 'cabanas-el-penon';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'instagram', 'https://www.instagram.com/el_penon13', 1 FROM establishments WHERE slug = 'cabanas-el-penon' ON DUPLICATE KEY UPDATE url = VALUES(url);
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'facebook', 'https://www.facebook.com/profile.php?id=100092449005644', 2 FROM establishments WHERE slug = 'cabanas-el-penon' ON DUPLICATE KEY UPDATE url = VALUES(url);
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'tiktok', 'https://www.tiktok.com/@cabanaselpenon78', 3 FROM establishments WHERE slug = 'cabanas-el-penon' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-08 · Chelinarte
UPDATE establishments SET address = 'Parque principal, frente al súper La Morrocota (carpa blanca)', hours_text = 'Sáb., dom. y festivos, 9 a. m.–6 p. m.', price_text = 'Llaveros $2.000–$20.000 · Tejidos $10.000–$240.000', price_min_cop = NULL, price_max_cop = NULL WHERE slug = 'chelinarte';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'chelinarte');
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'chelinarte' AND oh.day_of_week = 6);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 6, '09:00:00', '18:00:00', @so FROM establishments WHERE slug = 'chelinarte';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'chelinarte' AND oh.day_of_week = 7);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 7, '09:00:00', '18:00:00', @so FROM establishments WHERE slug = 'chelinarte';
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'chelinarte');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'efectivo' WHERE e.slug = 'chelinarte';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'transferencia' WHERE e.slug = 'chelinarte';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'facebook', 'https://facebook.com/profile.php?id=61587321850818', 1 FROM establishments WHERE slug = 'chelinarte' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-09 · Creaciones Martina
UPDATE establishments SET address = 'Finca San Luis', hours_text = 'Lun–vie 8 a. m.–6 p. m. · Sáb. 8 a. m.–12 m.', price_text = '$5.000 – $150.000 según producto', price_min_cop = NULL, price_max_cop = NULL WHERE slug = 'creaciones-martina';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'creaciones-martina');
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'creaciones-martina' AND oh.day_of_week = 1);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 1, '08:00:00', '18:00:00', @so FROM establishments WHERE slug = 'creaciones-martina';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'creaciones-martina' AND oh.day_of_week = 2);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 2, '08:00:00', '18:00:00', @so FROM establishments WHERE slug = 'creaciones-martina';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'creaciones-martina' AND oh.day_of_week = 3);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 3, '08:00:00', '18:00:00', @so FROM establishments WHERE slug = 'creaciones-martina';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'creaciones-martina' AND oh.day_of_week = 4);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 4, '08:00:00', '18:00:00', @so FROM establishments WHERE slug = 'creaciones-martina';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'creaciones-martina' AND oh.day_of_week = 5);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 5, '08:00:00', '18:00:00', @so FROM establishments WHERE slug = 'creaciones-martina';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'creaciones-martina' AND oh.day_of_week = 6);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 6, '08:00:00', '12:00:00', @so FROM establishments WHERE slug = 'creaciones-martina';
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'creaciones-martina');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'efectivo' WHERE e.slug = 'creaciones-martina';
UPDATE establishments SET email = 'creacionesmartina31@gmail.com' WHERE slug = 'creaciones-martina';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'instagram', 'https://www.instagram.com/creaciones_martina31', 1 FROM establishments WHERE slug = 'creaciones-martina' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-10 · ArteLu
UPDATE establishments SET address = 'Los Santos', hours_text = '7:00 a. m.–7:00 p. m.', price_text = 'Desde $22.000', price_min_cop = NULL, price_max_cop = NULL WHERE slug = 'artelu';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'artelu');
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'artelu');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'efectivo' WHERE e.slug = 'artelu';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'consignacion' WHERE e.slug = 'artelu';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'instagram', 'https://www.instagram.com/artelu_03', 1 FROM establishments WHERE slug = 'artelu' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-11 · Mi Hermoso Edén
UPDATE establishments SET address = 'Vía Santuario, Gramalote', hours_text = '6:00 a. m.–7:00 p. m.', price_text = '$3.000 – $50.000', price_min_cop = NULL, price_max_cop = NULL WHERE slug = 'mi-hermoso-eden';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'mi-hermoso-eden');
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'mi-hermoso-eden');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'nequi' WHERE e.slug = 'mi-hermoso-eden';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'facebook', 'https://www.facebook.com/profile.php?id=61572464730760&sfnsn=scwspmo&mibextid=RUbZ1f', 1 FROM establishments WHERE slug = 'mi-hermoso-eden' ON DUPLICATE KEY UPDATE url = VALUES(url);
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'tiktok', 'https://tiktok.com/@indrid.detall.gme', 2 FROM establishments WHERE slug = 'mi-hermoso-eden' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-12 · Maestros de la Madera
UPDATE establishments SET address = 'Plaza principal de nuevo Gramalote', hours_text = 'Dom. y festivos, 9 a. m.–6 p. m.', price_text = 'Desde $5.000', price_min_cop = NULL, price_max_cop = NULL WHERE slug = 'maestros-de-la-madera';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'maestros-de-la-madera');
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'maestros-de-la-madera' AND oh.day_of_week = 7);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 7, '09:00:00', '18:00:00', @so FROM establishments WHERE slug = 'maestros-de-la-madera';
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'maestros-de-la-madera');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'efectivo' WHERE e.slug = 'maestros-de-la-madera';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'nequi' WHERE e.slug = 'maestros-de-la-madera';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'facebook', 'https://www.facebook.com/arnaldo.saravia.31', 1 FROM establishments WHERE slug = 'maestros-de-la-madera' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-13 · Mi Gordita Bella
UPDATE establishments SET address = 'Vía a Villa Caro, Loma de Valduz', hours_text = '6:00 a. m.–7:00 p. m.', price_text = '$2.000 – $15.000', price_min_cop = NULL, price_max_cop = NULL WHERE slug = 'mi-gordita-bella';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'mi-gordita-bella');
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'mi-gordita-bella');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'efectivo' WHERE e.slug = 'mi-gordita-bella';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'nequi' WHERE e.slug = 'mi-gordita-bella';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'facebook', 'https://www.facebook.com/share/1DrZRo6P41/', 1 FROM establishments WHERE slug = 'mi-gordita-bella' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-14 · Yawart
UPDATE establishments SET address = 'Manzana 46-23A', hours_text = '6:00 a. m.–7:00 p. m.', price_text = 'Cojines $100.000', price_min_cop = NULL, price_max_cop = NULL WHERE slug = 'yawart';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'yawart');
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'yawart');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'efectivo' WHERE e.slug = 'yawart';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'nequi' WHERE e.slug = 'yawart';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'facebook', 'https://facebook.com/share/p/1Di55fLiNj', 1 FROM establishments WHERE slug = 'yawart' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-15 · Caliopes
UPDATE establishments SET address = 'Vereda Villanueva', hours_text = '6:00 a. m.–7:00 p. m.', price_text = 'Llaveros $8.000 – $15.000', price_min_cop = NULL, price_max_cop = NULL WHERE slug = 'caliopes';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'caliopes');
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'caliopes');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'efectivo' WHERE e.slug = 'caliopes';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'nequi' WHERE e.slug = 'caliopes';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'instagram', 'https://www.instagram.com/caliopes_pots', 1 FROM establishments WHERE slug = 'caliopes' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-16 · Bisutería MG
UPDATE establishments SET address = 'Vereda Miraflores, finca Las Margaritas', hours_text = '6:00 a. m.–7:00 p. m.', price_text = 'La teja $40.000', price_min_cop = NULL, price_max_cop = NULL WHERE slug = 'bisuteria-mg';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'bisuteria-mg');
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'bisuteria-mg');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'efectivo' WHERE e.slug = 'bisuteria-mg';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'nequi' WHERE e.slug = 'bisuteria-mg';

-- EST-17 · Sombreros TECHA
UPDATE establishments SET address = 'MZ1 Casa Calle Real', hours_text = '10 mañana a 2 tarde lunes a viernes 10a 4tarde tarde sábados y domingos', price_text = '$35.000 – $700.000', price_min_cop = NULL, price_max_cop = NULL WHERE slug = 'sombreros-techa';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'sombreros-techa');
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'sombreros-techa' AND oh.day_of_week = 1);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 1, '10:00:00', '14:00:00', @so FROM establishments WHERE slug = 'sombreros-techa';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'sombreros-techa' AND oh.day_of_week = 2);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 2, '10:00:00', '14:00:00', @so FROM establishments WHERE slug = 'sombreros-techa';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'sombreros-techa' AND oh.day_of_week = 3);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 3, '10:00:00', '14:00:00', @so FROM establishments WHERE slug = 'sombreros-techa';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'sombreros-techa' AND oh.day_of_week = 4);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 4, '10:00:00', '14:00:00', @so FROM establishments WHERE slug = 'sombreros-techa';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'sombreros-techa' AND oh.day_of_week = 5);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 5, '10:00:00', '14:00:00', @so FROM establishments WHERE slug = 'sombreros-techa';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'sombreros-techa' AND oh.day_of_week = 6);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 6, '10:00:00', '16:00:00', @so FROM establishments WHERE slug = 'sombreros-techa';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'sombreros-techa' AND oh.day_of_week = 7);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 7, '10:00:00', '16:00:00', @so FROM establishments WHERE slug = 'sombreros-techa';
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'sombreros-techa');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'nequi' WHERE e.slug = 'sombreros-techa';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'instagram', 'https://www.instagram.com/sombrerostecha', 1 FROM establishments WHERE slug = 'sombreros-techa' ON DUPLICATE KEY UPDATE url = VALUES(url);
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'facebook', 'https://www.facebook.com/share/1C24QxtxA7/', 2 FROM establishments WHERE slug = 'sombreros-techa' ON DUPLICATE KEY UPDATE url = VALUES(url);
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'youtube', 'http://www.youtube.com/@sombrerostechamariateresac6050', 3 FROM establishments WHERE slug = 'sombreros-techa' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-18 · Aroma Twins
UPDATE establishments SET address = 'Mz 11, casa 9, Santa Rosa parte baja, vía al estadio', hours_text = '3:00 p. m.–8:00 p. m.', price_text = 'Desde $10.000 (100 ml)', price_min_cop = NULL, price_max_cop = NULL WHERE slug = 'aroma-twins';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'aroma-twins');
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'aroma-twins');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'efectivo' WHERE e.slug = 'aroma-twins';

-- EST-019 · Bambú
UPDATE establishments SET address = 'Mz 84, LT4, 2do piso', hours_text = 'Lun–dom, 6 p. m.–11 p. m.', price_text = '$4.000 – $35.000', price_min_cop = NULL, price_max_cop = NULL WHERE slug = 'bambu';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'bambu');
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'bambu' AND oh.day_of_week = 1);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 1, '18:00:00', '23:00:00', @so FROM establishments WHERE slug = 'bambu';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'bambu' AND oh.day_of_week = 2);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 2, '18:00:00', '23:00:00', @so FROM establishments WHERE slug = 'bambu';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'bambu' AND oh.day_of_week = 3);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 3, '18:00:00', '23:00:00', @so FROM establishments WHERE slug = 'bambu';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'bambu' AND oh.day_of_week = 4);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 4, '18:00:00', '23:00:00', @so FROM establishments WHERE slug = 'bambu';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'bambu' AND oh.day_of_week = 5);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 5, '18:00:00', '23:00:00', @so FROM establishments WHERE slug = 'bambu';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'bambu' AND oh.day_of_week = 6);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 6, '18:00:00', '23:00:00', @so FROM establishments WHERE slug = 'bambu';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'bambu' AND oh.day_of_week = 7);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 7, '18:00:00', '23:00:00', @so FROM establishments WHERE slug = 'bambu';
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'bambu');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'efectivo' WHERE e.slug = 'bambu';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'transferencia' WHERE e.slug = 'bambu';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'instagram', 'https://www.instagram.com/bambuterraza_col', 1 FROM establishments WHERE slug = 'bambu' ON DUPLICATE KEY UPDATE url = VALUES(url);
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'website', 'https://linktr.ee/Bambuterrz', 2 FROM establishments WHERE slug = 'bambu' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-020 · Dulce Paseo
UPDATE establishments SET address = 'Mz 2, casa 11', hours_text = 'Mar–dom, 8 a. m.–8 p. m.', price_text = 'Desde $3.000', price_min_cop = NULL, price_max_cop = NULL WHERE slug = 'dulce-paseo';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'dulce-paseo');
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'dulce-paseo' AND oh.day_of_week = 2);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 2, '08:00:00', '20:00:00', @so FROM establishments WHERE slug = 'dulce-paseo';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'dulce-paseo' AND oh.day_of_week = 3);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 3, '08:00:00', '20:00:00', @so FROM establishments WHERE slug = 'dulce-paseo';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'dulce-paseo' AND oh.day_of_week = 4);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 4, '08:00:00', '20:00:00', @so FROM establishments WHERE slug = 'dulce-paseo';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'dulce-paseo' AND oh.day_of_week = 5);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 5, '08:00:00', '20:00:00', @so FROM establishments WHERE slug = 'dulce-paseo';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'dulce-paseo' AND oh.day_of_week = 6);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 6, '08:00:00', '20:00:00', @so FROM establishments WHERE slug = 'dulce-paseo';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'dulce-paseo' AND oh.day_of_week = 7);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 7, '08:00:00', '20:00:00', @so FROM establishments WHERE slug = 'dulce-paseo';
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'dulce-paseo');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'efectivo' WHERE e.slug = 'dulce-paseo';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'nequi' WHERE e.slug = 'dulce-paseo';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'llave' WHERE e.slug = 'dulce-paseo';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'facebook', 'https://facebook.com/share/p/1FdRvXhFqR', 1 FROM establishments WHERE slug = 'dulce-paseo' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-021 · Doña Claudia
UPDATE establishments SET address = 'Mz 6, casa 6A, Santa Rosa, La Grande', hours_text = 'Todos los días, 12:30 (almuerzos)', price_text = 'Almuerzos $14.000', price_min_cop = NULL, price_max_cop = NULL WHERE slug = 'dona-claudia';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'dona-claudia');
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'dona-claudia');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'efectivo' WHERE e.slug = 'dona-claudia';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'nequi' WHERE e.slug = 'dona-claudia';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'facebook', 'https://facebook.com/share/1K7E8vCse6', 1 FROM establishments WHERE slug = 'dona-claudia' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-022 · Fresas con Crema Carvajal S.A.S.
UPDATE establishments SET address = 'Vereda Miraflores, entrada al pueblo nuevo', hours_text = 'Lun–vie 1–6 p. m. · Sáb./dom./fest. 8 a. m.–6 p. m.', price_text = '$2.500 – $12.000', price_min_cop = NULL, price_max_cop = NULL WHERE slug = 'fresas-con-crema-carvajal';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'fresas-con-crema-carvajal');
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'fresas-con-crema-carvajal' AND oh.day_of_week = 1);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 1, '13:00:00', '18:00:00', @so FROM establishments WHERE slug = 'fresas-con-crema-carvajal';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'fresas-con-crema-carvajal' AND oh.day_of_week = 2);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 2, '13:00:00', '18:00:00', @so FROM establishments WHERE slug = 'fresas-con-crema-carvajal';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'fresas-con-crema-carvajal' AND oh.day_of_week = 3);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 3, '13:00:00', '18:00:00', @so FROM establishments WHERE slug = 'fresas-con-crema-carvajal';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'fresas-con-crema-carvajal' AND oh.day_of_week = 4);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 4, '13:00:00', '18:00:00', @so FROM establishments WHERE slug = 'fresas-con-crema-carvajal';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'fresas-con-crema-carvajal' AND oh.day_of_week = 5);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 5, '13:00:00', '18:00:00', @so FROM establishments WHERE slug = 'fresas-con-crema-carvajal';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'fresas-con-crema-carvajal' AND oh.day_of_week = 6);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 6, '08:00:00', '18:00:00', @so FROM establishments WHERE slug = 'fresas-con-crema-carvajal';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'fresas-con-crema-carvajal' AND oh.day_of_week = 7);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 7, '08:00:00', '18:00:00', @so FROM establishments WHERE slug = 'fresas-con-crema-carvajal';
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'fresas-con-crema-carvajal');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'efectivo' WHERE e.slug = 'fresas-con-crema-carvajal';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'transferencia' WHERE e.slug = 'fresas-con-crema-carvajal';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'tarjeta' WHERE e.slug = 'fresas-con-crema-carvajal';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'nequi' WHERE e.slug = 'fresas-con-crema-carvajal';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'daviplata' WHERE e.slug = 'fresas-con-crema-carvajal';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'instagram', 'https://www.instagram.com/fresasconcremacarvajal/', 1 FROM establishments WHERE slug = 'fresas-con-crema-carvajal' ON DUPLICATE KEY UPDATE url = VALUES(url);
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'facebook', 'https://www.facebook.com/FresasconCremaCarvajal', 2 FROM establishments WHERE slug = 'fresas-con-crema-carvajal' ON DUPLICATE KEY UPDATE url = VALUES(url);
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'tiktok', 'https://www.tiktok.com/@FresasconCremaCarvajal', 3 FROM establishments WHERE slug = 'fresas-con-crema-carvajal' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-023 · La Comarca
UPDATE establishments SET address = 'Mz 84, lote 3-2, Centro', hours_text = '10:00 a. m.–7:00 p. m.', price_text = '$4.000 – $14.000', price_min_cop = NULL, price_max_cop = NULL WHERE slug = 'la-comarca';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'la-comarca');
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'la-comarca');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'efectivo' WHERE e.slug = 'la-comarca';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'transferencia' WHERE e.slug = 'la-comarca';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'instagram', 'https://www.instagram.com/lacteoslacomarca', 1 FROM establishments WHERE slug = 'la-comarca' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-024 · La Sazón de la Tía
UPDATE establishments SET address = 'Manzana 1, casa 25, calle real', hours_text = 'Lun–dom, 7 a. m.–3 p. m.', price_text = 'Desde $15.000', price_min_cop = NULL, price_max_cop = NULL WHERE slug = 'la-sazon-de-la-tia';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'la-sazon-de-la-tia');
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'la-sazon-de-la-tia' AND oh.day_of_week = 1);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 1, '07:00:00', '15:00:00', @so FROM establishments WHERE slug = 'la-sazon-de-la-tia';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'la-sazon-de-la-tia' AND oh.day_of_week = 2);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 2, '07:00:00', '15:00:00', @so FROM establishments WHERE slug = 'la-sazon-de-la-tia';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'la-sazon-de-la-tia' AND oh.day_of_week = 3);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 3, '07:00:00', '15:00:00', @so FROM establishments WHERE slug = 'la-sazon-de-la-tia';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'la-sazon-de-la-tia' AND oh.day_of_week = 4);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 4, '07:00:00', '15:00:00', @so FROM establishments WHERE slug = 'la-sazon-de-la-tia';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'la-sazon-de-la-tia' AND oh.day_of_week = 5);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 5, '07:00:00', '15:00:00', @so FROM establishments WHERE slug = 'la-sazon-de-la-tia';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'la-sazon-de-la-tia' AND oh.day_of_week = 6);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 6, '07:00:00', '15:00:00', @so FROM establishments WHERE slug = 'la-sazon-de-la-tia';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'la-sazon-de-la-tia' AND oh.day_of_week = 7);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 7, '07:00:00', '15:00:00', @so FROM establishments WHERE slug = 'la-sazon-de-la-tia';
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'la-sazon-de-la-tia');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'efectivo' WHERE e.slug = 'la-sazon-de-la-tia';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'transferencia' WHERE e.slug = 'la-sazon-de-la-tia';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'instagram', 'https://www.instagram.com/la_tia_gramalote', 1 FROM establishments WHERE slug = 'la-sazon-de-la-tia' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-025 · Lonchería Romero
UPDATE establishments SET address = 'Mz 3, casa 5, Gramalote', hours_text = 'Mar–dom · desayunos 7–9 a. m. · almuerzos 11:30–2 p. m.', price_text = '$15.000 – $20.000', price_min_cop = NULL, price_max_cop = NULL WHERE slug = 'loncheria-romero';
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'loncheria-romero');
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'loncheria-romero' AND oh.day_of_week = 2);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 2, '07:00:00', '09:00:00', @so FROM establishments WHERE slug = 'loncheria-romero';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'loncheria-romero' AND oh.day_of_week = 3);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 3, '07:00:00', '09:00:00', @so FROM establishments WHERE slug = 'loncheria-romero';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'loncheria-romero' AND oh.day_of_week = 4);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 4, '07:00:00', '09:00:00', @so FROM establishments WHERE slug = 'loncheria-romero';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'loncheria-romero' AND oh.day_of_week = 5);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 5, '07:00:00', '09:00:00', @so FROM establishments WHERE slug = 'loncheria-romero';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'loncheria-romero' AND oh.day_of_week = 6);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 6, '07:00:00', '09:00:00', @so FROM establishments WHERE slug = 'loncheria-romero';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'loncheria-romero' AND oh.day_of_week = 7);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 7, '07:00:00', '09:00:00', @so FROM establishments WHERE slug = 'loncheria-romero';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'loncheria-romero' AND oh.day_of_week = 2);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 2, '11:30:00', '14:00:00', @so FROM establishments WHERE slug = 'loncheria-romero';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'loncheria-romero' AND oh.day_of_week = 3);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 3, '11:30:00', '14:00:00', @so FROM establishments WHERE slug = 'loncheria-romero';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'loncheria-romero' AND oh.day_of_week = 4);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 4, '11:30:00', '14:00:00', @so FROM establishments WHERE slug = 'loncheria-romero';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'loncheria-romero' AND oh.day_of_week = 5);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 5, '11:30:00', '14:00:00', @so FROM establishments WHERE slug = 'loncheria-romero';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'loncheria-romero' AND oh.day_of_week = 6);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 6, '11:30:00', '14:00:00', @so FROM establishments WHERE slug = 'loncheria-romero';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'loncheria-romero' AND oh.day_of_week = 7);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 7, '11:30:00', '14:00:00', @so FROM establishments WHERE slug = 'loncheria-romero';
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'loncheria-romero');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'efectivo' WHERE e.slug = 'loncheria-romero';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'consignacion' WHERE e.slug = 'loncheria-romero';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'facebook', 'https://www.facebook.com/share/1DkFxZjrm9/', 1 FROM establishments WHERE slug = 'loncheria-romero' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-026 · Origen Cocina de Autor
INSERT INTO establishments (slug, name, category_id, type_id, zone_id, summary, description, address, latitude, longitude, phone, whatsapp, hours_text, price_text, is_published, published_at) SELECT 'origen-cocina-de-autor', 'Origen Cocina de Autor', 1, (SELECT id FROM establishment_types WHERE category_id = 1 AND slug = 'restaurante'), (SELECT id FROM zones WHERE slug = 'nuevo'), 'comidas elaboradas y comidas rápidas', 'comidas elaboradas y comidas rápidas', 'Manzana 18, lote 11, barrio Los Santos', 7.9174536, -72.7878984, '316 0499467', '316 0499467', 'Mar–dom, 12–3 p. m. y 6–10 p. m.', '$20.000 – $40.000', 1, NOW() FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM establishments WHERE slug = 'origen-cocina-de-autor');
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'origen-cocina-de-autor');
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'origen-cocina-de-autor' AND oh.day_of_week = 2);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 2, '12:00:00', '15:00:00', @so FROM establishments WHERE slug = 'origen-cocina-de-autor';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'origen-cocina-de-autor' AND oh.day_of_week = 3);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 3, '12:00:00', '15:00:00', @so FROM establishments WHERE slug = 'origen-cocina-de-autor';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'origen-cocina-de-autor' AND oh.day_of_week = 4);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 4, '12:00:00', '15:00:00', @so FROM establishments WHERE slug = 'origen-cocina-de-autor';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'origen-cocina-de-autor' AND oh.day_of_week = 5);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 5, '12:00:00', '15:00:00', @so FROM establishments WHERE slug = 'origen-cocina-de-autor';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'origen-cocina-de-autor' AND oh.day_of_week = 6);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 6, '12:00:00', '15:00:00', @so FROM establishments WHERE slug = 'origen-cocina-de-autor';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'origen-cocina-de-autor' AND oh.day_of_week = 7);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 7, '12:00:00', '15:00:00', @so FROM establishments WHERE slug = 'origen-cocina-de-autor';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'origen-cocina-de-autor' AND oh.day_of_week = 2);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 2, '18:00:00', '22:00:00', @so FROM establishments WHERE slug = 'origen-cocina-de-autor';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'origen-cocina-de-autor' AND oh.day_of_week = 3);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 3, '18:00:00', '22:00:00', @so FROM establishments WHERE slug = 'origen-cocina-de-autor';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'origen-cocina-de-autor' AND oh.day_of_week = 4);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 4, '18:00:00', '22:00:00', @so FROM establishments WHERE slug = 'origen-cocina-de-autor';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'origen-cocina-de-autor' AND oh.day_of_week = 5);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 5, '18:00:00', '22:00:00', @so FROM establishments WHERE slug = 'origen-cocina-de-autor';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'origen-cocina-de-autor' AND oh.day_of_week = 6);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 6, '18:00:00', '22:00:00', @so FROM establishments WHERE slug = 'origen-cocina-de-autor';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'origen-cocina-de-autor' AND oh.day_of_week = 7);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 7, '18:00:00', '22:00:00', @so FROM establishments WHERE slug = 'origen-cocina-de-autor';
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'origen-cocina-de-autor');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'nequi' WHERE e.slug = 'origen-cocina-de-autor';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'daviplata' WHERE e.slug = 'origen-cocina-de-autor';
INSERT INTO establishment_social_links (establishment_id, platform, url, sort_order) SELECT id, 'instagram', 'https://www.instagram.com/origencocinadeautor', 1 FROM establishments WHERE slug = 'origen-cocina-de-autor' ON DUPLICATE KEY UPDATE url = VALUES(url);

-- EST-027 · El Sabor Gramalotero
INSERT INTO establishments (slug, name, category_id, type_id, zone_id, summary, description, address, latitude, longitude, phone, whatsapp, hours_text, price_text, is_published, published_at) SELECT 'el-sabor-gramalotero', 'El Sabor Gramalotero', 1, (SELECT id FROM establishment_types WHERE category_id = 1 AND slug = 'restaurante'), (SELECT id FROM zones WHERE slug = 'nuevo'), 'Comidas rapidas y almuerzos, una mezca cultural entre costeña y gramalotera', 'Comidas rapidas y almuerzos, una mezca cultural entre costeña y gramalotera', 'MZ 13 CASA 7 LOS SANTOS', NULL, NULL, '311 5143719', '311 5143719', 'Viernes a domingo de 5pm a 10pm', '$25.000 – $216.000', 0, NULL FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM establishments WHERE slug = 'el-sabor-gramalotero');
DELETE FROM opening_hours WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'el-sabor-gramalotero');
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'el-sabor-gramalotero' AND oh.day_of_week = 5);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 5, '17:00:00', '22:00:00', @so FROM establishments WHERE slug = 'el-sabor-gramalotero';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'el-sabor-gramalotero' AND oh.day_of_week = 6);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 6, '17:00:00', '22:00:00', @so FROM establishments WHERE slug = 'el-sabor-gramalotero';
SET @so = (SELECT COUNT(*) FROM opening_hours oh JOIN establishments e ON e.id = oh.establishment_id WHERE e.slug = 'el-sabor-gramalotero' AND oh.day_of_week = 7);
INSERT INTO opening_hours (establishment_id, day_of_week, opens_at, closes_at, sort_order) SELECT id, 7, '17:00:00', '22:00:00', @so FROM establishments WHERE slug = 'el-sabor-gramalotero';
DELETE FROM establishment_payments WHERE establishment_id = (SELECT id FROM establishments WHERE slug = 'el-sabor-gramalotero');
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'efectivo' WHERE e.slug = 'el-sabor-gramalotero';
INSERT IGNORE INTO establishment_payments (establishment_id, payment_method_id) SELECT e.id, pm.id FROM establishments e JOIN payment_methods pm ON pm.slug = 'nequi' WHERE e.slug = 'el-sabor-gramalotero';

-- Buscador: refresca los documentos con las direcciones nuevas -----------------
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
