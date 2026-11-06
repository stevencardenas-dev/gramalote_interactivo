-- ============================================================================
-- 012 · Enlaces de Google Maps de los establecimientos
--
-- Buscados en Google Maps por nombre (2026-11-03) y verificados contra la
-- ubicación de cada ficha. Quedan sin enlace ArteLu (Maps lo ubica en el
-- pueblo viejo, no en Los Santos) y Mi Gordita Bella (no aparece). No pisa
-- enlaces ya puestos desde el panel.
-- ============================================================================

SET NAMES utf8mb4;

UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/Bamb%C3%BA/data=!4m6!3m5!1s0x8e67b30051cc8b8d:0xcd81870feaf0aef0!8m2!3d7.9156393!4d-72.7884847' WHERE slug = 'bambu' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/Dulce+Paseo/data=!4m6!3m5!1s0x8e67b300442a9017:0xb003672dee9fbb17!8m2!3d7.9154512!4d-72.7859896' WHERE slug = 'dulce-paseo' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/Restaurante+Do%C3%B1a+Claudia/data=!4m6!3m5!1s0x8e67b30076163fdb:0x68539df75d77cd65!8m2!3d7.9134948!4d-72.7878178' WHERE slug = 'dona-claudia' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/Fresas+Con+Crema+Carvajal/data=!4m6!3m5!1s0x8e67b3ffc1e79457:0x8acbad5761a0bfd6!8m2!3d7.9141104!4d-72.7918227' WHERE slug = 'fresas-con-crema-carvajal' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/L%C3%A1cteos+La+Comarca/data=!4m6!3m5!1s0x8e67b358a32399d9:0x7e46d3fa161bbce4!8m2!3d7.9158217!4d-72.7877246' WHERE slug = 'la-comarca' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/Restaurante+la+Saz%C3%B3n+de+la+T%C3%ADa/data=!4m6!3m5!1s0x8e67b3ac4bcd7045:0x4cc0e1143fcdf3f9!8m2!3d7.9160897!4d-72.7849374' WHERE slug = 'la-sazon-de-la-tia' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/Restaurante+ORIGEN+cocina+de+autor/data=!4m6!3m5!1s0x8e67b31974530643:0x1fb6686415743d1!8m2!3d7.9174536!4d-72.7878984' WHERE slug = 'origen-cocina-de-autor' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/Vista+Antigua/data=!4m6!3m5!1s0x8e67b3bc90f0f0bb:0xdaa6ed0ccfa52d40!8m2!3d7.9022763!4d-72.7867096' WHERE slug = 'glamping-vista-antigua' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/Verdeserglamping/data=!4m6!3m5!1s0x8e67b347fca858d1:0x7bc160e1cb124c3c!8m2!3d7.9224981!4d-72.7912941' WHERE slug = 'verdeser-glampings' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/Hostal+Camino+Real+Gramalote/data=!4m6!3m5!1s0x8e67b30397270887:0xff99eb04664999e0!8m2!3d7.9132202!4d-72.784504' WHERE slug = 'hostal-campestre-camino-real' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/Hostal+luna+azul/data=!4m6!3m5!1s0x8e67b39d3253b425:0xe8ccf44513d86829!8m2!3d7.9135814!4d-72.7880009' WHERE slug = 'hostal-luna-azul' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/Casa+Hiedra+Hotel+Boutique/data=!4m6!3m5!1s0x8e67b38e97617333:0xdc7e9cac560e54bc!8m2!3d7.9187012!4d-72.785736' WHERE slug = 'casa-hiedra-hotel-boutique' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/El+pe%C3%B1on+de+gramalote/data=!4m6!3m5!1s0x8e67b31805a74b03:0x59b1b191903d1c82!8m2!3d7.8676839!4d-72.7786094' WHERE slug = 'cabanas-el-penon' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/ChelinArte+Gramalote/data=!4m6!3m5!1s0x8e67b30057ff22e5:0xb9e775f143470379!8m2!3d7.9150965!4d-72.7866122' WHERE slug = 'chelinarte' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/AROMA+Twins/data=!4m6!3m5!1s0x8e67b3000913f17d:0xa956713e860f6ee3!8m2!3d7.9173832!4d-72.7895344' WHERE slug = 'aroma-twins' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/Creaciones+Martina/data=!4m6!3m5!1s0x8e67b3605d6f161b:0x8533d1f6a7c60d3a!8m2!3d7.8711407!4d-72.8014275' WHERE slug = 'creaciones-martina' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/Artesan%C3%ADa+mi+hermoso+ed%C3%A9n/data=!4m6!3m5!1s0x8e67b300479c84cd:0x295ae7e205f572f!8m2!3d7.8878061!4d-72.7977203' WHERE slug = 'mi-hermoso-eden' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/Maestros+de+la+madera+Gramalote/data=!4m6!3m5!1s0x8e67b30065df2d55:0xe85b7b75cda4a653!8m2!3d7.9153024!4d-72.7868328' WHERE slug = 'maestros-de-la-madera' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/Bisuteria+MG/data=!4m6!3m5!1s0x8e67b30066653ad5:0xb6d5afb320d292db!8m2!3d7.923195!4d-72.7912964' WHERE slug = 'bisuteria-mg' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/Caliope%C2%B4s+Pots/data=!4m6!3m5!1s0x8e67b18b284ca5a9:0x13b17c11304dda01!8m2!3d7.9083818!4d-72.830035' WHERE slug = 'caliopes' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/SABOR+GRAMALOTERO/data=!4m6!3m5!1s0x8e67b3b02a8559f9:0x63627aa25b8d3244!8m2!3d7.9175776!4d-72.7883947' WHERE slug = 'el-sabor-gramalotero' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/Loncheria+Romero/data=!4m6!3m5!1s0x8e67b347a1c2bff7:0xca382db95e88574f!8m2!3d7.9152952!4d-72.7863224' WHERE slug = 'loncheria-romero' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/Sombreros+Techa-+artesanias/data=!4m6!3m5!1s0x8e67b30070c480dd:0xb47bae50bbefbb8c!8m2!3d7.916153!4d-72.7849872' WHERE slug = 'sombreros-techa' AND maps_url IS NULL;
UPDATE establishments SET maps_url = 'https://www.google.com/maps/place/YAWART/data=!4m6!3m5!1s0x8e67b30079227703:0x2d6189f5364116d9!8m2!3d7.9195026!4d-72.7847273' WHERE slug = 'yawart' AND maps_url IS NULL;
