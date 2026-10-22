#!/usr/bin/env bash
# Despliegue en la instancia EC2 de Gramalote.
# Lo ejecuta GitHub Actions vía AWS Systems Manager (SSM), nunca por SSH.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/gramalote}"
AWS_REGION="${AWS_REGION:-us-east-2}"
ECR_REPO="${ECR_REPO:-gramalote-frontend}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
COMPOSE_URL="${COMPOSE_URL:-}"

mkdir -p "$APP_DIR"
cd "$APP_DIR"

if [ -n "$COMPOSE_URL" ]; then
  echo "Actualizando docker-compose.yml desde el repositorio..."
  curl -fsSL "$COMPOSE_URL" -o docker-compose.yml
fi

ACCOUNT_ID="${ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}"
REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "Autenticando contra ECR ($REGISTRY)..."
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$REGISTRY" >/dev/null

export IMAGE="${REGISTRY}/${ECR_REPO}:${IMAGE_TAG}"
echo "Desplegando $IMAGE"

docker compose pull --quiet
docker compose up -d --remove-orphans

# Limpieza de imágenes viejas (conserva la que está en uso).
docker image prune -af --filter "until=168h" >/dev/null 2>&1 || true

echo "Esperando al healthcheck..."
for _ in $(seq 1 40); do
  if curl -fsS http://127.0.0.1/healthz >/dev/null 2>&1; then
    echo "Despliegue OK"
    docker compose ps
    exit 0
  fi
  sleep 2
done

echo "ERROR: el contenedor no respondió en 80s" >&2
docker compose logs --tail 80 >&2 || true
exit 1
