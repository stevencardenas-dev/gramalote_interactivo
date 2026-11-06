#!/usr/bin/env bash
# Respaldo diario de Gramalote: base MySQL + fotos subidas (/media).
# Sin servicios de AWS: sirve igual en la EC2 y en el servidor físico.
#
# Lo ejecuta el timer de systemd que instala deploy.sh (gramalote-backup.timer)
# solo si BACKUP_ENABLED=1 en /opt/gramalote/.env. A mano funciona siempre:
#   sudo /opt/gramalote/backup.sh
# Copia fuera del servidor: deploy/backup-pull.ps1 desde el PC del administrador.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/gramalote}"
BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups}"
MEDIA_DIR="${MEDIA_DIR:-$APP_DIR/media}"
KEEP="${BACKUP_KEEP:-7}"
# Si queda menos espacio libre que esto, no se respalda: llenar el disco
# tumbaría MySQL, que es justo lo que se quiere proteger.
MIN_FREE_MB="${BACKUP_MIN_FREE_MB:-1024}"

stamp="$(date +%F-%H%M)"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
# Un respaldo a medias no debe quedarse ocupando disco.
trap 'rm -f "$BACKUP_DIR"/*.tmp' EXIT

free_mb="$(df -Pm "$BACKUP_DIR" | awk 'NR == 2 { print $4 }')"
if [ "${free_mb:-0}" -lt "$MIN_FREE_MB" ]; then
  echo "ERROR: solo hay ${free_mb} MB libres (mínimo ${MIN_FREE_MB}); no se respalda." >&2
  exit 1
fi

cd "$APP_DIR"

# Base de datos: transacción consistente, sin bloquear el sitio. La clave de
# root sale del propio contenedor; nunca se escribe en disco ni en el log.
db_file="$BACKUP_DIR/gramalote-$stamp.sql.gz"
dump_ok=1
docker compose exec -T db sh -c \
  'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers --no-tablespaces "$MYSQL_DATABASE"' \
  2>/dev/null | gzip -6 > "$db_file.tmp" || dump_ok=0
# Además del código de salida, el volcado debe terminar con su marca de cierre.
if [ "$dump_ok" = 0 ] || ! gzip -dc "$db_file.tmp" | tail -n 1 | grep -q 'Dump completed'; then
  rm -f "$db_file.tmp"
  echo "ERROR: el volcado de MySQL salió incompleto" >&2
  exit 1
fi
mv "$db_file.tmp" "$db_file"

# Fotos subidas desde el panel o importadas (WebP).
media_file="$BACKUP_DIR/media-$stamp.tar.gz"
tar -C "$(dirname "$MEDIA_DIR")" -czf - "$(basename "$MEDIA_DIR")" > "$media_file.tmp"
mv "$media_file.tmp" "$media_file"

chmod 600 "$db_file" "$media_file"

# Rotación: se conservan los $KEEP respaldos más recientes de cada tipo.
for prefix in gramalote media; do
  { ls -1t "$BACKUP_DIR"/"$prefix"-*.gz 2>/dev/null || true; } \
    | tail -n +"$((KEEP + 1))" \
    | while IFS= read -r old; do rm -f -- "$old"; done
done

echo "Respaldo OK: $(basename "$db_file") ($(du -h "$db_file" | cut -f1)), $(basename "$media_file") ($(du -h "$media_file" | cut -f1)); quedan $(ls -1 "$BACKUP_DIR" | wc -l) archivos, ${free_mb} MB libres antes."
