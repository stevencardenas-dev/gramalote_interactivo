# gramalote_interactivo

Plataforma web de turismo, cultura y memoria histórica de Gramalote, Norte de Santander.

## Estructura

- `frontend/` — React + Vite (ver `docs/README.md`).
- `backend/` — API Express y base de datos MySQL (ver `backend/README.md`).
- `docs/` — documentación técnica y mapeo de los diseños de Figma.
- `DRIVE.md` — acceso a las entregas UX/UI en Google Drive.

## Desarrollo

```bash
cd frontend
npm install
npm run dev
```

API y MySQL local:

```bash
cd backend
Copy-Item .env.example .env
docker compose up -d
npm install
npm run dev
```

- Frontend: <http://localhost:5173>
- API: <http://127.0.0.1:4000/api>
- MySQL: `127.0.0.1:3307`

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
   validación de `/healthz`. Al terminar invalida el caché de CloudFront.

No se abre SSH ni se guardan llaves: el runner usa el usuario IAM
`gramalote-gha` (secrets `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
`AWS_REGION`) con permiso solo para ECR push, SSM sobre esa instancia e
invalidaciones de CloudFront. La instancia obtiene ECR y SSM por su instance
profile `gramalote-ec2-ssm`.

## CloudFront

| Dato | Valor |
|---|---|
| Distribución | `E1P9GLTGDGI4RL` |
| URL HTTPS | <https://d2nm90ise1l8de.cloudfront.net> |
| Origen | `ec2-18-119-155-81.us-east-2.compute.amazonaws.com` (HTTP 80) |
| Elastic IP | `18.119.155.81` (`eipalloc-046be16735887ac52`) |

- **HTTPS gratis** con el certificado `*.cloudfront.net`; HTTP redirige a HTTPS
  y se envía HSTS.
- **Caché**: `/assets/*` → `CachingOptimized` (archivos con hash, 1 año);
  el resto → `CachingDisabled` (el `index.html` siempre se pide al origen, así
  un despliegue se ve de inmediato). El pipeline invalida `/*` igualmente.
- El Security Group solo permite el puerto 80 desde el prefix list
  `com.amazonaws.global.cloudfront.origin-facing` (`pl-b6a144df`), así que la
  instancia no es accesible directamente desde internet.
- Precio: capa gratuita permanente de CloudFront (1 TB/mes + 10 M peticiones).

- Sitio: <https://d2nm90ise1l8de.cloudfront.net>
- Origen directo (solo desde tu IP): <http://18.119.155.81>
- Logs: `docker compose -f /opt/gramalote/docker-compose.yml logs -f`
- Re-desplegar sin cambiar código: *Actions → CI/CD · EC2 → Run workflow*.
