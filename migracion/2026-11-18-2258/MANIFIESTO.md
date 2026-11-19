# Snapshot de producción para la migración

| | |
|---|---|
| Fecha | 2026-11-18-2258 |
| Servidor | ec2-user@18.119.155.81 (/opt/gramalote) |
| Commit del repositorio al exportar | 3b0cc16 (rama main) |
| Servicios | gramalote-web Up 10 minutes (healthy) ; gramalote-api Up 10 minutes (healthy) ; gramalote-db Up 25 hours (healthy) |

## Base de datos

- Volcado completo (esquema + datos): gramalote-2026-11-18-2258.sql.gz — 0.1 MB.
  - sha256: 9d273ef5fe6137e3e55cff952bb3dbca37ae07720123286821d8d65a8a9278a3
  - Verificado: el volcado cierra con «Dump completed».
- Solo estructura: esquema-2026-11-18-2258.sql — 0.1 MB.
- conteos.tsv — filas por tabla (56 tablas), para comprobar la importación.

## Archivos

- media/ — 577 archivos, 60.2 MB. Fotos y variantes subidas desde el panel.
- tiles/ — 1 archivo(s) — 49.7 MB.

## Cómo se restaura

Ver docs/MIGRACION-DEBIAN.md. Resumen: crear el .env, levantar solo la base,
importar el volcado, copiar media/ a /srv/gramalote/media, los .pmtiles a
/srv/gramalote/tiles y levantar el resto del stack.
