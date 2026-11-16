#!/usr/bin/env bash
# Levanta el sitio completo de Gramalote (nginx + API + MySQL) en esta máquina
# Debian/Ubuntu con los datos reales de la EC2: base de datos, usuarios del
# panel, fotos y mapa. Pensado para verse desde otra máquina de la red, sin SSH
# ni AWS, sin CDN y sin certificado (HTTP plano).
#
# El stack es el mismo docker-compose.yml de producción, con
# docker-compose.debian.yml encima para compilar las imágenes en vez de
# descargarlas de ECR.
#
# Uso:
#   sudo bash deploy/levantar-debian.sh
#   PORT=8080 sudo -E bash deploy/levantar-debian.sh
#   sudo bash deploy/levantar-debian.sh --forzar-datos     # reimporta el volcado
#   sudo bash deploy/levantar-debian.sh --ayuda
#
# Es idempotente y repetible: cada ejecución deja la base igual al snapshot más
# reciente de migracion/ (comparando el sha256 ya importado), copia las fotos y
# el mapa que falten o hayan cambiado y vuelve a levantar el stack. Si el
# snapshot no cambió, no toca los datos: solo recompila y arranca.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"

log() { printf '\n==> %s\n' "$*"; }
warn() { printf '\nAVISO: %s\n' "$*" >&2; }
die() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

FORZAR_DATOS=0
SIN_FOTOS=0
ROTAR_ADMIN="${ROTAR_ADMIN:-0}"

for arg in "$@"; do
  case "$arg" in
    --forzar-datos) FORZAR_DATOS=1 ;;
    --sin-fotos) SIN_FOTOS=1 ;;
    --rotar-admin) ROTAR_ADMIN=1 ;;
    --ayuda|-h|--help)
      sed -n '2,28p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) die "opción desconocida: $arg (usa --ayuda)" ;;
  esac
done

if [ "$(id -u)" -ne 0 ]; then
  die "Ejecútalo como root:  sudo bash deploy/levantar-debian.sh"
fi

# --- Docker ----------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  log "Instalando Docker (get.docker.com)"
  apt-get update
  apt-get install -y ca-certificates curl git
  curl -fsSL https://get.docker.com | sh
fi
if ! docker compose version >/dev/null 2>&1; then
  die "Falta el plugin 'docker compose' (v2). Instálalo con: apt install docker-compose-plugin"
fi
systemctl enable --now docker >/dev/null 2>&1 || true

# --- Snapshot de la EC2 ----------------------------------------------------
# Se usa el más reciente de migracion/ salvo que se indique otro con SNAPSHOT.
if [ -n "${SNAPSHOT:-}" ]; then
  SNAP="$SNAPSHOT"
else
  SNAP="$(find migracion -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort | tail -n1 || true)"
fi
[ -n "${SNAP:-}" ] || die "No hay snapshots en migracion/. Expórtalos con: pwsh -File deploy/migracion-exportar.ps1"
DUMP="$(find "$SNAP" -mindepth 1 -maxdepth 1 -name 'gramalote-*.sql.gz' | sort | tail -n1 || true)"
[ -n "${DUMP:-}" ] || die "El snapshot $SNAP no trae gramalote-*.sql.gz"
SNAP="$(cd "$SNAP" && pwd)"
DUMP_SHA="$(sha256sum "$DUMP" | awk '{print $1}')"
log "Snapshot: $(basename "$SNAP")"
printf '    volcado: %s (%s, sha256 %s…)\n' \
  "$(basename "$DUMP")" "$(du -h "$DUMP" | cut -f1)" "${DUMP_SHA:0:12}"

# --- Configuración ---------------------------------------------------------
# Si ya hay .env se reutiliza tal cual (no se rotan secretos ni claves).
if [ -f .env ]; then
  log "Reutilizando .env existente"
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

PORT="${PORT:-8080}"
MEDIA_DIR="${MEDIA_DIR:-/srv/gramalote/media}"
TILES_DIR="${TILES_DIR:-/srv/gramalote/tiles}"
ESTADO_DIR="${ESTADO_DIR:-/srv/gramalote}"
export MEDIA_DIR TILES_DIR

IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
BASE_URL="http://${IP:-localhost}:${PORT}"

if [ ! -f .env ]; then
  log "Creando .env local con secretos nuevos"
  ADMIN_PASSWORD="${ADMIN_PASSWORD:-$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-16)}"
  umask 077
  cat > .env <<EOF
MYSQL_ROOT_PASSWORD=$(openssl rand -hex 16)
MYSQL_DATABASE=gramalote
MYSQL_USER=gramalote
MYSQL_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
AUTH_ACCESS_TTL=30m
AUTH_REFRESH_TTL_DAYS=7
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@gramalote.example}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_NAME=Administrador
CORS_ORIGIN=${BASE_URL}
PUBLIC_SITE_URL=${BASE_URL}
TRUST_PROXY=1
MEDIA_DIR=${MEDIA_DIR}
TILES_DIR=${TILES_DIR}
EOF
  chmod 600 .env
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
else
  # El .env viejo puede venir sin MEDIA_DIR/TILES_DIR (compose caería en
  # /opt/gramalote): se completan sin tocar el resto.
  faltan=""
  grep -q '^MEDIA_DIR=' .env || faltan="$faltan MEDIA_DIR=${MEDIA_DIR}"
  grep -q '^TILES_DIR=' .env || faltan="$faltan TILES_DIR=${TILES_DIR}"
  if [ -n "$faltan" ]; then
    log "Completando .env:$faltan"
    # shellcheck disable=SC2086
    printf '%s\n' $faltan >> .env
    export MEDIA_DIR TILES_DIR
  fi
  if [ "${CORS_ORIGIN:-}" != "$BASE_URL" ]; then
    warn "CORS_ORIGIN=${CORS_ORIGIN:-} y la IP actual es $BASE_URL.
  Si abres el panel por otra dirección, cambia CORS_ORIGIN y PUBLIC_SITE_URL
  en .env y vuelve a ejecutar este script."
  fi
fi

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.debian.yml)

# Consultas dentro del contenedor: la clave de root sale de su entorno y no
# viaja en la línea de comandos del host.
mysql_root() {
  "${COMPOSE[@]}" exec -T db sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$@"' sh "$@"
}

# --- Fotos y mapa ----------------------------------------------------------
install -d -m 755 "$MEDIA_DIR" "$TILES_DIR" "$ESTADO_DIR"
mkdir -p "$ESTADO_DIR/respaldos"

if [ "$SIN_FOTOS" = 1 ]; then
  log "Fotos y mapa: se omiten (--sin-fotos)"
