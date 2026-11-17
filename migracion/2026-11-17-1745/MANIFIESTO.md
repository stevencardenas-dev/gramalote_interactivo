# Snapshot de producción para la migración

| | |
|---|---|
| Fecha | 2026-11-17-1745 |
| Servidor | ec2-user@18.119.155.81 (/opt/gramalote) |
| Commit del repositorio al exportar | True (rama main) |
| Servicios | gramalote-web Up 6 minutes (healthy) ; gramalote-api Up 7 minutes (healthy) ; gramalote-db Up 7 days (healthy) |

## Base de datos

- Volcado completo (esquema + datos): gramalote-2026-11-17-1745.sql.gz — 0.1 MB.
  - sha256: 076c313e4960591ba8b3c2720864c961dc79db2f469b564bcb0d60e9968acc72
  - Verificado: el volcado cierra con «Dump completed».
- Solo estructura: esquema-2026-11-17-1745.sql — 0.1 MB.
- conteos.tsv — filas por tabla (56 tablas), para comprobar la importación.

## Archivos

- media/ — 561 archivos, 58.8 MB. Fotos y variantes subidas desde el panel.
- tiles/ — 1 archivo(s) — 49.7 MB.

## Cómo se restaura

Ver docs/MIGRACION-DEBIAN.md. Resumen: crear el .env, levantar solo la base,
importar el volcado, copiar media/ a /srv/gramalote/media, los .pmtiles a
/srv/gramalote/tiles y levantar el resto del stack.
