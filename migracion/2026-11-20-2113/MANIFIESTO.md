# Snapshot de producción para la migración

| | |
|---|---|
| Fecha | 2026-11-20-2113 |
| Servidor | ec2-user@18.119.155.81 (/opt/gramalote) |
| Commit del repositorio al exportar | b4fcd2f (rama main) |
| Servicios | gramalote-web Up 7 hours (healthy) ; gramalote-api Up 7 hours (healthy) ; gramalote-db Up 27 hours (healthy) |

## Base de datos

- Volcado completo (esquema + datos): gramalote-2026-11-20-2113.sql.gz — 0.1 MB.
  - sha256: 0855c7f96c0f34f04325191899469886e55b478dce68ee0ec3a7e9515a1527a9
  - Verificado: el volcado cierra con «Dump completed».
- Solo estructura: esquema-2026-11-20-2113.sql — 0.1 MB.
- conteos.tsv — filas por tabla (56 tablas), para comprobar la importación.

## Archivos

- media/ — 617 archivos, 71 MB. Fotos y variantes subidas desde el panel.
- tiles/ — 1 archivo(s) — 49.7 MB.

## Cómo se restaura

Ver docs/MIGRACION-DEBIAN.md. Resumen: crear el .env, levantar solo la base,
importar el volcado, copiar media/ a /srv/gramalote/media, los .pmtiles a
/srv/gramalote/tiles y levantar el resto del stack.
