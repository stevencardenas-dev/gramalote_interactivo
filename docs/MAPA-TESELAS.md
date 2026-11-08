# Mapa con teselas propias (PMTiles)

El mapa **no depende de ningún servidor externo**: un archivo `.pmtiles` con los
datos de OpenStreetMap de Norte de Santander (vectorial, hasta zoom 15) lo sirve
el mismo nginx del sitio, y el navegador lo lee por rangos HTTP.

| Pieza | Dónde |
|---|---|
| Estilo y registro del protocolo | `frontend/src/lib/mapStyle.js` |
| Archivo del mapa (no va en Git) | `/opt/gramalote/tiles/norte-de-santander.pmtiles` → `/tiles/` en nginx |
| Tipografías y sprites (sí van en Git) | `frontend/public/map-assets/` |
| Generador | `deploy/tiles/build-tiles.sh` |
| Variable | `VITE_MAP_PMTILES_URL` (por defecto `/tiles/norte-de-santander.pmtiles`) |

## Generar o refrescar el mapa

1. Instalar la CLI `pmtiles` (https://github.com/protomaps/go-pmtiles/releases).
2. `deploy/tiles/build-tiles.sh` (acepta una fecha `AAAAMMDD` del build y las
   variables `BBOX`, `MAXZOOM`, `OUT`). Descarga unos cientos de MB, no el planeta.
3. La primera vez copia tipografías y sprites a `frontend/public/map-assets/`:
   versionarlos en Git.
4. En el servidor, el volumen es `${TILES_DIR:-/opt/gramalote/tiles}`
   (docker-compose.yml). Basta con dejar el archivo ahí; no hace falta reconstruir
   la imagen. Para actualizar: reemplazar el archivo (el script ya lo hace con
   `mv` atómico).

Refrescar 1–2 veces al año es suficiente. Para otra región, cambiar `BBOX` (y los
límites `NORTE_DE_SANTANDER_BOUNDS` de `LiveMap.jsx`).

## Desarrollo local

Dejar el archivo en `frontend/public/tiles/norte-de-santander.pmtiles` (ignorado por
Git y Docker). Vite lo sirve con soporte de Range.

## Licencias

| Componente | Licencia | Obligación |
|---|---|---|
| Datos (OpenStreetMap, vía build de Protomaps) | ODbL 1.0 | Atribución visible "© OpenStreetMap contributors" (ya en el mapa). El `.pmtiles` sigue bajo ODbL: no mezclar datos propios cerrados dentro. |
| Tipografías Noto Sans (`map-assets/fonts`) | SIL OFL 1.1 | Conservar `OFL.txt`. |
| Sprites (`map-assets/sprites`) | MIT (derivados de tangrams/icons) | Conservar el aviso. |
| MapLibre, pmtiles, @protomaps/basemaps, go-pmtiles | BSD-3-Clause | Conservar avisos (ya en `node_modules`). |

No quitar la atribución del mapa. El build público de Protomaps se usa solo para
extraer la región (1–2 veces al año), nunca en producción.

## Cosas a saber

- **Sin conexión:** el service worker ya no guarda teselas (las peticiones por
  rango `206` no se pueden meter en Cache API). El navegador usa su caché HTTP
  (24 h). Si se necesita mapa 100 % offline, el siguiente paso es cachear el
  archivo completo en el SW.
- **Licencia:** datos © OpenStreetMap contributors (ODbL), atribución visible en
  el mapa. Tipografías y sprites: Protomaps basemaps-assets.
- Si el archivo falta, el mapa se ve vacío (los marcadores siguen funcionando);
  revisar `docker compose exec web ls -lh /srv/tiles`.