else
  if [ -d "$SNAP/media" ] && [ -n "$(ls -A "$SNAP/media" 2>/dev/null || true)" ]; then
    copiadas="$(find "$SNAP/media" -type f | wc -l)"
    log "Sincronizando $copiadas fotos a $MEDIA_DIR"
    # cp -a sobrescribe los mismos nombres y conserva lo subido desde el panel.
    cp -a "$SNAP"/media/. "$MEDIA_DIR"/
  else
    warn "El snapshot no trae media/: las fichas se verán sin fotos"
  fi

  if compgen -G "$SNAP/tiles/*.pmtiles" >/dev/null; then
    cp -a "$SNAP"/tiles/*.pmtiles "$TILES_DIR"/
    log "Mapa PMTiles en $TILES_DIR"
  else
    warn "El snapshot no trae .pmtiles: el mapa saldrá vacío"
  fi

  # La API (uid 1000) escribe aquí cuando se sube una foto desde el panel; nginx
  # solo necesita leer.
  chown -R 1000:1000 "$MEDIA_DIR"
  chmod -R a+rX "$MEDIA_DIR" "$TILES_DIR"
  printf '    fotos en disco: %s archivos\n' "$(find "$MEDIA_DIR" -type f | wc -l)"
fi

# --- Base de datos ---------------------------------------------------------
log "Levantando MySQL"
"${COMPOSE[@]}" up -d db
status=none
for _ in $(seq 1 90); do
  status="$(docker inspect -f '{{.State.Health.Status}}' gramalote-db 2>/dev/null || echo none)"
  [ "$status" = healthy ] && break
  sleep 2
done
[ "$status" = healthy ] || die "MySQL no llegó a 'healthy'. Revisa: docker compose logs db"

MARCADOR="$ESTADO_DIR/estado-snapshot"
IMPORTADO="$(awk 'NR==1 {print $1}' "$MARCADOR" 2>/dev/null || true)"

# Se restaura cuando el snapshot es otro (o cuando se pide a propósito). Antes
# de pisar datos existentes se guarda un respaldo por si algo sale mal.
if [ "$IMPORTADO" = "$DUMP_SHA" ] && [ "$FORZAR_DATOS" = 0 ]; then
  log "Los datos de este snapshot ya están importados: no se reimporta"
    printf '    (usa --forzar-datos para volver a cargarlos desde cero)\n'
else
  if [ "$FORZAR_DATOS" = 1 ] && [ "$IMPORTADO" = "$DUMP_SHA" ]; then
    log "Restauración forzada de $(basename "$DUMP")"
  fi

  tablas="$(mysql_root "$MYSQL_DATABASE" -N -B -e \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()" 2>/dev/null | tr -dc '0-9' || true)"
  if [ "${tablas:-0}" -gt 0 ]; then
    respaldo="$ESTADO_DIR/respaldos/pre-restauracion-$(date +%Y%m%d-%H%M%S).sql.gz"
    log "Respaldando la base actual en $(basename "$respaldo")"
    "${COMPOSE[@]}" exec -T db sh -c \
      'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --quick --routines --triggers --no-tablespaces --default-character-set=utf8mb4 --hex-blob "$MYSQL_DATABASE"' \
      | gzip -c > "$respaldo"
    # Solo se conservan los 3 respaldos más recientes.
    ls -1t "$ESTADO_DIR"/respaldos/pre-restauracion-*.sql.gz 2>/dev/null \
      | tail -n +4 | xargs -r rm -f
  fi

  log "Importando $(basename "$DUMP")"
  # mysqldump envuelve los triggers en comentarios de versión y deja dentro el
  # `;` final del cuerpo; MySQL corta ahí la sentencia y falla con
  # «syntax error ... near ' */'». Se quita ese punto y coma sobrante, que solo
  # aparece justo antes del cierre de un bloque de trigger.
  gunzip -c "$DUMP" \
    | sed 's/; \*\/;;$/ *\/;;/' \
    | "${COMPOSE[@]}" exec -T db sh -c \
      'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
  # La primera línea es solo el sha256: es lo que se compara en la próxima
  # ejecución. El resto es informativo.
  printf '%s\nimportado %s\norigen %s/%s\n' \
    "$DUMP_SHA" "$(date -Is)" "$(basename "$SNAP")" "$(basename "$DUMP")" > "$MARCADOR"
  IMPORTADO="$DUMP_SHA"

  # La API tiene conexiones abiertas contra las tablas que se acaban de
  # recrear: se reinicia para que tome el esquema nuevo.
  "${COMPOSE[@]}" restart api >/dev/null 2>&1 || true
fi

