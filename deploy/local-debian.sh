#!/usr/bin/env bash
# Levanta Gramalote completo (nginx + API + MySQL) en una máquina Debian/Ubuntu
# para verlo desde otra máquina de la red (por ejemplo Windows), sin SSH ni AWS.
#
# Reconstruye el sitio con el snapshot más reciente de migracion/: base de datos
# real, fotos y mapa PMTiles. El stack es el mismo docker-compose.yml de
# producción, con docker-compose.debian.yml encima para compilar las imágenes en
# vez de descargarlas de ECR.
#
# Uso:
#   sudo bash deploy/local-debian.sh
#   PORT=8080 ADMIN_PASSWORD='una-clave-larga' sudo -E bash deploy/local-debian.sh
#
# Es idempotente: si ya está levantado, vuelve a compilar y a arrancar sin tocar
# la base ni las fotos.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"

log() { printf '\n==> %s\n' "$*"; }
warn() { printf '\nAVISO: %s\n' "$*" >&2; }

if [ "$(id -u)" -ne 0 ]; then
  echo "Ejecútalo como root:  sudo bash deploy/local-debian.sh" >&2
  exit 1
fi

# --- Docker ----------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  log "Instalando Docker (get.docker.com)"
  apt-get update
  apt-get install -y ca-certificates curl git
  curl -fsSL https://get.docker.com | sh
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "Falta el plugin 'docker compose' (v2). Instálalo con: apt install docker-compose-plugin" >&2
  exit 1
fi
systemctl enable --now docker >/dev/null 2>&1 || true

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
fi

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.debian.yml)

# --- Snapshot (base de datos, fotos, mapa) ---------------------------------
SNAP="$(find migracion -mindepth 1 -maxdepth 1 -type d | sort | tail -n1)"
DUMP="$(find "${SNAP:-migracion}" -mindepth 1 -maxdepth 1 -name 'gramalote-*.sql.gz' | sort | tail -n1)"
if [ -z "${SNAP:-}" ] || [ -z "${DUMP:-}" ]; then
  echo "No hay snapshot en migracion/ (se esperaba migracion/<fecha>/gramalote-*.sql.gz)." >&2
  exit 1
fi
log "Snapshot: $SNAP"

install -d -m 755 "$MEDIA_DIR" "$TILES_DIR"

if [ -z "$(ls -A "$MEDIA_DIR" 2>/dev/null || true)" ]; then
  log "Copiando fotos a $MEDIA_DIR"
  cp -a "$SNAP"/media/. "$MEDIA_DIR"/
else
  log "Fotos ya presentes en $MEDIA_DIR (se conservan)"
fi

if compgen -G "$SNAP/tiles/*.pmtiles" >/dev/null; then
  cp -an "$SNAP"/tiles/*.pmtiles "$TILES_DIR"/ 2>/dev/null || true
  log "Mapa PMTiles en $TILES_DIR"
else
  warn "El snapshot no trae .pmtiles: el mapa saldrá vacío"
fi

# La API (uid 1000) escribe aquí cuando se sube una foto desde el panel; nginx
# solo necesita leer.
chown -R 1000:1000 "$MEDIA_DIR"
chmod -R a+rX "$MEDIA_DIR" "$TILES_DIR"

# --- Base de datos ---------------------------------------------------------
log "Levantando MySQL"
"${COMPOSE[@]}" up -d db
for _ in $(seq 1 90); do
  status="$(docker inspect -f '{{.State.Health.Status}}' gramalote-db 2>/dev/null || echo none)"
  [ "$status" = healthy ] && break
  sleep 2
done
if [ "$status" != healthy ]; then
  echo "MySQL no llegó a 'healthy'. Revisa: docker compose logs db" >&2
  exit 1
fi

rows="$("${COMPOSE[@]}" exec -T db sh -c \
  'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -N -B "$MYSQL_DATABASE" -e "SELECT COUNT(*) FROM establishments"' \
  2>/dev/null | tr -dc '0-9' || true)"

if [ "${rows:-0}" -gt 0 ]; then
  log "La base ya tiene datos (${rows} establecimientos): no se reimporta"
else
  log "Importando $(basename "$DUMP")"
  gunzip -c "$DUMP" | "${COMPOSE[@]}" exec -T db sh -c \
    'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
fi

# --- Imágenes y arranque ---------------------------------------------------
log "Compilando imágenes (la primera vez tarda varios minutos)"
"${COMPOSE[@]}" build

log "Levantando web + api"
"${COMPOSE[@]}" up -d --remove-orphans

log "Migraciones"
"${COMPOSE[@]}" exec -T api node scripts/migrate.js \
  || warn "no se pudieron aplicar las migraciones"

log "Cuenta de administración"
"${COMPOSE[@]}" exec -T \
  -e ADMIN_EMAIL="${ADMIN_EMAIL:-}" \
  -e ADMIN_PASSWORD="${ADMIN_PASSWORD:-}" \
  -e ADMIN_NAME="${ADMIN_NAME:-Administrador}" \
  api node scripts/seed-admin.js \
  || warn "no se pudo sembrar la cuenta admin"

# --- Firewall y comprobación ----------------------------------------------
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q 'Status: active'; then
  ufw allow "${PORT}/tcp" >/dev/null || true
  log "ufw: puerto ${PORT} abierto"
fi

log "Esperando /healthz y /api/health"
ok=0
for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:${PORT}/healthz" >/dev/null 2>&1 \
    && curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 2
done

if [ "$ok" != 1 ]; then
  "${COMPOSE[@]}" ps >&2 || true
  "${COMPOSE[@]}" logs --tail 60 >&2 || true
  echo "El sitio o la API no respondieron en 120 s." >&2
  exit 1
fi

"${COMPOSE[@]}" ps
cat <<EOF

Listo. Sitio reconstruido con el snapshot del $(basename "$SNAP").

  Sitio:  ${BASE_URL}/
  Panel:  ${BASE_URL}/acceder
  API:    ${BASE_URL}/api/health
  Admin:  ${ADMIN_EMAIL:-admin@gramalote.example}  (contraseña en .env)

Desde Windows abre esa misma URL (misma red; si es una VM en NAT, cambia el
adaptador a puente o reenvía el puerto ${PORT}).

Para volver a levantarlo tras cambiar código:
  docker compose -f docker-compose.yml -f docker-compose.debian.yml up -d --build
Detener:  docker compose -f docker-compose.yml -f docker-compose.debian.yml down
EOF
