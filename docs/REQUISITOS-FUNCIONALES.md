# Requisitos funcionales evidenciados

Revisión: **2026-10-22** · Alcance: SPA `frontend/` (React + Vite + React
Router) y datos locales de `src/data/`.

Estados usados:

- **Implementado**: la interacción existe y produce el resultado esperado.
- **Parcial**: la interfaz existe, pero el comportamiento está incompleto.
- **Pendiente**: la UI lo sugiere, pero no hay lógica conectada.
- **No evidenciado**: no hay UI ni código que lo plantee.

## 1. Actores

| Actor | Necesidad principal | Evidencia |
| --- | --- | --- |
| Visitante | Descubrir qué hacer, dónde ir, comer, dormir y comprar | Navegación y rutas en `App.jsx:22` |
| Visitante | Buscar contenido desde cualquier página | `Navbar.jsx:31` |
| Visitante | Consultar fichas y datos de contacto | `Establecimiento.jsx`, `Experiencia.jsx` |
| Administrador | Acceder a un módulo de administración | `Acceder.jsx:12` (solo formulario) |

## 2. Requisitos transversales

| ID | Requisito | Evidencia | Estado | Notas |
| --- | --- | --- | --- | --- |
| RF-01 | Navegación global con Inicio, Qué hacer, Dónde ir, Su historia y menú “Explorar” | `site.js:4`, `Navbar.jsx:69` | Implementado | “Explorar” despliega Curiosidades e Información práctica |
| RF-02 | Buscador global visible en el header y en el menú móvil | `Navbar.jsx:27`, `Navbar.jsx:146` | Implementado | Envía a `/buscar?q=` |
| RF-03 | Menú móvil desplegable con navegación y buscador | `Navbar.jsx:58`, `Navbar.jsx:119` | Implementado | Cierra al elegir un enlace |
| RF-04 | Breadcrumbs en páginas internas y fichas | `PageHero.jsx:3`, `HeroFicha.jsx:5` | Implementado | La última miga no es enlace |
| RF-05 | Restaurar el scroll al inicio al cambiar de ruta | `Layout.jsx:10` | Implementado | |
| RF-06 | Enlace “Saltar al contenido” y foco visible | `Layout.jsx:15`, `global.css:69` | Implementado | |
| RF-07 | Página 404 para rutas inexistentes | `App.jsx:42`, `NoEncontrada.jsx` | Implementado | |
| RF-08 | Fallback cuando una ficha no existe | `Establecimiento.jsx:10`, `Experiencia.jsx:12`, `CuriosidadDetalle.jsx:69` | Implementado | Ofrece volver al listado |
| RF-09 | Footer con CTA de Información práctica, navegación y redes | `Footer.jsx:30` | Implementado | El CTA se oculta en fichas y en Información práctica |
| RF-10 | Diseño responsive con menú móvil y grids adaptables | `home.css:514`, `layout.css:190`, `pages.css:1600` | Implementado | Breakpoints 1024/720 px |
| RF-11 | Anclas profundas a secciones de Información práctica (`#como-llegar`, `#seguridad`, `#contactos`, `#antes-de-salir`) | `site.js:34` | **Pendiente** | Las secciones de `InformacionPractica.jsx` no tienen `id`; el hash no desplaza |
| RF-12 | Metadatos SEO por ruta | `index.html:10` | Parcial | Solo hay `title` y `description` globales; no cambian por vista |

## 3. Inicio

| ID | Requisito | Evidencia | Estado | Notas |
| --- | --- | --- | --- | --- |
| RF-13 | Hero con propuesta de valor y CTA a Qué hacer y Dónde ir | `Hero.jsx:4` | Implementado | |
| RF-14 | Bloque de mapa con CTA a la vista Mapa | `MapBlock.jsx:19` | Parcial | El mapa es un `Placeholder`, no un mapa real |
| RF-15 | Accesos rápidos a 5 categorías | `QuickAccess.jsx:4` | Implementado | |
| RF-16 | Sección de experiencias destacadas | `ExperiencesSection.jsx:10`, `experiences.js` | Implementado | 3 registros locales |
| RF-17 | Bloque “Abierto hoy” con establecimientos | `OpenToday.jsx:23`, `inicio.js` | Parcial | Muestra destacados fijos; no calcula horarios |
| RF-18 | Bloque de historia con enlace a Su historia | `HistoryBlock.jsx:6` | Implementado | |

