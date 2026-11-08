#!/usr/bin/env bash
# Genera el mapa propio de Norte de Santander (PMTiles) y descarga las
# tipografías/sprites del mapa. Se ejecuta UNA vez, o cuando se quiera refrescar.
#
#   deploy/tiles/build-tiles.sh [AAAAMMDD]
#
# Necesita: curl, tar y la CLI `pmtiles` (https://github.com/protomaps/go-pmtiles/releases).
# El extracto lee solo los rangos necesarios del build público de Protomaps
# (~140 GB en total); lo que se baja son unos cientos de MB.
set -euo pipefail

BBOX="${BBOX:--73.7,6.9,-72.0,9.3}"     # oeste,sur,este,norte (Norte de Santander)
MAXZOOM="${MAXZOOM:-15}"
OUT="${OUT:-/opt/gramalote/tiles/norte-de-santander.pmtiles}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ASSETS="$ROOT/frontend/public/map-assets"

command -v pmtiles >/dev/null || { echo "Falta la CLI pmtiles (ver cabecera del script)"; exit 1; }

DATE="${1:-$(date -u -d 'yesterday' +%Y%m%d)}"
mkdir -p "$(dirname "$OUT")"
echo "Extrayendo $BBOX hasta z$MAXZOOM del build $DATE -> $OUT"
pmtiles extract "https://build.protomaps.com/$DATE.pmtiles" "$OUT.tmp" --bbox="$BBOX" --maxzoom="$MAXZOOM"
mv "$OUT.tmp" "$OUT"
pmtiles show "$OUT" | head -20

# Tipografías y sprites (Protomaps basemaps-assets, licencia abierta).
if [ ! -d "$ASSETS/fonts" ]; then
  tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
  curl -fsSL https://github.com/protomaps/basemaps-assets/archive/refs/heads/main.tar.gz | tar -xz -C "$tmp"
  mkdir -p "$ASSETS"
  mkdir -p "$ASSETS/fonts"
  for f in "Noto Sans Regular" "Noto Sans Medium" "Noto Sans Italic"; do cp -r "$tmp/basemaps-assets-main/fonts/$f" "$ASSETS/fonts/"; done
  cp "$tmp/basemaps-assets-main/fonts/OFL.txt" "$ASSETS/fonts/"
  mkdir -p "$ASSETS/sprites"
  cp -r "$tmp/basemaps-assets-main/sprites/v4" "$ASSETS/sprites/"
  echo "Tipografías y sprites copiados a $ASSETS (versionarlos en Git)."
fi
