# Backend

API de lectura de Gramalote Interactivo. **Node 20+ · Express 5 · MySQL 8.0+.**

## Inicio rápido

```bash
cd backend
cp .env.example .env          # PowerShell: Copy-Item .env.example .env
docker compose up -d          # MySQL en 127.0.0.1:3307
npm install
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
  de Curiosidades. No incluye todavía el inventario completo.
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
  http.js             Errores, paginación y middleware
  serializers.js      Respuestas camelCase y medios
  opening-hours.js    Cálculo de "Abierto hoy"
  routes/             meta, site, establishments, experiences,
                      curiosities, history, practical, map, search
```

## Pendiente

- Autenticación real y CRUD del panel de administración.
- Migrar el inventario de `frontend/src/data` a MySQL.
- Poblar `search_documents` al guardar contenido.
- Definir almacenamiento de imágenes (S3/CloudFront o disco) y proveedor de mapa.
- Migraciones versionadas; `schema.sql` es el arranque local, no un sistema de
  migraciones.