## 4. Exploración: Dónde ir y listados

| ID | Requisito | Evidencia | Estado | Notas |
| --- | --- | --- | --- | --- |
| RF-19 | Hub Dónde ir con mapa, comida, alojamiento y compras | `DondeIr.jsx:31` | Implementado | |
| RF-20 | Listado de establecimientos por categoría | `DondeComer.jsx:36`, `DondeDormir.jsx:37`, `DondeComprar.jsx:40` | Implementado | Datos locales en `establishments.js` |
| RF-21 | Filtro por tipo, servicios y precio | `FilterBar.jsx:17`, `DondeDormir.jsx:29`, `DondeComprar.jsx:27` | **Pendiente** | Los `<select>` no están controlados ni filtran |
| RF-22 | Filtro “Abierto hoy” | `DondeComer.jsx:30` | **Pendiente** | `openNow` existe en los datos (`establishments.js:74`) pero no se usa |
| RF-23 | Botón “Cargar más” | `DondeComer.jsx:42`, `DondeDormir.jsx:42`, `DondeComprar.jsx:46` | **Pendiente** | No tiene `onClick` ni paginación |
| RF-24 | Panel de mapa con CTA al mapa completo | `MapPanel.jsx:4` | Parcial | El CTA navega; el mapa es visual |
| RF-25 | Secciones cruzadas (también puedes dormir / comprar / curiosidades) | `DondeComer.jsx:51`, `DondeDormir.jsx:49`, `DondeComprar.jsx:53` | Implementado | |
| RF-26 | Ocultar establecimientos no publicados de los listados | `establishments.js:445` | Implementado | `origen-cocina-de-autor` está oculto pero accesible por URL |
| RF-27 | Mapa interactivo con filtros por categoría y distinción Nuevo/Viejo | `Mapa.jsx:9` | **Pendiente** | Solo hay pines decorativos y leyenda; el propio texto lo indica (`Mapa.jsx:38`) |

## 5. Fichas de establecimiento

| ID | Requisito | Evidencia | Estado | Notas |
| --- | --- | --- | --- | --- |
| RF-28 | Seleccionar plantilla de ficha según categoría | `Establecimiento.jsx:26` | Implementado | Comer / dormir / comprar |
| RF-29 | Ficha de comida con horario, dirección, pago, teléfono, oferta y relacionados | `EstablecimientoComer.jsx:22` | Implementado | |
| RF-30 | Ficha de alojamiento con check-in/out, ubicación, precio, galería y relacionados | `EstablecimientoDormir.jsx:10` | Implementado | |
| RF-31 | Ficha de artesanía con horario, pago, productos y relacionados | `EstablecimientoComprar.jsx:10` | Implementado | |
| RF-32 | Lugares relacionados navegables | `components/cards/RelatedPlaces.jsx:5` | Implementado | Filtra slugs inexistentes con `filter(Boolean)` |
| RF-33 | Enlaces sociales de la ficha | `HeroFicha.jsx:47` | Parcial | Son iconos sin URL (`<span>`) |

## 6. Experiencias

| ID | Requisito | Evidencia | Estado | Notas |
| --- | --- | --- | --- | --- |
| RF-34 | Vista Qué hacer con experiencia destacada, promo, collage, mapa e historia | `QueHacer.jsx:28` | Implementado | Contenido de ejemplo |
| RF-35 | Carrusel de imágenes y dots | `QueHacer.jsx:33`, `QueHacer.jsx:112` | **Pendiente** | Botones y dots sin lógica |
| RF-36 | Detalle de experiencia con datos, galería y recomendaciones | `Experiencia.jsx:24` | Implementado | |
| RF-37 | Enlace desde el detalle a información de acceso | `Experiencia.jsx:70` | Parcial | Apunta a `#contactos`, pero el ancla no existe |

## 7. Curiosidades

