-- ============================================================================
-- Gramalote Interactivo — datos de referencia
-- Ejecutar después de schema.sql.
-- No incluye el inventario completo: establecimientos, experiencias y
-- curiosidades se migran desde frontend/src/data o desde el panel admin.
-- ============================================================================

USE gramalote;
SET NAMES utf8mb4;

-- Zonas ---------------------------------------------------------------------
INSERT INTO zones (id, slug, name, color, sort_order) VALUES
  (1, 'nuevo', 'Gramalote Nuevo', '#486284', 1),
  (2, 'viejo', 'Gramalote Viejo', '#8ca2c0', 2);

-- Categorías ----------------------------------------------------------------
INSERT INTO establishment_categories (id, slug, name, sort_order) VALUES
  (1, 'comer', 'Dónde comer', 1),
  (2, 'dormir', 'Dónde dormir', 2),
  (3, 'comprar', 'Dónde comprar', 3);

-- Tipos y grupos de filtro --------------------------------------------------
INSERT INTO establishment_types (id, category_id, slug, name, filter_group, sort_order) VALUES
  (1, 1, 'comidas-rapidas', 'Comidas rápidas', 'Restaurantes', 1),
  (2, 1, 'cafeteria', 'Cafetería', 'Cafeterías', 2),
  (3, 1, 'comida-casera', 'Comida casera', 'Comida típica', 3),
  (4, 1, 'postres', 'Postres', 'Postres', 4),
  (5, 1, 'heladeria', 'Heladería', 'Postres', 5),
  (6, 1, 'comida-tipica', 'Comida típica', 'Comida típica', 6),
  (7, 1, 'cocina-de-autor', 'Cocina de autor', 'Restaurantes', 7),
  (8, 2, 'glamping', 'Glamping', 'Glamping', 1),
  (9, 2, 'hostal-campestre', 'Hostal campestre', 'Hostal', 2),
  (10, 2, 'hostal', 'Hostal', 'Hostal', 3),
  (11, 2, 'hotel-boutique', 'Hotel boutique', 'Hotel', 4),
  (12, 2, 'cabanas', 'Cabañas', 'Cabañas', 5),
  (13, 3, 'tejidos-accesorios', 'Tejidos y accesorios', 'Tejidos', 1),
  (14, 3, 'perfumeria-artesanal', 'Perfumería artesanal', 'Perfumería', 2),
  (15, 3, 'regalos-manualidades', 'Regalos y manualidades', 'Regalos', 3),
  (16, 3, 'decoracion-hogar', 'Decoración para el hogar', 'Decoración', 4),
  (17, 3, 'artesanias-madera', 'Artesanías en madera', 'Decoración', 5),
  (18, 3, 'detalles-accesorios', 'Detalles y accesorios artesanales', 'Regalos', 6);

-- Servicios -----------------------------------------------------------------
INSERT INTO services (id, slug, name, icon, sort_order) VALUES
  (1, 'desayuno', 'Desayuno', 'info', 1),
  (2, 'parqueadero', 'Parqueadero', 'car', 2),
  (3, 'piscina', 'Piscina', NULL, 3),
  (4, 'wifi', 'Wi-Fi', NULL, 4),
  (5, 'agua-caliente', 'Agua caliente', NULL, 5),
  (6, 'television', 'Televisión', NULL, 6),
  (7, 'salon-social', 'Salón social', 'user', 7),
  (8, 'zonas-verdes', 'Zonas verdes', NULL, 8),
  (9, 'area-fogatas', 'Área de fogatas', NULL, 9),
  (10, 'domicilios', 'Domicilios', 'phone', 10),
  (11, 'mirador', 'Mirador', 'pin', 11);

-- Medios de pago ------------------------------------------------------------
INSERT INTO payment_methods (id, slug, name, sort_order) VALUES
  (1, 'efectivo', 'Efectivo', 1),
  (2, 'transferencia', 'Transferencias', 2),
  (3, 'tarjeta', 'Tarjeta', 3),
  (4, 'nequi', 'Nequi', 4),
  (5, 'daviplata', 'Daviplata', 5);

-- Categorías de experiencias ------------------------------------------------
INSERT INTO experience_categories (id, slug, name, sort_order) VALUES
  (1, 'naturaleza', 'Naturaleza', 1),
  (2, 'gastronomia', 'Gastronomía', 2),
  (3, 'cultura', 'Cultura', 3),
  (4, 'parque', 'Parque', 4),
  (5, 'por-definir', 'Por definir', 5);

-- Hub de curiosidades -------------------------------------------------------
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
   'Explorar naturaleza', 4, 1);

-- Navegación ----------------------------------------------------------------
INSERT INTO navigation_items (id, location, label, path, sort_order, is_external, is_published) VALUES
  (1, 'header', 'Inicio', '/', 1, 0, 1),
  (2, 'header', 'Qué hacer', '/que-hacer', 2, 0, 1),
  (3, 'header', 'Dónde ir', '/donde-ir', 3, 0, 1),
  (4, 'header', 'Su historia', '/historia', 4, 0, 1),
  (5, 'explore', 'Curiosidades', '/curiosidades', 1, 0, 1),
  (6, 'explore', 'Información práctica', '/informacion-practica', 2, 0, 1),
  (7, 'footer', 'Inicio', '/', 1, 0, 1),
  (8, 'footer', 'Nuestra historia', '/historia', 2, 0, 1),
  (9, 'footer', 'Información práctica', '/informacion-practica', 3, 0, 1),
  (10, 'footer', 'Curiosidades', '/curiosidades', 4, 0, 1),
  (11, 'footer', 'Contactos útiles', '/informacion-practica#contactos', 5, 0, 1),
  (12, 'quick', 'Qué hacer', '/que-hacer', 1, 0, 1),
  (13, 'quick', 'Dónde comer', '/donde-comer', 2, 0, 1),
  (14, 'quick', 'Dónde dormir', '/donde-dormir', 3, 0, 1),
  (15, 'quick', 'Su historia', '/historia', 4, 0, 1),
  (16, 'quick', 'Dónde comprar', '/donde-comprar', 5, 0, 1);

-- Configuración del sitio ---------------------------------------------------
INSERT INTO site_settings (setting_key, setting_value, description) VALUES
  ('site.name', JSON_OBJECT('value', 'Gramalote Interactivo'), 'Nombre del sitio'),
  ('site.place', JSON_OBJECT('value', 'Gramalote · Norte de Santander'), 'Lugar que se muestra en el footer'),
  ('site.social', JSON_ARRAY(
      JSON_OBJECT('label', 'Instagram', 'icon', 'instagram', 'href', 'https://www.instagram.com/'),
      JSON_OBJECT('label', 'Facebook', 'icon', 'facebook', 'href', 'https://www.facebook.com/'),
      JSON_OBJECT('label', 'YouTube', 'icon', 'youtube', 'href', 'https://www.youtube.com/')
    ), 'Redes sociales del footer'),
  ('practical.cta', JSON_OBJECT('label', 'Información práctica', 'path', '/informacion-practica'), 'CTA del footer');

-- Administrador -------------------------------------------------------------
-- No se siembra una contraseña. Crear el primer usuario con un hash real:
--
-- INSERT INTO admin_users (name, email, password_hash, role)
-- VALUES ('Administrador', 'admin@gramalote.example',
--         '$argon2id$v=19$m=65536,t=3,p=4$...', 'admin');
--
-- El hash debe generarse con Argon2id o bcrypt desde el backend, nunca a mano.
