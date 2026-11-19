// Ruta del archivo vectorial del mapa. nginx lo sirve desde /srv/tiles (ver
// nginx.conf y docs/MAPA-TESELAS.md): no viene en el repositorio.
export const MAP_TILES_PATH =
  import.meta.env.VITE_MAP_PMTILES_URL || '/tiles/norte-de-santander.pmtiles'
