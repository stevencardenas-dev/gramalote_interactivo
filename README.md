# gramalote_interactivo

Plataforma web de turismo, cultura y memoria histórica de Gramalote, Norte de Santander.

## Estructura

- `frontend/` — React + Vite (ver `docs/README.md`).
- `backend/` — reservado para la API.
- `docs/` — documentación técnica y mapeo de los diseños de Figma.
- `DRIVE.md` — acceso a las entregas UX/UI en Google Drive.

## Desarrollo

```bash
cd frontend
npm install
npm run dev
```

Variables de entorno y credenciales no se versionan.

## Docker (local)

```bash
docker build -t gramalote-frontend ./frontend
docker run --rm -p 8080:80 gramalote-frontend   # http://localhost:8080
```

La imagen es multi-stage: `node:22-alpine` compila Vite y `nginx:1.27-alpine`
sirve el `dist/` con fallback de SPA, gzip, cache de assets y `/healthz`.

## Despliegue continuo (EC2)

`.github/workflows/deploy-ec2.yml` corre en cada push a `main` que toque
`frontend/`, `docker-compose.yml` o `deploy/`:

1. **build**: lint + build de la imagen y push a Amazon ECR
   (`706637772877.dkr.ecr.us-east-2.amazonaws.com/gramalote-frontend`,
   tags `sha-<commit>` y `latest`).
2. **deploy**: AWS Systems Manager (`SendCommand`) descarga `deploy/deploy.sh`
   y `docker-compose.yml` del repositorio y los ejecuta en la instancia
   `i-007da8f731134e78d`: `docker compose pull && docker compose up -d` y
   validación de `/healthz`.

No se abre SSH ni se guardan llaves: el runner usa el usuario IAM
`gramalote-gha` (secrets `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
`AWS_REGION`) con permiso solo para ECR push y SSM sobre esa instancia.
La instancia obtiene ECR y SSM por su instance profile `gramalote-ec2-ssm`.

- Sitio: <http://3.129.15.147> (la IP cambia si la instancia se detiene).
- Logs: `docker compose -f /opt/gramalote/docker-compose.yml logs -f`
- Re-desplegar sin cambiar código: *Actions → CI/CD · EC2 → Run workflow*.
