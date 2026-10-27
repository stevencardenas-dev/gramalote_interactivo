# Estructura de imágenes y archivos de diseño

Dos mundos separados: lo que **se sirve** en la web y lo que es **referencia**
para construir las vistas.

## 1. Se sirve en la página — `frontend/public/` (versionado)

| Carpeta | Contenido |
| --- | --- |
| `brand/` | Isotipo y logos SVG (`isotipo.svg`, `logo-*.svg`) |
| `brand/icons/` | 29 iconos SVG de la entrega de Figma (`icono-*.svg`) |
| `brand/social/` | 8 iconos de redes sociales |
| `img/home/` | Fotos de Inicio (hero, categorías, exp-*, est-*) |
| `img/ficha/` | Fotos de fichas de establecimiento y relacionados |
| `img/brand/` | Logos PNG (alcaldía) |

Reglas: nada pesado (> ~500 KB) va aquí; comprimir/redimensionar antes. Los
iconos de `brand/icons` y `brand/social` están copiados pero **aún sin usar en
el código** (se referencian por nombre cuando se integren las vistas).

## 2. Solo referencia — `referencia/` (ignorado por git)

| Carpeta | Contenido |
| --- | --- |
| `disenos-figma/wireframes-20-octubre/` | Pantallas completas de la primera entrega (14 PNG) |
| `disenos-figma/frames-26-octubre/` | Frames nuevos: Inicio y establecimientos comer/comprar/dormir |
| `entregas-drive/<entrega> - <fecha>/` | Lo extraído de los `.zip` del Drive (SVG originales, fotos en alta resolución) |
| `disenos-figma/frames-27-octubre/` | Frames más recientes: Dónde ir/comer/dormir, fichas comer/comprar/dormir e Inicio |
| `fotos-establecimientos/<tipo>/<slug>/` | Fotos del Drive ya ordenadas por establecimiento (slug = el de `establishments.js`); `inicio/` trae hero, categorías y experiencias; `sin-ficha-en-codigo/` lo que aún no tiene ficha |
| `capturas-sitio/` | Capturas del sitio construido (QA visual), no son diseño |

Las fotos de `entregas-drive/Imagenes alta resolucion Inicio - 27 octubre/`
son la fuente para `frontend/public/img/`; `gramalote-hero-inicio.png` (60 MB) y
`gramalote-nuevo-mapa.png` (35 MB) hay que comprimirlas antes de servirlas.

## 3. Drive vs. local (revisión 2026-10-27)

Imágenes presentes en el Drive que **no están** en `frontend/public/` ni en
`referencia/` (los `.zip` ya estaban extraídos). Fuente:
`Gramalote Interactivo — Entregas UX/UI a Sistemas` → `02. ENTREGA [DONDE IR]`.

**Restaurantes** (`DONDE COMER/FOTOS RESTAURANTES/`) — carpetas reorganizadas desde
el inventario del 22-oct; ahora cada una trae `Portada N - FICHA.png` y fotos de platos:

| Establecimiento | Nuevo |
| --- | --- |
| BAMBU | `CAFETERÍA Y POSTRES`, `COCTELERÍA`, `HAMBURGUESAS`, `Portada 1/2 - FICHA.png` |
| Doña Claudia | carpeta nueva: 3 platos (arroz con verduras, pollo con arroz, pollo con mazorca) + `Portada 1/2` y `- FICHA` |
| Dulce Paseo | carpeta nueva: `Portada 1/2.png` y `Portada 1/2 - FICHAS.png` |
| Fresas con Crema Carvajal | `FRESAS CON CREMA`, `MARACUMANGO`, `OBLEAS`, `Portada 1/2 - FICHA.png` |
| La Comarca | `FRESAS CON CREMA`, `HELADOS`, `YOGUR GRIEGO`, `Portada 1/2 - FICHA.png` |
| La Sazón de la Tía | `CARNES A LA PLANCHA`, `PECHUGA EN SALSA DE CHAMPIÑONES`, `SOBREBARRIGA EN SALSA`, `Portada 1/2` y `- FICHA` |
| Lonchería Romero | `PECHUGA A LA PLANCHA`, `PESCADO FRITO`, `POLLO CON PASTA` |
| Origen Cocina de Autor | `CHORIPÁN`, `EL TESORO`, `MAICITO MIXTO` |

**Artesanías** (`DONDE COMPRAR/ARTESANIAS/`): ArteLu, Caliopes y Yawart (las revisadas) traen ahora
`PORTADA FICHA.png` además de `1`…`5`; **Sombreros TECHA** es carpeta nueva.

**Hospedajes** (`DONDE DORMIR/HOSPEDAJES/`): `Verdeser Glampings` y
`Casa Hiedra` traen `Portada 1/2 - FICHA.png` (no estaban en el inventario).

Sin imágenes en Drive todavía: Inicio/FOTOS, Qué hacer/FOTOS, Información
práctica/FOTOS, Curiosidades, Historia y Funcionalidades. Las portadas `- FICHA` y las fotos nuevas ya están descargadas en
`referencia/fotos-establecimientos/`; falta decidir cuáles integrar y comprimirlas.
Pendiente de contrastar con los frames del 27-oct: banner de Curiosidades,
hero de Dónde ir y el collage de gastronomía (torta y helados en copa).
