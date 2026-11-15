# `migracion/` — snapshots de producción

Cada carpeta es una copia del estado real del sitio en la EC2, generada con
`deploy/migracion-exportar.ps1`. Sirve para reconstruir el proyecto en otro
servidor cuando lo único disponible es este repositorio.

| Archivo | Qué es |
|---|---|
| `MANIFIESTO.md` | Fecha, commit, tamaños, `sha256` del volcado y conteos de verificación. |
| `gramalote-<fecha>.sql.gz` | Volcado completo de MySQL: esquema **y** datos. |
| `esquema-<fecha>.sql` | Solo la estructura, legible, para revisar o comparar. |
| `conteos.tsv` | Filas por tabla; se compara después de importar. |
| `archivos-media.tsv` | Inventario de `media/` (tamaño y ruta relativa). |
| `media/` | Fotos y variantes subidas desde el panel. |
| `tiles/` | Mapa PMTiles del Norte de Santander. |

Cómo se restaura: [`docs/MIGRACION-DEBIAN.md`](../docs/MIGRACION-DEBIAN.md).

> ⚠️ Estas carpetas contienen datos personales reales (correos, sugerencias,
> comentarios). El repositorio tiene que ser privado, y los secretos
> (`.env`, contraseñas) **nunca** se guardan aquí: van a un gestor de contraseñas.
