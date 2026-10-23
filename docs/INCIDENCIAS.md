# Incidencias e incongruencias detectadas

Revisión: **2026-10-22** · Alcance: frontend React, documentación, Figma y
backend.

Estados: **Corregido**, **Pendiente**, **Observación** (no es un error, pero
conviene decidir).

## 1. Información práctica vs. Figma

Frame comparado: `INFORMACION PRACTICA` (`184:386`) contra
`/informacion-practica` a 1440 px.

| ID | Hallazgo | Evidencia | Impacto | Estado |
| --- | --- | --- | --- | --- |
| INC-01 | Las tarjetas de “Cómo llegar” y “Opciones de transporte” eran blancas con borde, y el CTA “Consultar ruta” usaba el azul primario. En Figma son tarjetas grises con botón gris sólido. | `pages.css` `.access-card`, `.transport-card`; `InformacionPractica.jsx:38` | La vista no se parecía al diseño | **Corregido**: fondo `surface-3`, botón `secondary` |
| INC-02 | “Seguridad durante tu visita” mostraba solo las descripciones; Figma tiene 5 tarjetas con título en negrita y descripción. | `practical.js:27`, `InformacionPractica.jsx:65` | Se perdía la jerarquía y parte del contenido | **Corregido**: `safetyTips` ahora es `{title, text, icon}` y se renderiza en tarjetas |
| INC-03 | Los enlaces `#como-llegar`, `#seguridad`, `#contactos` y `#antes-de-salir` no funcionaban porque las secciones no tenían `id`. | `site.js:34`, `InformacionPractica.jsx` | Footer, accesos rápidos y detalle de experiencia no desplazaban | **Corregido**: IDs + `scroll-margin-top` |
| INC-04 | El detalle de experiencia enlazaba a `#contactos` sin destino. | `Experiencia.jsx:70` | Enlace muerto | **Corregido** con INC-03 |
| INC-05 | Quedan diferencias cosméticas: los placeholders son patrones CSS (Figma usa gris plano), el ancho de la imagen de contactos es 74 px y el Figma usa ~100 px, y algunas tarjetas tienen otro alto. | `pages.css` `.contact-card__media` | Bajo, desaparece al cargar fotos reales | **Pendiente** |
| INC-06 | El bloque de ubicación lleva a `/mapa`, que sigue siendo un mapa decorativo. | `InformacionPractica.jsx:142` | El usuario no llega a una ubicación real | **Pendiente** |

## 2. Acceso a Tradiciones

**No es inaccesible.** La ruta existe y está enlazada:

1. Menú **Explorar** → **Curiosidades** (`site.js:12`, `Navbar.jsx:83`).
2. En el hub, cada fila tiene su CTA: “Conocer tradiciones” apunta a
   `/curiosidades/tradiciones` (`Curiosidades.jsx:47`).
3. URL directa: `http://localhost:4173/curiosidades/tradiciones`.

La ruta está registrada en `App.jsx:37` y el detalle se resuelve con
`getCuriosity('tradiciones')`.

**Observación:** no hay un enlace “Tradiciones” en el menú principal ni en el
menú móvil; solo se llega a través del hub de Curiosidades. Es coherente con la
navegación actual, pero si se quiere acceso directo habría que añadir las 4
facetas al desplegable “Explorar” o al menú móvil. No lo cambié para no alterar
la arquitectura de navegación aprobada.

**Contenido corregido:** el bloque “Festinavidad” tenía el párrafo de “La
temporada comenzaba…” y faltaba la fila independiente que sí aparece en Figma.
Se corrigió el orden y se agregó la fila sin título. Ver commit `fb093c2` y
`frontend/src/data/curiosities.js`.

## 3. Base de datos

| ID | Hallazgo | Evidencia | Impacto | Estado |
| --- | --- | --- | --- | --- |
| INC-07 | **No existía ningún esquema de base de datos.** `backend/` solo tenía un README que decía “pendiente de definir stack, modelo de datos y endpoints”. | `backend/README.md` (antes), `git log --all -- '*.sql'` | No había modelo para la API ni para el panel admin | **Corregido**: se creó el esquema MySQL propuesto |
| INC-08 | El frontend depende de datos locales (`src/data/*.js`); la API de lectura ya existe, pero el frontend aún no la consume. | `frontend/src/data/`, `backend/src/` | Los cambios de contenido no se guardan | **Parcial**: integrar la API y migrar datos |
| INC-09 | El despliegue actual solo publica el frontend; no hay servicio de MySQL ni migraciones. | `docker-compose.yml` raíz, `.github/workflows/deploy-ec2.yml` | La base no está integrada a CI/CD ni a la instancia | **Pendiente** |

