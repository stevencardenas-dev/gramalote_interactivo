# Gramalote Interactivo — documentación técnica

## Estructura del repositorio

```
gramalote_interactivo/
├─ frontend/   React + Vite (SPA)
├─ backend/    API Express + MySQL
├─ docs/       documentación del proyecto
└─ DRIVE.md    acceso a la carpeta de entregas UX/UI
```

## Frontend

- **Stack:** React 19 + Vite 8 + React Router 7.
- **Estilos:** CSS plano con variables (`src/styles/tokens.css`), sin framework.
- **Tipografías:** DM Sans (principal) e Inter (apoyo), cargadas desde Google Fonts.
- **Datos:** el inventario ya vive en MySQL (`backend/database/seed-content.sql`) y la API lo expone; el frontend todavía lee `src/data/` y se conectará a la API en la siguiente entrega. La base sigue siendo la fuente de verdad para el panel de administración.

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint     # oxlint
```

## Rutas implementadas

| Ruta | Página | Estado |
| --- | --- | --- |
| `/` | Inicio | Implementada (frame INICIO) |
| `/que-hacer` | Qué hacer | Implementada (frame QUE HACER) |
| `/que-hacer/:slug` | Detalle de experiencia | Implementada (frame EXPERIENCIA) |
| `/donde-ir` | Dónde ir (hub) | Implementada (frame DONDE IR) |
| `/donde-comer` | Listado comer | Implementada (frame DONDE COMER) |
| `/donde-dormir` | Listado dormir | Implementada (frame DONDE DORMIR) |
| `/donde-comprar` | Listado comprar | Implementada (frame DONDE COMPRAR) |
| `/establecimiento/:slug` | Ficha de establecimiento | Implementada (3 plantillas del Figma) |
| `/historia` | Su historia | Contenido provisional (sin frame en Figma) |
| `/curiosidades` | Curiosidades | Implementada (frame CURIOSIDADES) |
| `/curiosidades/:slug` | Detalle de curiosidad | Implementada (4 frames del Figma) |
| `/informacion-practica` | Información práctica | Implementada (frame INFORMACION PRACTICA) |
| `/mapa` | Mapa interactivo | Placeholder visual (pendiente mapa real) |
| `/buscar?q=` | Buscador | Implementada (búsqueda local) |
| `/acceder` | Login administración | Implementada (conectada a la API) |
| `/admin` | Panel de administración | Implementada (base protegida por sesión) |
| `/admin/establecimientos` | Listado editable de fichas | Implementada (API real) |
| `/admin/establecimientos/:id` | Editor de ficha e imágenes | Implementada (datos, fotos, publicación) |
| `*` | 404 | Implementada |

## Mapeo Figma → React

Archivo: **Gramalote Interactivo** (`Q8O4sRnaVlqEUFjxnOStv3`), página `Page 1`.

| Frame (Figma) | Node ID | Implementación |
| --- | --- | --- |
| INICIO | `1:6` | `pages/Inicio.jsx` + `components/home/*` |
| QUE HACER | `69:3356` | `pages/QueHacer.jsx` |
| EXPERIENCIA | `74:4765` | `pages/Experiencia.jsx` |
| DONDE IR | `19:202` | `pages/DondeIr.jsx` |
| DONDE COMER | `25:357` | `pages/DondeComer.jsx` |
| DONDE DORMIR | `94:414` | `pages/DondeDormir.jsx` |
| DONDE COMPRAR | `94:1617` | `pages/DondeComprar.jsx` |
| ESTABLECIMIENTO COMER | `41:768` | `pages/EstablecimientoComer.jsx` |
| ESTABLECIMIENTO DORMIR | `94:724` | `pages/EstablecimientoDormir.jsx` |
| ESTABLECIMIENTO COMPRAR | `197:1085` | `pages/EstablecimientoComprar.jsx` |
| INFORMACION PRACTICA | `184:386` | `pages/InformacionPractica.jsx` |
| CURIOSIDADES | `81:6832` | `pages/Curiosidades.jsx` |
| TERRITORIO E IDENTIDAD | `81:6984` | `pages/CuriosidadDetalle.jsx` (`territorio`) |
| TRADICIONES Y CELEBRACIONES | `272:1672` | `pages/CuriosidadDetalle.jsx` (`tradiciones`) |
| SABORES TRADICIONALES | `279:2130` | `pages/CuriosidadDetalle.jsx` (`sabores`) |
| NATURALEZA Y VIDA | `295:2493` | `pages/CuriosidadDetalle.jsx` (`naturaleza`) |
| Barra nav | `45:1068` | `components/layout/Navbar.jsx` |
| Encabezado (hero) | `45:1177` | `components/home/Hero.jsx` |
| Explora Gramalote Nuevo y Viejo | `46:1308` | `components/home/MapBlock.jsx` |
| Accede rápido | `51:1391` | `components/home/QuickAccess.jsx` |
| Experiencias | `51:1410` | `components/home/ExperiencesSection.jsx` |
| Abierto hoy | `51:1451` | `components/home/OpenToday.jsx` |
| Historia y cultura | `51:1557` | `components/home/HistoryBlock.jsx` |
| Footer | `126:1210` | `components/layout/Footer.jsx` |
| Ficha de establecimiento | `51:1495` | `components/cards/EstablishmentCard.jsx` |
| Tarjeta de experiencia | `51:1441` | `components/cards/ExperienceCard.jsx` |

Los 16 frames superiores tienen ruta implementada. No hay frame de Figma para
Su historia, Mapa, Buscador, Acceder ni 404: son vistas de apoyo.

## Design tokens

Definidos en `frontend/src/styles/tokens.css`:

- `--c-primary: #486284` (Neutral/10 del archivo de Figma)
- `--c-muted: #8CA2C0` (Neutral/7)
- `--c-line: #DEE5ED` (Neutral/2)
- Contenedor: 1280 px · gutter fluido `clamp(20px, 5vw, 80px)`

## Contenido de referencia

Los textos del Inicio y de Qué hacer se tomaron de los briefs de Drive:
`BRIEF INICIO`, `BRIEF 9 · QUÉ HACER`, `BRIEF 10 · DETALLE DE EXPERIENCIA`.
Las carpetas de Historia, Curiosidades y Funcionalidades siguen vacías en Drive.

## Documentos relacionados

- [`IMAGENES.md`](./IMAGENES.md): inventario de fotos de Drive, qué se espera en
  cada vista y brechas entre Drive y código.
- [`REQUISITOS-FUNCIONALES.md`](./REQUISITOS-FUNCIONALES.md): requisitos
  evidenciados por la UI, con estado y archivo de referencia.
- [`INCIDENCIAS.md`](./INCIDENCIAS.md): incongruencias detectadas, estado y
  prioridad.
- [`mobile-plan.md`](./mobile-plan.md): cómo se resuelve el diseño responsive de
  Inicio y de las fichas, breakpoints y verificación.
- [`../backend/README.md`](../backend/README.md): API de lectura y variables de
  entorno.
- [`../backend/database/README.md`](../backend/database/README.md): esquema
  MySQL propuesto, diagrama ER y mapeo desde el frontend.

## Pendientes / notas

- Inicio y las fichas de establecimiento usan ya los recortes de los PNG de
  Figma (`frontend/public/img/home`, `/ficha`, `/brand`). El resto de vistas
  (Qué hacer, Donde ir, Curiosidades, Historia) sigue con placeholders CSS.
  Drive tiene 106 fotos de restaurantes, hospedajes y artesanías, pero ninguna
  para Inicio, Qué hacer, Información práctica, Curiosidades o Historia
  (ver `IMAGENES.md`).
- Faltan fichas para Lonchería Romero, ArteLu, Caliopes y Yawart, y hay tres
  fichas sin fotos (Aroma Twins, Dulce Paseo, Doña Claudia).
- Los establecimientos y experiencias son datos de ejemplo basados en los nombres
  de las carpetas de Drive; deben reemplazarse por el inventario real.
- El buscador funciona en local; los filtros, “Abierto hoy” y “Cargar más” son
  visuales. Ver `REQUISITOS-FUNCIONALES.md`.
- La Google Docs API está deshabilitada en el proyecto de Google Cloud: para leer
  Docs usar exportación a `text/plain` (ver `DRIVE.md`).
