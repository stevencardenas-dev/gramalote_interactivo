-- ============================================================================
-- 032 · Teléfono secundario fuera de la edición
--
-- El panel ya no edita el «teléfono secundario». Donde existía y el teléfono
-- principal repetía el número de WhatsApp, el principal pasa a ser el
-- secundario (así «Contacto» muestra un número distinto al de WhatsApp) y el
-- secundario se vacía para no repetir la misma línea en la ficha.
--
-- Las fichas con secundario que no cumplan la condición quedan intactas; hoy
-- no hay ninguna (Dona Claudia, La Sazón de la Tía y Verdeser son las únicas
-- con secundario y las tres repiten el WhatsApp en el principal).
-- ============================================================================

SET NAMES utf8mb4;

UPDATE establishments
SET phone = phone_secondary,
    phone_secondary = NULL
WHERE phone_secondary IS NOT NULL
  AND TRIM(phone_secondary) <> ''
  AND whatsapp IS NOT NULL
  AND TRIM(whatsapp) <> ''
  AND REGEXP_REPLACE(phone, '[^0-9]', '') <> ''
  AND REGEXP_REPLACE(phone, '[^0-9]', '') = REGEXP_REPLACE(whatsapp, '[^0-9]', '');