| ID | Requisito | Evidencia | Estado | Notas |
| --- | --- | --- | --- | --- |
| RF-38 | Hub con 4 facetas: Territorio, Tradiciones, Sabores y Naturaleza y vida | `Curiosidades.jsx:37`, `curiosities.js:1` | Implementado | |
| RF-39 | Detalle editorial con filas alternadas, colecciones de imágenes y cierre | `CuriosidadDetalle.jsx:27` | Implementado | Contenido alineado con los frames de Figma (2026-10-22) |
| RF-40 | Fichas de curiosidad para los 4 slugs | `App.jsx:37`, `curiosities.js` | Implementado | |

## 8. Información práctica

| ID | Requisito | Evidencia | Estado | Notas |
| --- | --- | --- | --- | --- |
| RF-41 | Cómo llegar, transporte, seguridad y recomendaciones | `InformacionPractica.jsx:25` | Implementado | Datos en `practical.js` |
| RF-42 | Directorio de contactos útiles | `InformacionPractica.jsx:110` | Parcial | Teléfonos de ejemplo repetidos (`+57 7 123 4567`) |
| RF-43 | Enlace a ubicación en el mapa | `InformacionPractica.jsx:140` | Parcial | Lleva al mapa visual, sin ubicación real |
| RF-44 | Llegar a una sección concreta desde el footer | `site.js:34` | **Pendiente** | Ver RF-11 |

## 9. Buscador

| ID | Requisito | Evidencia | Estado | Notas |
| --- | --- | --- | --- | --- |
| RF-45 | Buscar por texto y mostrar resultados enlazados | `Buscar.jsx:7` | Implementado | Búsqueda local |
| RF-46 | Estado vacío cuando no hay resultados | `Buscar.jsx:43` | Implementado | |
| RF-47 | Buscar también en curiosidades, historia e información práctica | `Buscar.jsx:11` | Parcial | Solo indexa establecimientos y experiencias |
| RF-48 | Búsqueda tolerante a mayúsculas/acentos y errores | `Buscar.jsx:9` | Parcial | Solo aplica `toLowerCase()`; no normaliza acentos |

## 10. Administración y backend

| ID | Requisito | Evidencia | Estado | Notas |
| --- | --- | --- | --- | --- |
| RF-49 | Formulario de acceso de administración | `Acceder.jsx:12` | Parcial | `preventDefault()`; no autentica |
| RF-50 | Persistencia y consumo de API | `backend/README.md` | **Pendiente** | Todo el contenido vive en `src/data/` |
| RF-51 | CRUD de establecimientos, experiencias y curiosidades | No hay UI | **No evidenciado** | La carpeta 06 de Drive está vacía |
| RF-52 | Roles/permisos de administración | No hay UI | **No evidenciado** | |

## 11. Requisitos de contenido y datos

| ID | Requisito | Evidencia | Estado | Notas |
| --- | --- | --- | --- | --- |
| RF-53 | Establecimientos con categoría, tipo, horario, dirección, pago, teléfono y relaciones | `establishments.js:57` | Implementado | 7 comer, 6 dormir, 6 comprar |
| RF-54 | Experiencias con slug, categoría, resumen, datos y recomendaciones | `experiences.js:1` | Implementado | 3 experiencias |
| RF-55 | Curiosidades con contenido estructurado por bloques | `curiosities.js:36` | Implementado | 4 facetas |
| RF-56 | Información práctica con accesos, transporte, seguridad y contactos | `practical.js:1` | Implementado | Textos y teléfonos provisionales |
| RF-57 | Imágenes reales en las fichas y secciones | `Placeholder.jsx` | **Pendiente** | Ver `IMAGENES.md` |

## 12. Fuera de alcance evidenciado

No hay UI ni código para: reservas, pagos, reseñas/calificaciones, cuentas de
visitante, favoritos, multiidioma, notificaciones, analítica, geolocalización
del usuario ni rutas de navegación paso a paso.

## 13. Prioridad sugerida

1. Filtros, “Abierto hoy” y “Cargar más” (RF-21, RF-22, RF-23).
2. Anclas de Información práctica (RF-11, RF-44).
3. Mapa real (RF-27, RF-43).
4. Buscador ampliado y normalizado (RF-47, RF-48).
5. Autenticación y backend (RF-49 a RF-52).
6. Assets reales (RF-57 y `docs/IMAGENES.md`).
