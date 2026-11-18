# Informe de accesibilidad: Gramalote Interactivo (Fase 1, diagnóstico)

Norma: Anexo 1 de la Resolución MinTIC 1519/2020 (WCAG 2.1 AA).
Alcance: `frontend/` (React 19 + Vite 8 + react-router 7, CSS plano en `src/styles/`, MapLibre GL + PMTiles para el mapa, PWA propia). El backend no se revisó.
Actualizado tras traer `origin/main` (73 commits nuevos: Sugerir, Confirmar*, Dialog, BannerCarousel, admin claro/oscuro, nuevas páginas de admin). Rama `Cambios_mapa` adelantada por fast-forward.
Método: revisión manual del código con búsquedas dirigidas y cálculo de contraste de la paleta (`tokens.css`). **No se ejecutó axe, pa11y ni Lighthouse**: no están instalados en el proyecto. Las líneas son aproximadas y se afinarán en la Fase 2.

## Resumen

El proyecto ya parte de una base sólida: `lang="es"`, enlace "Saltar al contenido", `<main>`, foco global `:focus-visible`, `prefers-reduced-motion`, botón de pausa en el carrusel, `<label htmlFor>` en login, `autocomplete` en credenciales, títulos de página dinámicos (`usePageTitle`), `aria-current`, `aria-label` en los marcadores del mapa y `alt=""` en imágenes decorativas.

| Estado | Criterios |
|---|---|
| Cumple (según código) | 1.1.1 (en general), 1.3.1 (en general), 1.4.4, 1.4.10 (a verificar), 2.1.1 (en general), 2.2.2 (botón de pausa), 2.4.1, 2.4.2, 2.4.4, 3.1.1, 3.2.3, 4.1.1 |
| Cumple parcialmente | 1.4.11, 2.4.7, 3.3.1, 3.3.2, 4.1.2 (pestañas, diálogos) |
| No cumple | 1.4.3 Contraste (texto/botones coral, oro, oliva, placeholder) y 4.1.3 Mensajes de estado (errores sin `role="alert"`): **una sola categoría de incumplimiento AA** |
| No verificable solo con código | Calidad de `alt`, 2.1.2 en el mapa, lector de pantalla, PDFs/videos |

## Hallazgos