# Verificación contra conteos.tsv: es la prueba de que la base quedó igual.
if [ -f "$SNAP/conteos.tsv" ]; then
  log "Comprobando filas por tabla contra conteos.tsv"
  diferencias=0
  while IFS=$'\t' read -r tabla esperado <&3; do
    [ -n "${tabla:-}" ] || continue
    esperado="${esperado//$'\r'/}"
    actual="$(mysql_root "$MYSQL_DATABASE" -N -B -e "SELECT COUNT(*) FROM \`$tabla\`" 2>/dev/null | tr -dc '0-9' || true)"
    if [ "${actual:-0}" != "$esperado" ]; then
      printf '    %-38s snapshot %s · ahora %s\n' "$tabla" "$esperado" "${actual:-0}"
      diferencias=$((diferencias + 1))
    fi
  done 3< "$SNAP/conteos.tsv"
  if [ "$diferencias" -eq 0 ]; then
    printf '    todas las tablas coinciden con el snapshot\n'
  else
    warn "$diferencias tabla(s) no coinciden. Si el sitio se usó después del
  snapshot es normal (auditoría, calificaciones); si no, vuelve a ejecutar con
  --forzar-datos."
  fi
fi

# --- Imágenes y arranque ---------------------------------------------------
log "Compilando imágenes (la primera vez tarda varios minutos)"
"${COMPOSE[@]}" build

log "Levantando web + api"
"${COMPOSE[@]}" up -d --remove-orphans

log "Migraciones"
"${COMPOSE[@]}" exec -T api node scripts/migrate.js \
  || warn "no se pudieron aplicar las migraciones"

# Los usuarios vienen del volcado de la EC2 con sus propias contraseñas: no se
# tocan. Solo se siembra la cuenta si la tabla quedó vacía (o con --rotar-admin).
admin_count="$(mysql_root "$MYSQL_DATABASE" -N -B -e 'SELECT COUNT(*) FROM admin_users' 2>/dev/null | tr -dc '0-9' || true)"
if [ "$ROTAR_ADMIN" = 1 ] || [ "${admin_count:-0}" -eq 0 ]; then
  log "Cuenta de administración"
  "${COMPOSE[@]}" exec -T \
    -e ADMIN_EMAIL="${ADMIN_EMAIL:-}" \
    -e ADMIN_PASSWORD="${ADMIN_PASSWORD:-}" \
    -e ADMIN_NAME="${ADMIN_NAME:-Administrador}" \
    api node scripts/seed-admin.js \
    || warn "no se pudo sembrar la cuenta admin"
else
  log "Usuarios: se conservan los ${admin_count} de la EC2 (mismas contraseñas)"
  printf '    para rotar la del .env:  sudo bash deploy/levantar-debian.sh --rotar-admin\n'
fi

# --- Firewall y comprobación ----------------------------------------------
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q 'Status: active'; then
  ufw allow "${PORT}/tcp" >/dev/null || true
  log "ufw: puerto ${PORT} abierto"
fi

log "Esperando /healthz y /api/health"
ok=0
for _ in $(seq 1 60); do
  if curl -fsS --max-time 5 "http://127.0.0.1:${PORT}/healthz" >/dev/null 2>&1 \
    && curl -fsS --max-time 5 "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 2
done

if [ "$ok" != 1 ]; then
  "${COMPOSE[@]}" ps >&2 || true
  "${COMPOSE[@]}" logs --tail 60 >&2 || true
  die "El sitio o la API no respondieron en 120 s."
fi

# Una foto real del disco sirve para comprobar que nginx y la base apuntan al
# mismo archivo (el síntoma de "faltan las imágenes").
foto="$(find "$MEDIA_DIR" -type f \( -name '*.webp' -o -name '*.jpg' -o -name '*.png' \) | head -n1 || true)"
if [ -n "$foto" ]; then
  url="/media/${foto#"$MEDIA_DIR"/}"
  codigo="$(curl -sS --max-time 10 -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}${url}" || true)"
  if [ "$codigo" = 200 ]; then
    printf 'Fotos: /media responde 200 (%s)\n' "$url"
  else
    warn "/media${url} respondió ${codigo}: revisa MEDIA_DIR y los permisos"
  fi
fi

"${COMPOSE[@]}" ps
cat <<EOF

Listo. Sitio reconstruido con el snapshot del $(basename "$SNAP").

  Sitio:  ${BASE_URL}/
  Panel:  ${BASE_URL}/acceder
  API:    ${BASE_URL}/api/health
  Datos:  ${admin_count:-0} usuario(s) del panel, $(find "$MEDIA_DIR" -type f 2>/dev/null | wc -l) foto(s)

Las contraseñas del panel son las de la EC2 (el .env solo manda si la tabla
estaba vacía o si usas --rotar-admin).

Para volver a levantarlo tras cambiar código:
  docker compose -f docker-compose.yml -f docker-compose.debian.yml up -d --build
Detener:  docker compose -f docker-compose.yml -f docker-compose.debian.yml down
EOF
