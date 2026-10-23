# Backend

API de Gramalote Interactivo. **Stack de base de datos elegido: MySQL 8.0+.**

## Base de datos

- [`database/schema.sql`](./database/schema.sql): 33 tablas + 3 vistas.
- [`database/seed.sql`](./database/seed.sql): catálogos y configuración inicial.
- [`database/README.md`](./database/README.md): modelo, diagrama ER, mapeo desde
  el frontend y pendientes.
- [`docker-compose.yml`](./docker-compose.yml): MySQL local en el puerto 3307.
- [`.env.example`](./.env.example): variables de conexión.

```bash
cd backend
cp .env.example .env    # PowerShell: Copy-Item .env.example .env
docker compose up -d
```

## Pendiente

- Definir el framework de la API (Node/Fastify o Express) y el acceso a datos.
- Implementar autenticación y CRUD del panel de administración.
- Migrar el contenido de `frontend/src/data` a MySQL.
- Mantener el índice `search_documents` y calcular “Abierto hoy”.
- Definir almacenamiento de imágenes (S3/CloudFront o disco) y proveedor de mapa.
