# Backend

API de lectura de Gramalote Interactivo con autenticación de administración. **Node 20+ · Express 5 · MySQL 8.0+.**

## Inicio rápido

```bash
cd backend
cp .env.example .env          # PowerShell: Copy-Item .env.example .env
docker compose up -d          # MySQL en 127.0.0.1:3307
npm install
npm run seed:admin            # crea la cuenta definida en ADMIN_EMAIL/ADMIN_PASSWORD
npm run seed:content          # inventario, curiosidades e información práctica
npm run dev                   # API en http://127.0.0.1:4000/api
```

Comprobar que la base y la API responden:

```bash
curl http://127.0.0.1:4000/api/health
curl http://127.0.0.1:4000/api/meta
```

## Base de datos

- [`database/schema.sql`](./database/schema.sql): 33 tablas + 3 vistas.
- [`database/seed.sql`](./database/seed.sql): catálogos, navegación y secciones
  de Curiosidades.
- [`database/seed-content.sql`](./database/seed-content.sql): inventario completo
  (19 establecimientos, 3 experiencias, 4 curiosidades, información práctica y
  textos de página) y el índice `search_documents`. `npm run seed:content` lo
  carga y es re-ejecutable: reemplaza el contenido sin tocar cuentas ni medios.
- [`database/README.md`](./database/README.md): modelo, diagrama ER, mapeo desde
  el frontend y pendientes.
- [`docker-compose.yml`](./docker-compose.yml): MySQL local en el puerto 3307.
- [`.env.example`](./.env.example): variables de conexión y CORS.

## API

Todas las respuestas usan `camelCase` y devuelven `{ "data": ... }`; los
listados añaden `meta` con `total`, `limit` y `offset`.

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/health` | Estado de la API y de MySQL |
| POST | `/api/auth/login` | Inicia sesión de administración |
| POST | `/api/auth/refresh` | Renueva el access token con la cookie de refresh |
| POST | `/api/auth/logout` | Revoca la sesión y borra la cookie |
| GET | `/api/auth/me` | Cuenta autenticada (requiere `Authorization: Bearer`) |
| GET | `/api/meta` | Categorías, tipos, zonas, servicios y pagos |
| GET | `/api/site` | Navegación y configuración del sitio |
| GET | `/api/establishments` | Listado de establecimientos |
| GET | `/api/establishments/:slug` | Ficha completa, imágenes y horarios |
| GET | `/api/experiences` | Listado de experiencias |
| GET | `/api/experiences/:slug` | Ficha completa, tips y lugares relacionados |
| GET | `/api/curiosities` | Tarjetas del hub de Curiosidades |
| GET | `/api/curiosities/:slug` | Detalle con bloques, medios y colecciones |
| GET | `/api/history` | Entradas de historia |
| GET | `/api/history/:slug` | Entrada de historia con galería |
| GET | `/api/practical` | Información práctica completa |
| GET | `/api/map` | Puntos con coordenadas de establecimientos y experiencias |
| GET | `/api/search?q=` | Búsqueda full-text en `search_documents` |

### Filtros de establecimientos

`GET /api/establishments?category=comer&type=cafeteria&zone=nuevo&service=wifi&payment=nequi&featured=true&q=cafe&limit=12&offset=0`

- `category`: `comer`, `dormir`, `comprar`.
- `type`: slug de `establishment_types`.
- `zone`: `nuevo`, `viejo`.
- `service` y `payment`: slug de catálogo.
- `featured`: `true`/`false`.
- `q`: nombre, resumen, descripción o dirección.
- `limit`: 1–100 (24 por defecto); `offset`: desde 0.

### Filtros de experiencias

`GET /api/experiences?category=naturaleza&zone=viejo&featured=true&q=cascada`

### Mapa

`GET /api/map?kind=establishment&zone=nuevo&category=comer&q=cafe`

`kind` acepta `establishment`, `experience` o `all`.

### Abierto ahora

`GET /api/establishments/:slug` calcula `openNow` con `opening_hours` y
`opening_hours_exceptions` en `America/Bogota`. No se guarda en la base porque
cambia con el tiempo. Devuelve `null` si no hay horario estructurado.

## Autenticación

- `POST /api/auth/login` verifica la contraseña con bcrypt contra `admin_users` y
devuelve un **access token JWT** (30 min por defecto) que el frontend guarda en
memoria, más un **refresh token** en cookie `httpOnly` (7 días) cuyo hash
SHA-256 vive en `admin_refresh_tokens`.
- `POST /api/auth/refresh` rota el refresh token: invalida el anterior y emite uno
nuevo. Reutilizar un token ya canjeado revoca el resto de sesiones de la cuenta.
- `POST /api/auth/logout` revoca el refresh token y borra la cookie.
- `requireAuth` (`src/auth.js`) protege las rutas privadas y deja la cuenta en
`req.admin`; el rol viaja en el JWT y la cuenta se valida contra la base.
- La cuenta se crea con `npm run seed:admin`, que lee `ADMIN_EMAIL`,
`ADMIN_PASSWORD` y `ADMIN_NAME` de `backend/.env` (nunca se versionan). Si la
cuenta ya existe, rota su contraseña y la reactiva.
- En producción `JWT_SECRET` es obligatorio; en desarrollo, si falta, se genera
uno efímero y las sesiones caducan al reiniciar la API.

## Variables de entorno

```ini
MYSQL_ROOT_PASSWORD=change-me-root
MYSQL_DATABASE=gramalote
MYSQL_USER=gramalote
MYSQL_PASSWORD=change-me-app
MYSQL_PORT=3307

API_HOST=127.0.0.1
API_PORT=4000
CORS_ORIGIN=http://localhost:5173,http://localhost:4173
DB_POOL_SIZE=10

JWT_SECRET=              # openssl rand -hex 32; obligatorio en producción
AUTH_ACCESS_TTL=30m
AUTH_REFRESH_TTL_DAYS=7
TRUST_PROXY=0            # 1 detrás de nginx/CloudFront

ADMIN_EMAIL=admin@gramalote.example
ADMIN_PASSWORD=cambie-esta-contrasena
ADMIN_NAME=Administrador
```

En producción usar un usuario MySQL con permisos mínimos, TLS, `API_HOST=0.0.0.0`
y un origen CORS explícito. No versionar `.env`.

## Estructura

```text
src/
  app.js              Express, CORS, health y montaje de rutas
  server.js           Arranque y cierre ordenado
  config.js           Variables de entorno y pool
  db.js               Helpers de consulta
  auth.js             bcrypt, JWT, cookies de refresh y requireAuth
  http.js             Errores, paginación y middleware
  serializers.js      Respuestas camelCase y medios
  opening-hours.js    Cálculo de "Abierto hoy"
  routes/             auth, meta, site, establishments, experiences,
                      curiosities, history, practical, map, search
scripts/
  seed-admin.js       Crea/actualiza la cuenta admin desde .env
  seed-content.js     Carga database/seed-content.sql y valida los conteos
```

## Pendiente

- CRUD del panel de administración (la autenticación ya está implementada).
- Que cada guardado del panel actualice `search_documents` en la misma
  transacción (hoy se puebla con el seed de contenido).
- Conectar el frontend a la API: todavía lee `frontend/src/data`.
- Definir almacenamiento de imágenes (S3/CloudFront o disco) y proveedor de mapa.
- Migraciones versionadas; `schema.sql` es el arranque local, no un sistema de
  migraciones.