**Esquema creado:** `backend/database/schema.sql` (33 tablas + 3 vistas),
`seed.sql` (catálogos) y `backend/database/README.md` (ER, mapeo y pendientes).
Validado en MySQL 8.4.11 con Docker. Decisión: MySQL 8.0+ e InnoDB.

## 4. Incongruencias funcionales del frontend

| ID | Hallazgo | Evidencia | Estado |
| --- | --- | --- | --- |
| INC-10 | Los filtros de tipo, servicios y precio son visuales: `FilterSelect` no tiene `value`/`onChange` y no filtran. | `FilterBar.jsx:17`, `DondeDormir.jsx:29`, `DondeComprar.jsx:27` | **Pendiente** |
| INC-11 | “Abierto hoy” no calcula horarios; `openNow` existe en los datos pero no se usa. | `DondeComer.jsx:30`, `establishments.js:74` | **Pendiente** |
| INC-12 | “Cargar más” no tiene `onClick` ni paginación. | `DondeComer.jsx:42`, `DondeDormir.jsx:42`, `DondeComprar.jsx:46` | **Pendiente** |
| INC-13 | El mapa es decorativo; no hay geolocalización ni filtros reales. | `Mapa.jsx:9`, `MapPanel.jsx:24` | **Pendiente** |
| INC-14 | `/acceder` solo hace `preventDefault()`; no autentica. | `Acceder.jsx:12` | **Pendiente** |
| INC-15 | El buscador solo indexa establecimientos y experiencias; no busca curiosidades, historia ni información práctica, y no normaliza acentos. | `Buscar.jsx:7` | **Pendiente** |
| INC-16 | Los carruseles de Qué hacer tienen flechas y dots sin lógica. | `QueHacer.jsx:33`, `QueHacer.jsx:112` | **Pendiente** |
| INC-17 | **ID duplicado `site-search`**: el formulario de búsqueda se renderiza en escritorio y en el panel móvil, ambos con el mismo `id` y `htmlFor`. | `Navbar.jsx:47`, `Navbar.jsx:103`, `Navbar.jsx:146` | **Corregido**: IDs `site-search` y `site-search-mobile` |
| INC-18 | Los iconos sociales de las fichas son `<span>` sin URL. | `HeroFicha.jsx:46` | **Pendiente** |
| INC-19 | Los teléfonos de contactos son de ejemplo y se repiten; las redes del footer apuntan a las home genéricas. | `practical.js:82`, `site.js:25` | **Pendiente** |
| INC-20 | No hay `prefers-reduced-motion` ni metadatos SEO por ruta. | `global.css`, `index.html:10` | **Pendiente** (calidad) |

## 5. Incongruencias de contenido e inventario

| ID | Hallazgo | Evidencia | Estado |
| --- | --- | --- | --- |
| INC-21 | Hay fotos sin ficha: Lonchería Romero (3), ArteLu (5), Caliopes (5) y Yawart (5). | `docs/IMAGENES.md` | **Pendiente** |
| INC-22 | Hay fichas sin fotos: Aroma Twins, Dulce Paseo y Doña Claudia. | `docs/IMAGENES.md` | **Pendiente** |
| INC-23 | El nombre difiere: Drive “Mi gorda Bella” vs. código “Mi Gordita Bella”. | `establishments.js`, `docs/IMAGENES.md` | **Pendiente** |
| INC-24 | `Origen Cocina de Autor` está oculto de los listados (`hidden: true`) pero sigue accesible por URL directa. | `establishments.js:191`, `establishments.js:445` | **Observación** |
| INC-25 | `homeHighlights` usa “Restaurante El Gran Sazón” para el slug `la-sazon-de-la-tia` (la ficha se llama “La Sazón de la Tía”) y “Coofe Garden” no existe en establecimientos. | `inicio.js` | **Pendiente** |
| INC-26 | `Café Marquetalia` está clasificado como `Parque` en `experienceDetails`, aunque es una cafetería. | `experiences.js:66` | **Pendiente** |
| INC-27 | La experiencia “Otro sitio” es contenido de relleno (“Por definir”). | `experiences.js:99` | **Pendiente** |
| INC-28 | No hay fotos en Inicio, Qué hacer, Información práctica, Curiosidades ni Historia; todo es placeholder. | `docs/IMAGENES.md` | **Pendiente** |

## 6. Prioridad sugerida

1. Implementar filtros, “Abierto hoy”, “Cargar más” y mapa real (INC-10 a INC-13).
2. Corregir los enlaces sociales de las fichas (INC-18).
3. Conectar la API con el esquema MySQL y migrar el contenido (INC-08, INC-09).
4. Completar fichas/fotos faltantes y unificar nombres (INC-21 a INC-28).
5. Ajustes cosméticos de Información práctica cuando lleguen las fotos (INC-05).
