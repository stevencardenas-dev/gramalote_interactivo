# Plan móvil — Inicio y fichas de establecimiento

Estado: **implementado y verificado** a 500 px de ancho (el mínimo que permite
Chrome headless). El escritorio se mantiene 1:1 con el Figma a 1440 px.

## Estrategia

El Figma solo entrega frames de escritorio (1440 px). La versión móvil no es un
frame aparte: se resuelve con **una sola hoja de estilos fluida**, sin duplicar
componentes ni contenido. Cada bloque conserva el orden de lectura del Figma y
solo cambia:

1. el número de columnas de las reticulas,
2. el tamaño de los tipos y del contenedor,
3. qué elementos secundarios se ocultan o se mueven al menú.

El HTML es el mismo en todos los anchos (una columna semántica por sección), así
que no hay contenido duplicado ni variantes que se desincronicen.

## Breakpoints

| Ancho | Qué cambia |
| --- | --- |
| ≤ 1240 px | el buscador del header se estrecha a 260 px |
| ≤ 1100 px | se oculta el buscador del header; nav con menos separación; hero a 620 px; experiencias en 2 columnas con la destacada a todo el ancho |
| ≤ 900 px | header móvil: nav y “Acceder” se ocultan, aparece el botón hamburguesa y el panel; logo a 40 px; footer en columna |
| ≤ 860 px | una columna en inicio (explora, experiencias, abierto hoy), grillas a 2 columnas (accesos rápidos e información práctica); fichas: hero 560 px, info-bar a 2 columnas, oferta/productos/galería a 1 columna |
| ≤ 720 px | secciones internas de las vistas de apoyo (historia, curiosidades) |
| ≤ 520 px | hero 520 px, accesos rápidos y datos prácticos a 1 columna, info-bar a 1 columna, galería de la ficha a 1 columna, velo de las tarjetas de experiencia más fuerte |

## Inicio (`/`)

- **Header**: queda logo + hamburguesa. El panel móvil repite los enlaces de
  navegación y “Acceder”; el buscador se omite (se llega por `/buscar`).
  Padding lateral simétrico de 16 px.
- **Hero**: `min-height` 620 → 560 → 520 px; `h1` 4 rem → 2.25 rem → 1.9 rem;
  el párrafo baja a 1 rem y los dos botones siguen en fila (caben a 360 px).
- **Explora Gramalote**: pasa de 2 columnas (texto + mapa) a 1 columna con la
  foto primero (`order: -1`) y recorte 3:2.
- **Accede rápido**: 5 tarjetas → 2 columnas (la quinta queda sola, alineada a
  la izquierda) → 1 columna por debajo de 520 px; imágenes cuadradas.
- **Experiencias**: 3 columnas → 2 columnas con la destacada a todo el ancho →
  1 columna; altura mínima 340 px; se refuerza el degradado oscuro para que el
  título siga legible sobre fotos claras.
- **Abierto hoy**: 3 tarjetas → 1 columna.
- **Historia**: banner de 460 px, texto centrado y `h2` a 2 rem.
- **Información práctica**: 4 columnas → 2 → 1; iconos circulares de 108 px.
- **Footer**: columna única, navegación con `flex-wrap`, logos envueltos (44 px
  de alto) y legal a 2 líneas.

## Fichas (`/establecimiento/:slug`)

Las tres plantillas (Comer, Comprar, Dormir) comparten estructura, así que el
móvil se resuelve igual en las tres:

- **Hero**: 560 px (520 px en teléfono). El breadcrumb pasa a ocupar todo el
  ancho y se centra para que no se corte; título a 2.5 → 2.1 rem; resumen a
  0.9375 rem. Los iconos sociales y el punto activo del carrusel se mantienen
  centrados.
- **Info bar**: los 4 datos (horario, ubicación, precios, teléfono) pasan de
  fila a 2 columnas y luego a 1; el solapamiento con el hero se reduce de −89 a
  −60 y −40 px para no tapar el resumen.
- **Cabecera de sección**: el título y el párrafo van centrados con un ancho
  máximo de 60–70 caracteres.
- **Oferta (comer)**: 3 tarjetas → 1 columna con foto 4:3.
- **Productos (comprar)**: 2 × 2 → 1 columna con foto cuadrada.
- **Galería (dormir)**: 2 + 3 fotos → 1 columna (5 fotos apiladas).
- **Botón**: “Ver ubicación en el mapa” a todo el ancho disponible.
- **Relacionados**: 3 tarjetas → 1 columna.

## Cómo verificarlo

```bash
cd frontend
npm run dev
```

- 1440 px: comparar contra los PNG de
  `Nuevas vistas Figma/Gramalote Interactivo - 26 octubre/` (las fronteras de
  sección están cuadradas a ±1 px).
- 500 px: layout de teléfono (es el ancho mínimo que renderiza Chrome headless).
- 900/1100 px: comprobar que el header cambia de hamburguesa a nav sin saltos y
  que la nav no se solapa con el buscador.

`chrome --headless --window-size=390,…` **no** sirve: Chrome recorta a 500 px de
ancho de viewport y la captura sale cortada. Para 390 px reales hay que usar el
modo dispositivo de DevTools.

## Pendientes / riesgos

- Los cortes de 900 px del header están probados a 500 y 900 px; falta una
  pasada en un teléfono real (iOS Safari) para el panel móvil y el `100vh`.
- Las fotos son recortes de los PNG del Figma: en móvil el encuadre de los
  héroes (`object-position`) puede necesitar ajuste por ficha.
- El mapa de “Explora Gramalote” es una imagen; en móvil conviene un mapa real
  interactivo antes de publicar.
