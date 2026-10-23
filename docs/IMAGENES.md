# Inventario de imágenes: Drive vs. sitio

Revisión: **2026-10-22** · Fuente: carpeta de Drive
`Gramalote Interactivo — Entregas UX/UI a Sistemas`
(`18L14YaknB5cDndgg4ASD2_8vfc1BcZgR`, scope `drive.readonly`).

El árbol de Drive tiene **170 archivos**: 117 imágenes, 15 Google Docs, 1 Google
Sheet y 37 carpetas. De las imágenes, **11 son wireframes** y **106 son fotos**
repartidas en tres grupos: restaurantes, hospedajes y artesanías.

> Ninguna vista de Inicio, Qué hacer, Información práctica, Curiosidades,
> Historia o Funcionalidades tiene fotos en Drive: esas carpetas existen pero
> están vacías. Hoy el frontend usa `Placeholder` (patrón CSS) en todos los
> slots de imagen.

## 1. Fotos disponibles en Drive

Convención de nombres: `1`…`5` son fotos de galería; `Portada 1` y `Portada 2`
son las imágenes candidatas para tarjeta/hero.

### 1.1 Restaurantes — 24 fotos

Carpeta: [FOTOS RESTAURANTES](https://drive.google.com/drive/folders/1STE52uoZD59_Qvw6-_DkeguTomtzScML)

| Establecimiento | Fotos | Nombres | Slug en el código | Uso sugerido |
| --- | ---: | --- | --- | --- |
| BAMBU | 5 | `1`, `2`, `3`, `Portada 1`, `Portada 2` | `bambu` | Portada 1 en tarjeta; 1–3 + Portada 2 en ficha |
| Fresas con Crema Carvajal S.A.S. | 5 | `1.png`, `2.png`, `3.png`, `Portada 1`, `Portada 2` | `fresas-con-crema-carvajal` | Igual que BAMBU |
| La comarca | 5 | `1`, `2`, `3`, `Portada 1.jpeg`, `Portada 2.jpeg` | `la-comarca` | Igual que BAMBU |
| La Sazón de la Tía | 3 | `1.png`, `2.png`, `3.png` | `la-sazon-de-la-tia` | Galería; usar `1.png` como portada provisional |
| Lonchería Romero | 3 | `1.png`, `2.png`, `3.png` | **No existe en el código** | Requiere crear ficha o descartar |
| Origen Cocina de Autor | 3 | `1.PNG`, `2.PNG`, `3.PNG` | `origen-cocina-de-autor` | Ficha oculta del listado (`hidden: true`) |

Restaurantes en el código **sin carpeta en Drive**: `dulce-paseo`, `dona-claudia`.

### 1.2 Hospedajes — 42 fotos

Carpeta: [HOSPEDAJES](https://drive.google.com/drive/folders/1VY2-RgvXqo7LPdrEPrEtddGGA-ZqLqLI)

Cada establecimiento tiene **7 fotos**: `1`…`5`, `Portada 1`, `Portada 2`.

| Establecimiento | Slug en el código |
| --- | --- |
| Glamping Vista Antigua | `glamping-vista-antigua` |
| Verdeser Glampings | `verdeser-glampings` |
| Hostal Campestre Camino Real | `hostal-campestre-camino-real` |
| Hostal Luna Azul | `hostal-luna-azul` |
| Casa Hiedra Hotel Boutique | `casa-hiedra-hotel-boutique` |
| Cabañas El Peñón | `cabanas-el-penon` |

Los 6 alojamientos del código tienen carpeta y fotos. Formatos mixtos:
JPEG, PNG y un WebP (`Casa Hiedra Hotel Boutique3`).

### 1.3 Artesanías — 40 fotos

Carpeta: [ARTESANIAS](https://drive.google.com/drive/folders/1DRxVrjD52z5ZWRNqQKwNde4evjU-1InL)

Cada carpeta tiene **5 fotos** (`1`…`5`).

| Carpeta en Drive | Fotos | Slug en el código | Observación |
| --- | ---: | --- | --- |
| ArteLu | 5 | **No existe** | Agregar ficha o descartar |
| Caliopes | 5 | **No existe** | Agregar ficha o descartar |
| Chelinarte | 5 | `chelinarte` | Coincide |
| Creaciones Martina | 5 | `creaciones-martina` | Coincide |
| Maestros de la Madera | 5 | `maestros-de-la-madera` | Coincide |
| Mi gorda Bella | 5 | `mi-gordita-bella` | El nombre difiere: “gorda” vs. “Gordita” |
| Mi Hermoso EDÉN | 5 | `mi-hermoso-eden` | Coincide |
| Yawart | 5 | **No existe** | Agregar ficha o descartar |

Artesanías en el código **sin carpeta en Drive**: `aroma-twins`.

### 1.4 Carpetas de fotos vacías

| Entrega | Carpeta | Estado |
| --- | --- | --- |
| Inicio | [FOTOS](https://drive.google.com/drive/folders/1mRq-nA4MSI41FbMz1y8BsLHI5iLKpqQQ) | 0 archivos |
| Qué hacer | [FOTOS](https://drive.google.com/drive/folders/1vwbU5bJkF3nhk2lb3B8yqUuZ9iCCzIpp) | 0 archivos |
| Información práctica | [FOTOS](https://drive.google.com/drive/folders/1EoBQ2uXDNA7O6ImQFoQ29FmtEN6AMtYQ) | 0 archivos |
| Curiosidades | [04. ENTREGA \[CURIOSIDADES\]](https://drive.google.com/drive/folders/17g3i_ArIANUQW94F6x6jQCdYw_mYc5tB) | 0 archivos |
| Historia | [05. ENTREGA \[HISTORIA\]](https://drive.google.com/drive/folders/1uzLMZJRIr5XPn80oAD27wWBAqOSC5qxG) | 0 archivos |
| Funcionalidades / administración | [06. ENTREGA](https://drive.google.com/drive/folders/1rJiEKscnCo8ekBrKsfz2qK54u4Z9v5Fd) | 0 archivos |

## 2. Imágenes esperadas por vista

“Slots” = cantidad de `Placeholder` que renderiza hoy el frontend. Una misma
foto puede reutilizarse en varios slots (por ejemplo, portada de tarjeta y hero
de ficha), por eso el total de slots no equivale al total de fotos necesarias.

| Vista / componente | Slots | Qué imagen se espera | Fuente disponible | Estado |
| --- | ---: | --- | --- | --- |
| Inicio · Hero | 1 fondo | Paisaje de Gramalote entre montañas | `01/FOTOS` vacía | Sin asset |
| Inicio · Mapa | 1 | Ilustración/ortofoto de Gramalote Nuevo y Viejo | No hay | Sin asset |
| Inicio · Accede rápido | 5 | Una foto por categoría: qué hacer, comer, dormir, historia, comprar | Fotos de comer/dormir/comprar disponibles; qué hacer/historia no | Parcial |
| Inicio · Experiencias | 3 | Cascadas, sabores y artesanías | Artesanías sí; Cascadas y sabores no | Parcial |
| Inicio · Abierto hoy | 3 | Tarjetas de establecimientos | Portadas de comer/dormir disponibles | Cubrible |
| Inicio · Historia | 1 | Archivo histórico o paisaje | `05` vacía | Sin asset |
| Qué hacer | 6 | Cascadas Arco Iris, Café Marquetalia, collage “Otro sitio”, mapa e historia | `03/QUE HACER/FOTOS` vacía | Sin asset |
| Experiencia (detalle) | 9 | 5 fotos de galería + 4 tarjetas “Ten en cuenta” | `03/QUE HACER/FOTOS` vacía | Sin asset |
| Dónde ir | 11 | Mapa, collage de comida (3), 4 alojamientos y 3 artesanías | Comer, hospedajes y artesanías | Cubrible |
| Dónde comer | 12 | 6 tarjetas, mapa, 4 alojamientos y 1 curiosidad | 6 restaurantes + hospedajes; curiosidad no | Casi completo |
| Dónde dormir | 9 | 5 tarjetas, mapa, 2 artesanías e historia | Hospedajes + artesanías; historia no | Parcial |
| Dónde comprar | 11 | 6 tarjetas, mapa, 3 platos típicos y 1 comida | Artesanías + restaurantes; platos no | Parcial |
| Establecimiento comer | 4 por ficha | 1 hero + 3 tarjetas de oferta | 3–5 fotos por restaurante | Cubrible (7 de 7; 6 visibles) |
| Establecimiento dormir | 5 por ficha | Galería de instalaciones | 7 fotos por hospedaje | Cubrible |
| Establecimiento comprar | 5 por ficha | 1 hero + 4 productos | 5 fotos por artesanía | Cubrible (5 de 6) |
| Curiosidades (hub) | 4 | Una imagen por faceta | `04` vacía | Sin asset |
| Curiosidad · Territorio | 8 | Café, Virgen, chocheco (2), ceibos, dalia, chocheca, cierre | `04` vacía | Sin asset |
| Curiosidad · Tradiciones | 7 | Festinavidad, Virgen, temporada, 3 celebraciones, cierre | `04` vacía | Sin asset |
| Curiosidad · Sabores | 8 | Chocheco, sopa de ruyas, chocheca, 3 amasijos, bebidas, cierre | `04` vacía | Sin asset |
| Curiosidad · Naturaleza | 9 | El Bojoso, ceibos, dalia, chocheca, tigrillo, oso mielero, Cascadas (2), cierre | `04` vacía | Sin asset |
| Información práctica | 10 | 3 accesos, 2 transportes, seguridad y 4 contactos | `03/.../FOTOS` vacía | Sin asset |
| Historia | 1 | Archivo/memoria del municipio | `05` vacía | Sin asset |
| Mapa | 1 | Mapa real o ilustración interactiva | No hay | Sin asset |

## 3. Brechas entre el inventario y el código

1. **Faltan fichas para fotos existentes**: Lonchería Romero (comer), ArteLu,
   Caliopes y Yawart (artesanías). Hay 16 fotos de esos lugares sin usar.
2. **Fichas sin fotos**: Aroma Twins, Dulce Paseo, Doña Claudia.
3. **Carpetas estratégicas vacías**: Curiosidades, Historia, Inicio, Qué hacer e
   Información práctica, que son justamente las vistas con más contenido
   editorial y patrimonial.
4. **Nomenclatura**: “Mi gorda Bella” (Drive) vs. “Mi Gordita Bella” (código).
5. **Formatos y peso**: hay PNG de hasta 3 MB y JPEG de hasta 4,7 MB; conviene
   convertirlos a WebP y generar variantes responsive antes de publicarlos.

## 4. Prioridad sugerida de consecución

1. **Curiosidades (04)** y **Historia (05)**: completan las vistas editoriales
   y son las de mayor impacto visual pendiente.
2. **Qué hacer (03)**: Cascadas Arco Iris y Café Marquetalia son protagonistas
   del Inicio y de la vista Qué hacer.
3. **Inicio**: hero, accesos rápidos e historia.
4. **Información práctica**: accesos, transporte y contactos.
5. **Mapa**: definir si será un mapa real (Leaflet/Mapbox/Google) o una
   ilustración; no es una foto.

## 5. Recomendaciones técnicas

- Mapear cada foto a un `slug` y a un rol (`cover`, `gallery`, `product`) en
  lugar de referenciar nombres con espacios o acentos.
- Guardar los assets en `frontend/public/images/<categoria>/<slug>/` o en el
  backend/CDN, no en `src/`.
- Generar `srcset` en 480/960/1440 px y usar `loading="lazy"` salvo en el hero.
- Mantener un fallback `Placeholder` para fichas sin foto y evitar imágenes
  rotas.
- Registrar créditos/licencia de cada foto si se van a publicar.