| # | Criterio WCAG | Nivel | Archivo (aprox.) | Problema | Sev. | Corrección |
|---|---|---|---|---|---|---|
| 1 | 1.4.3 Contraste mínimo | AA | `styles/mapa.css:493`, `styles/vistas.css:299`, `admin-dark.css:178` | Texto `--c-coral` (#db5319) sobre crema/blanco: 3,62:1 y 3,99:1 (<4,5). | Alta | Usar `#b8410f` (ya existe en el proyecto: 5,0:1 sobre crema) o un coral oscurecido. |
| 2 | 1.4.3 / 1.4.11 | AA | Botones/fondos con `--c-coral`, `--c-gold`, `--c-olive` y texto blanco (`styles/home.css:730`, `mapa.css:1096`, `admin-dark.css:191` con `#fff`) | Blanco sobre coral 3,99:1; sobre oro 2,14:1; sobre oliva 2,38:1. Texto/iconos UI bajo el mínimo. | Alta | Texto `--c-ink`/navy sobre oro y oliva; coral oscurecido para fondo con blanco. Revisar cada uso de estos tres colores como fondo. |
| 3 | 1.4.3 | AA | `styles/ui.css:251` (placeholder `#6d8ea3`) | Placeholder 3,47:1 sobre blanco. | Media | Oscurecer a ≥ #5a7589 (4,5:1). |
| 4 | 1.4.11 Contraste no textual | AA | Bordes de campos (`--c-line` #e6d7c8, 1,28:1 sobre crema) en inputs de `ui.css`/`pages.css`/`admin.css` | El borde es el único indicador del límite del campo; no llega a 3:1. | Media | Borde de inputs ≥ 3:1 (p. ej. #8a7d70). |
| 5 | 1.4.3 | AA | `styles/admin.css:155,191,404,421,934,1022,1120`, `pages.css:9` | Texto de 11 px (legibilidad y contraste sobre fondos suaves). | Baja | Subir a ≥ 12–13 px y comprobar contraste del color usado. |
| 6 | 2.4.7 Foco visible | AA | `styles/ui.css:255` (`.search-field input:focus {outline:none}`) | Se quita el contorno; solo es válido si `.search-field` muestra un indicador `:focus-within` (no se encontró ninguna regla). | Alta | Añadir `.search-field:focus-within { outline: 2px solid … }`. |
| 7 | 2.4.7 | AA | `styles/admin.css:702`, `admin-dark.css:360,1330,2589` | `outline:none` en inputs sustituido por `box-shadow` de 14–20 % de opacidad (tenue, <3:1) y borde. En `admin-dark.css:1165` el enlace de fila pierde contorno (se compensa en la fila con `:has`, funciona). | Media | Mantener `outline` visible o `box-shadow` con contraste ≥ 3:1. |
| 8 | 3.3.1 Identificación de errores / 4.1.3 Mensajes de estado | A / AA | `.auth-error` en `Acceder.jsx:118,159`, `Admin.jsx:86`, `ConfirmarCalificacion.jsx:49,60`, `ConfirmarSugerencia.jsx:41,55`, `ImagePicker.jsx:107`, `DondeComer/Comprar/Dormir`, `AdminExtras/Patrimonio/Experiencias/Paginas` (≈20 sitios) | Ningún error `.auth-error` usa `role="alert"` ni se asocia a los campos (solo `AdminToast` y `RatingStars` lo hacen). Salvo `AdminPaginas`, no hay `aria-invalid`. En `RatingStars.jsx:153` sí usa `role="alert"`. | Alta | `role="alert"` en `.auth-error`; `aria-invalid` + `aria-describedby` en los campos. Revisar errores de `Restablecer.jsx`, `AdminUsuarios.jsx` y `AdminEstablecimiento.jsx`. |
| 9 | 4.1.2 Nombre, función, valor / 2.1.1 | A | `AdminEstablecimiento.jsx:426`, `AdminEstablecimientos.jsx:198`, `AdminExperiencias.jsx:308,582` | `role="tablist"`/`role="tab"` sin `aria-controls`, `role="tabpanel"`, `tabindex` rotativo ni flechas de teclado. Además `<nav role="tablist">` sobrescribe la semántica de navegación. | Media | Implementar el patrón completo de pestañas, o quitar los roles y usar botones con `aria-pressed`/`aria-current`. |
| 10 | 4.1.2 / 1.3.1 | A | `components/ui/LiveMap.jsx:429,588`, `RatingStars.jsx:83` | `Dialog.jsx` (foco inicial + Esc), `AdminDialog`, `ImagePicker`, `RatingStars`, `WhatsAppHelp` y `LiveMap` usan `role="dialog"`; ninguno atrapa el foco ni lo devuelve al elemento que lo abrió (solo `Navbar` lo hace). `mapa-ficha` usa `role="dialog"` sin ser modal. | Media | Comprobar en navegador; añadir foco inicial, Esc y retorno del foco. |
| 11 | 3.3.2 Etiquetas o instrucciones | A | `pages/Admin.jsx`, `AdminEstablecimiento*.jsx`, `AdminUsuarios.jsx` y `OpeningHoursEditor.jsx` (71 campos vs. 97 coincidencias de label/aria-label) | La cobertura de etiquetas parece buena, pero hay que confirmar campo por campo, sobre todo en el editor de horarios y en la tabla de filas. | Media | Validar con axe en la Fase 2 y corregir los campos sin nombre accesible. |
| 12 | 3.3.2 / 1.3.5 Identificar propósito | A / AA | `Navbar.jsx:94` (`autoComplete="off"`), `AdminEstablecimiento` (datos de contacto) | Búsqueda con `off` es aceptable. Los formularios de contacto/teléfono del admin no declaran `autocomplete`. | Baja | Añadir `autocomplete` a campos con propósito personal (`tel`, `email`, `url`), si aplica. |
| 13 | 2.2.2 Pausar, detener, ocultar | A | `components/ui/HeroFicha.jsx:103–226` y `components/home/BannerCarousel.jsx` | Cumple (botón de pausa). **Pero** el carrusel se mueve por `requestAnimationFrame`, que se salta el `prefers-reduced-motion` global: si el usuario pidió reducir movimiento, igualmente se mueve (sin `matchMedia`). `BannerCarousel` (nuevo, home) usa animación CSS con `animationPlayState`; comprobar que tenga botón de pausa y respete reduced-motion. | Media | Si `matchMedia('(prefers-reduced-motion: reduce)')` coincide, iniciar en pausa. | <!-- reduced-motion es AAA (2.3.3); 2.2.2 ya cumple por el botón de pausa -->
| 14 | 2.2.2 | A | `styles/mejoras.css:98` (`stars-nudge` infinito) | Animación que se repite sin límite y dura más de 5 s; no tiene control propio (se anula con reduced-motion). | Baja | Limitar iteraciones (3) o pausarla al interactuar. |
| 15 | 1.1.1 Contenido no textual | A | `components/ui/LiveMap.jsx` (MapLibre) | El mapa es un `<canvas>`: hay lista de lugares (`mapa-lista`) como alternativa textual y marcadores con `aria-label`; falta comprobar que la lista sea accesible en escritorio y que el lienzo tenga una etiqueta/descripción que la anuncie. | Media | `aria-label` y breve descripción del mapa y enlace a la lista; revisión con teclado y lector. |
| 16 | 2.1.2 Sin trampas de teclado | A | `LiveMap.jsx` | MapLibre captura teclas de flechas y `+/-` cuando tiene foco; verificar que Tab sale del mapa y que los controles son alcanzables. | Media | Prueba manual con teclado. |
| 17 | 1.3.1 / 2.4.6 Encabezados | A / AA | `pages/*.jsx` | Páginas con `h1` (todas salvo `Inicio`, donde está en `Hero.jsx:17`). Se vieron `h2→h3` correctos; falta confirmar en `Buscar.jsx` (el `h3` en tarjetas bajo `h2`: correcto) y en componentes con `h3` suelto. | Baja | Verificar saltos con axe en Fase 2. |
| 18 | 2.4.4 Propósito de los enlaces / 3.2.5 | A | `Footer.jsx:35`, `HeroFicha.jsx:168`, `LiveMap.jsx:458`, `InformacionPractica.jsx:42`, `PageHero.jsx` | Enlaces con `target="_blank"` sin aviso de "se abre en otra pestaña" (3.2.5 AAA, buena práctica) y con `rel="noreferrer"` (correcto). | Buena práctica (AAA 3.2.5; fuera del conteo) | Añadir texto oculto "(abre en una pestaña nueva)". |
| 19 | 1.4.4 / 1.4.10 Reflow | AA | `styles/*.css` (≈ 6.000 líneas) y `LiveMap` | Viewport sin `user-scalable=no` (bien). Falta comprobar reflow a 320 px y zoom 200 % en la cabecera fija, mapa y paneles. | Media | Prueba manual a 320 px / 200 %. |
| 20 | 2.5.5 / Áreas táctiles (WCAG 2.2 AA 2.5.8, buena práctica) | — | `.carousel-dots button`, botones `×` de filtros del mapa (`LiveMap.jsx:557–575`), `carousel-arrow` | Posibles objetivos < 24×24 px. | Buena práctica (WCAG 2.2 2.5.8; fuera del conteo) | Garantizar ≥ 24 px (idealmente 44). |
| 21 | 2.4.2 Título de página | A | `components/layout/Layout.jsx:31` | **Cumple**: el título se fija por ruta desde `Layout` (`usePageTitle`). | — | Ninguna. |
| 22 | 3.3.2 / 1.3.1 | A | `pages/Sugerir.jsx` (nuevo) | Formulario con `<label>` envolviendo cada campo, `autoComplete` en nombre/correo y honeypot oculto (`aria-hidden`, `tabIndex=-1`): correcto. Revisar que obligatorios se indiquen (más allá de `required`) y errores asociados (ver #8). | Baja | Marcar "obligatorio" en texto y asociar errores. |
| 22b | 1.3.1 / 2.4.1 Bloques | A | `index.html` sin `<noscript>` | La app es 100 % cliente: sin JS no hay contenido. | Baja | Añadir un `<noscript>` con mensaje y contacto. |
| 23 | 2.3.1 Umbral de destellos | A | Todo el CSS | No se encontraron destellos > 3/s. | — | Ninguna. |
| 24 | 1.2.x Multimedia | A/AA | Todo `src/` | No hay `<video>`/`<audio>` en el front-end. | — | Aplicará si se añaden. |

## Lo que requiere revisión humana

- Calidad y suficiencia de los textos alternativos (`alt`) de fotos de `data/*.js` (`imageAlt`, `block.image.alt`) y los que escribe el administrador en `AdminEstablecimiento` (`image.alt`). Posible `alt` vacío o genérico en carga de imágenes por el panel.
- Uso real con lector de pantalla (NVDA + Firefox/Chrome): mapa, diálogos, sugerencias de búsqueda (`role="listbox"`), carrusel, pestañas.
- Navegación solo con teclado en el mapa MapLibre y orden de foco de los paneles.
- Reflow a 320 px y zoom 200/400 % en móvil real.
- Documentos descargables (PDF, folletos) y su accesibilidad, si se publican.
- Declaración de accesibilidad y mecanismo de contacto exigidos por la Resolución 1519 (contenido del sitio, no del código).
- Contraste real de texto sobre imágenes (Hero, `PageHero`, `HeroFicha`): depende de la foto y el degradado.

## Pendiente antes de la Fase 2

Para automatizar la verificación sin tocar el proyecto convendría instalar `@axe-core/cli` (o `pa11y`) en una carpeta temporal y ejecutarlo contra `vite preview` con el Chrome ya instalado en el equipo. Se haría solo si lo apruebas.


---

# Fase 2: implementación y estado final

## Verificación automática (axe-core 4.x con Chrome, `vite preview`)

Herramienta instalada **fuera del proyecto** (carpeta temporal). Reglas WCAG 2.0/2.1 A y AA más buenas prácticas, 17 rutas públicas × 2 anchos (1280 y 375 px). **Sin API ni base de datos**, así que se ven los estados de error/carga; las vistas con datos y el panel de administración (requiere sesión) **no se probaron con axe**.

| | Antes | Después |
|---|---|---|
| `color-contrast` (serious) | 28 nodos en 7 páginas | 0 |
| `link-name` (serious) | 2 (botón sin texto en Dónde dormir: `meta.relationCta` no existía) | 0 |
| `image-redundant-alt` (minor) | 10 | 0 |
| **Total de infracciones** | 3 reglas / 40 nodos | **0** |

`npm run build`: correcto tras cada grupo. `npm run lint` (oxlint): solo la advertencia previa de `lib/dialog.jsx` (no es nuestra).

## Cambios por grupo

1. **Errores de formulario (#8, #11, #22):** `role="alert"` en los ≈ 20 `.auth-error`; `AdminToast` usa `role="alert"` para errores; `aria-invalid`/`aria-describedby` en Acceder y Restablecer; "(obligatorio)" en texto (CSS `:has(:required)` central en `global.css`, y texto oculto + aviso en `Sugerir`).
2. **Foco (#6, #7):** `.search-field:focus-within` (contorno azul marino, 10:1); los `outline:none` de los campos del panel pasan a contorno de 2 px.
3. **Contraste (#1–#5):** tokens nuevos `--c-coral-text` (#b53f0e) y `--c-field-border` (#8a7d70); placeholder #587386; fuentes de 11 px → 12 px. Tabla antes → después en el cuerpo de la conversación (3,6–4,0 → 5,2–5,7; placeholder 3,47 → 4,99; borde 1,28 → 3,63). Oro y oliva no necesitaron cambio.
4. **Movimiento (#13, #14):** `HeroFicha` y `BannerCarousel` arrancan en pausa con "reducir movimiento" (`lib/useReducedMotion.js`); el banner tiene ahora botón de pausa (no tenía: era un incumplimiento real de 2.2.2); `stars-nudge` limitado a 3 repeticiones.
5. **Pestañas y diálogos (#9, #10):** hook único `lib/useModalFocus.js` (foco inicial, trampa de Tab, Esc, retorno del foco) aplicado a `Dialog`, `AdminDialog`, `ImagePicker` y `RatingStars`. Las "pestañas" del panel pasan a `<nav>` con `aria-current` o a grupos con `aria-pressed` (sin roles `tab` incompletos).
6. **Mapa y varios (#15, #18, #22b):** descripción del mapa (`aria-describedby`) y enlace "Saltar el mapa e ir a la lista de lugares"; "(se abre en una pestaña nueva)" en enlaces `_blank` y en `Button`; `<noscript>` en `index.html`.

## Estado de los hallazgos

| Estado | Hallazgos |
|---|---|
| Cerrados | #1, #2, #3, #4, #5, #6, #7, #8, #9, #10, #13, #14, #15 (parcial, ver pruebas), #18, #22b |
| Parcialmente cerrados | #11 y #22 (formularios del panel con datos: no se probaron con axe), #12 (`autocomplete` en campos de contacto del admin sin tocar) |
| Abiertos / a verificar a mano | #16 (trampa de teclado en el mapa), #19 (reflow 320 px / zoom 200 %), #17 (saltos de encabezados con datos reales), #20 (áreas táctiles, buena práctica) |

**TODO-ALT:** no se inventó ningún texto alternativo. Solo se vació el `alt` de las fotos de "Accede rápido" (`QuickAccess.jsx`) porque repetían el texto del enlace (decorativas). Queda por revisar por una persona los `alt` que escribe el administrador (`image.alt`) y los de `data/*.js`.

## Pruebas manuales pendientes

- **Teclado en el mapa (#16):** entrar con Tab al mapa, mover con flechas, acercar con `+`/`-`, y comprobar que Tab sigue y sale del mapa; probar el enlace "Saltar el mapa…" (en móvil la lista puede estar oculta hasta pulsar "Ver lista").
- **Diálogos:** abrir "Calificar", un aviso de confirmación y el selector de imágenes del panel; comprobar que Tab/Shift+Tab no se salen, que Esc cierra y que el foco vuelve al botón que lo abrió.
- **NVDA (Firefox/Chrome):** errores de login (anuncio automático), menú móvil, sugerencias del buscador, ficha del mapa, banner con pausa.
- **Reflow (#19):** 320 px de ancho y zoom 200 % y 400 % en cabecera fija, mapa, panel de filtros y formularios.
- **Contraste sobre fotos:** texto sobre Hero/PageHero/HeroFicha (depende de cada imagen).
- **Panel de administración con datos y sesión:** pasar axe (modo claro y oscuro) y revisar el contraste del tema oscuro.
- **Pendientes de contenido:** subtítulos si se añaden videos, PDFs accesibles, declaración de accesibilidad.
