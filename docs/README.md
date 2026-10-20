# Gramalote Interactivo — documentación técnica

## Estructura del repositorio

```
gramalote_interactivo/
├─ frontend/   React + Vite (SPA)
├─ backend/    pendiente de definir
├─ docs/       documentación del proyecto
└─ DRIVE.md    acceso a la carpeta de entregas UX/UI
```

## Frontend

- **Stack:** React 19 + Vite 8 + React Router 7.
- **Estilos:** CSS plano con variables (`src/styles/tokens.css`), sin framework.
- **Tipografías:** DM Sans (principal) e Inter (apoyo), cargadas desde Google Fonts.
- **Datos:** por ahora en `src/data/` con registros de ejemplo; se reemplazarán por la API del backend.

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
| `/` | Inicio | Implementada (wireframe INICIO) |
| `/que-hacer` | Qué hacer | Implementada con datos de ejemplo |
| `/que-hacer/:slug` | Detalle de experiencia | Plantilla base |
| `/donde-ir` | Dónde ir (hub) | Implementada |
| `/donde-comer` | Listado comer | Implementada |
| `/donde-dormir` | Listado dormir | Implementada |
| `/donde-comprar` | Listado comprar | Implementada |
| `/establecimiento/:slug` | Ficha de establecimiento | Plantilla base |
| `/historia` | Su historia | Contenido provisional |
| `/curiosidades` | Curiosidades | Contenido provisional |
| `/informacion-practica` | Información práctica | Contenido provisional + anclas |
| `/mapa` | Mapa interactivo | Placeholder visual |
| `/buscar?q=` | Buscador | Búsqueda local sobre los datos de ejemplo |
| `/acceder` | Login administración | Formulario sin conexión |
| `*` | 404 | Implementada |

## Mapeo Figma → React

Archivo: **Gramalote Interactivo** (`Q8O4sRnaVlqEUFjxnOStv3`), página `Page 1`.

| Frame (Figma) | Node ID | Implementación |
| --- | --- | --- |
| INICIO | `1:6` | `pages/Home.jsx` + `components/home/*` |
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

Vistas restantes del archivo (por implementar): DONDE IR (`19:202`), DONDE COMER
(`25:357`), DONDE DORMIR (`94:414`), DONDE COMPRAR (`94:1617`), ESTABLECIMIENTO
COMER (`41:768`), ESTABLECIMIENTO DORMIR (`94:724`), ESTABLECIMIENTO COMPRAR
(`197:1085`), QUE HACER (`69:3356`), EXPERIENCIA (`74:4765`), INFORMACION
PRACTICA (`184:386`), CURIOSIDADES (`81:6832`, `81:6984`, `81:7136`, `81:7288`,
`81:7440`).

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

## Pendientes / notas

- Las imágenes son placeholders CSS: la descarga de assets de Figma quedó bloqueada
  por rate limit de la API (plan Starter, HTTP 429) y no hay fotos definitivas en Drive.
- Los establecimientos y experiencias son datos de ejemplo basados en los nombres de
  las carpetas de Drive; deben reemplazarse por el inventario real.
- El buscador y el filtro de "Abierto hoy" son locales; la lógica de horarios debe
  implementarse contra el backend.
- La Google Docs API está deshabilitada en el proyecto de Google Cloud: para leer
  Docs usar exportación a `text/plain` (ver `DRIVE.md`).
