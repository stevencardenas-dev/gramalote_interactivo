# Snapshot de producción para la migración

| | |
|---|---|
| Fecha | 2026-11-14-2016 |
| Servidor | ec2-user@18.119.155.81 (/opt/gramalote) |
| Commit del repositorio al exportar | True (rama main) |
| Servicios | gramalote-web Up 21 hours (healthy) ; gramalote-api Up 21 hours (healthy) ; gramalote-db Up 4 days (healthy) |

## Base de datos

- Volcado completo (esquema + datos): gramalote-2026-11-14-2016.sql.gz — 0.1 MB.
  - sha256: d800998321fa5f79661f031aba1e7f402cc0ec5ae74746bc773aa2999022f3ca
  - Verificado: el volcado cierra con «Dump completed».
- Solo estructura: esquema-2026-11-14-2016.sql — 0.1 MB.
- conteos.tsv — filas por tabla (54 tablas), para comprobar la importación.

## Archivos

- media/ — 561 archivos, 58.8 MB. Fotos y variantes subidas desde el panel.
- tiles/ — 1 archivo(s) — 49.7 MB.

## Cómo se restaura

Ver docs/MIGRACION-DEBIAN.md. Resumen: crear el .env, levantar solo la base,
importar el volcado, copiar media/ a /srv/gramalote/media, los .pmtiles a
/srv/gramalote/tiles y levantar el resto del stack.
