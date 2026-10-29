#!/usr/bin/env bash
# Despliegue en la instancia EC2 de Gramalote.
# Lo ejecuta GitHub Actions vía AWS Systems Manager (SSM), nunca por SSH.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/gramalote}"
AWS_REGION="${AWS_REGION:-us-east-2}"
ECR_REPO="${ECR_REPO:-gramalote-frontend}"
ECR_REPO_API="${ECR_REPO_API:-gramalote-api}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
COMPOSE_URL="${COMPOSE_URL:-}"

mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Variables del entorno (JWT, MySQL, admin). Vive solo en la instancia.
if [ -f "$APP_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$APP_DIR/.env"
  set +a
fi

if [ -n "$COMPOSE_URL" ]; then
  echo "Actualizando docker-compose.yml desde el repositorio..."
  curl -fsSL "$COMPOSE_URL" -o docker-compose.yml

  # Los .sql de MySQL solo se leen al crear el volumen; se refrescan igual
  # para que un volumen nuevo arranque con el esquema del repositorio.
  REPO_RAW="${COMPOSE_URL%/*}"
  mkdir -p "$APP_DIR/database"
  for file in schema.sql seed.sql seed-content.sql; do
    curl -fsSL "$REPO_RAW/backend/database/$file" -o "$APP_DIR/database/$file" \
      || echo "AVISO: no se pudo descargar $file"
  done
fi

ACCOUNT_ID="${ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}"
REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "Autenticando contra ECR ($REGISTRY)..."
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$REGISTRY" >/dev/null

# Carpeta de imágenes subidas desde el panel (disco local, sin S3).
# Debe existir y pertenecer al UID del proceso node (1000) del contenedor.
MEDIA_DIR="${MEDIA_DIR:-/opt/gramalote/media}"
mkdir -p "$MEDIA_DIR"
if [ -d "$MEDIA_DIR" ]; then
  chown -R 1000:1000 "$MEDIA_DIR" 2>/dev/null || echo "AVISO: no se pudo ajustar el dueño de $MEDIA_DIR"
  # nginx corre con otro UID: necesita atravesar la carpeta y leer los archivos.
  chmod -R a+rX "$MEDIA_DIR" 2>/dev/null || true
fi

export IMAGE="${REGISTRY}/${ECR_REPO}:${IMAGE_TAG}"
export API_IMAGE="${REGISTRY}/${ECR_REPO_API}:${IMAGE_TAG}"
echo "Desplegando $IMAGE y $API_IMAGE"

docker compose pull --quiet
docker compose up -d --remove-orphans

# Migraciones idempotentes (database/migrations/*.sql). La API puede tardar en
# arrancar, así que se reintenta antes de seguir con el healthcheck.
migrated=0
for _ in 1 2 3 4 5; do
  if docker compose run --rm --no-deps api node scripts/migrate.js; then
    migrated=1
    break
  fi
  sleep 4
done
[ "$migrated" = 1 ] || echo "AVISO: no se pudieron aplicar las migraciones"

# La cuenta de administración se crea o se rota desde ADMIN_* del .env.
if [ -n "${ADMIN_EMAIL:-}" ] && [ -n "${ADMIN_PASSWORD:-}" ]; then
  echo "Sembrando cuenta admin ($ADMIN_EMAIL)..."
  docker compose run --rm --no-deps -e ADMIN_EMAIL -e ADMIN_PASSWORD -e ADMIN_NAME api \
    node scripts/seed-admin.js || echo "AVISO: no se pudo sembrar la cuenta admin"
fi

# Limpieza de imágenes viejas (conserva la que está en uso).
docker image prune -af --filter "until=168h" >/dev/null 2>&1 || true

echo "Esperando al healthcheck..."
for _ in $(seq 1 60); do
  if curl -fsS http://127.0.0.1/healthz >/dev/null 2>&1; then
    if curl -fsS http://127.0.0.1/api/health >/dev/null 2>&1; then
      echo "Despliegue OK"
      docker compose ps
      exit 0
    fi
  fi
  sleep 2
done

echo "ERROR: el sitio o la API no respondieron en 120s" >&2
docker compose ps >&2 || true
docker compose logs --tail 80 >&2 || true
exit 1
