# Panel de administración — edición de establecimientos e imágenes

Especificación del control que tendrá el administrador sobre la información de los
establecimientos y sus imágenes, y de cómo se refleja en MySQL. Complementa
[`backend/database/README.md`](../backend/database/README.md) y
[`REQUISITOS-FUNCIONALES.md`](REQUISITOS-FUNCIONALES.md) (RF-51, RF-52, RF-57).

Estado: **fase 1 implementada en la rama `feature/admin-establecimientos`**.
Ya funcionan el listado, la edición de la ficha, la subida y el orden de imágenes,
la publicación y la auditoría para **establecimientos**. Experiencias,
curiosidades e historia siguen pendientes, y el editor de horarios estructurados
todavía se reduce a `hours_text`.

Puesta en marcha: `npm run db:migrate` (aplica
`database/migrations/001_admin_media.sql` de forma idempotente) y arrancar la API
con las variables `MEDIA_*` de `.env.example`.

---

## 1. Decisiones que fija este documento

| Tema | Decisión |
| --- | --- |
| Dónde viven los archivos | **Disco de la EC2**, en `/opt/gramalote/media`, montado como volumen en los contenedores `api` y `web`. |
| Quién los sirve | **nginx** (`/media/...`), no un CDN obligatorio. |
| Servicios de AWS | **No se usan** S3, EFS, RDS, IAM roles para medios, ni URLs firmadas. Solo se aceptan como *destino opcional de respaldo* (§12). |
| Metadatos | MySQL: tabla `media` + tabla puente de cada entidad. Los binarios **nunca** van en la base. |
| Control de cambios | `audit_log` (JSON por operación) + `updated_at` para detección de conflictos. |
| Portabilidad | El mismo `docker-compose.yml`, el mismo esquema y la misma carpeta `media/` funcionan en un servidor físico con Docker instalado. |

**Razón:** el objetivo del proyecto es mudar el sitio a un servidor físico. Todo lo
que se implemente aquí debe poder copiarse con `rsync` + `mysqldump` sin reescribir
código ni pedir permisos a AWS.

---

## 2. Modelo de datos (ya existe, no requiere cambios)

### 2.1 `media` — catálogo de archivos

[schema.sql:142](../backend/database/schema.sql#L142) ya tiene todo lo necesario:

| Columna | Uso en el panel |
| --- | --- |
| `storage_disk` | Siempre `'local'` en este proyecto. Deja la puerta abierta a otro destino sin cambiar código. |
| `storage_path` | Ruta **relativa** al volumen: `establishments/12/9f3c…-cover.webp`. |
| `public_url` | URL servida por nginx: `/media/establishments/12/9f3c…-cover.webp`. **Relativa**, nunca con dominio. |
| `mime_type`, `width_px`, `height_px` | Se llenan al procesar la imagen (no se confía en el cliente). |
| `alt_text`, `caption`, `credit` | Editables desde el formulario; obligatorio `alt_text` al publicar. |
| `source` | `'upload'` para archivos subidos, `'drive'`/`'figma'` para materiales de la entrega UX/UI. |
| `source_ref` | ID del archivo en Drive/Figma cuando `source != 'upload'`. |
| `checksum_sha256` | Evita duplicados y permite verificar integridad tras la migración de servidor. |

### 2.2 `establishment_images` — orden y rol

[schema.sql:221](../backend/database/schema.sql#L221): `role` (`cover`, `gallery`,
`logo`), `sort_order` y `alt_override`. El mismo patrón existe en
`experience_images`, `curiosity_block_media` e `history_images`.

Reglas:

- Una sola portada por establecimiento: al marcar una imagen como `cover` se
  degrada la anterior a `gallery` **en la misma transacción**.
- `sort_order` se renumera de 10 en 10 para permitir inserciones sin reescribir todo.
- `alt_override` gana sobre `media.alt_text` en la ficha.
- Nunca se borra una fila de `media` mientras alguna tabla puente la referencie
  (`ON DELETE RESTRICT` ya lo impone).

### 2.3 `audit_log` — trazabilidad

[schema.sql:755](../backend/database/schema.sql#L755). Cada escritura del panel
inserta una fila:

| Campo | Ejemplo |
| --- | --- |
| `admin_user_id` | 1 |
| `action` | `update`, `create`, `delete`, `publish`, `unpublish`, `upload_media`, `reorder_media` |
| `entity_type` | `establishment`, `establishment_image`, `media` |
| `entity_id` | 12 |
| `changes` | `{"phone":{"from":"300…","to":"311…"},"summary":{"from":"…","to":"…"}}` |
| `ip_address` | IP real (con `TRUST_PROXY` ya configurado) |

El JSON guarda **solo los campos modificados**, con `from`/`to`. No se registran
contraseñas, tokens ni el binario de la imagen.

### 2.4 `admin_users` — roles

`role ENUM('admin','editor')` e `is_active` ya existen. La matriz propuesta:

| Acción | `editor` | `admin` |
| --- | :---: | :---: |
| Ver y editar fichas en borrador | ✅ | ✅ |
| Subir / reordenar / reemplazar imágenes | ✅ | ✅ |
| Publicar o despublicar una ficha | ❌ | ✅ |
| Borrar una ficha (soft delete) | ❌ | ✅ |
| Borrar un archivo de `media` | ❌ | ✅ |
| Gestionar cuentas de administración | ❌ | ✅ |
| Consultar `audit_log` | ❌ | ✅ |

El rol viaja en el JWT y se revalida contra la base en cada request
(`backend/src/auth.js`), así que desactivar una cuenta surte efecto sin esperar
al vencimiento del token.

---

## 3. Opciones de almacenamiento dentro de la EC2

### 3.1 Estado medido de la instancia (2026-10-28)

| Recurso | Valor real |
| --- | --- |
| Disco raíz | 1 volumen `gp3` de **8 GiB**, **5.5 GiB usados · 2.6 GiB libres (69 %)** |
| RAM | 913 MB totales, **~309 MB disponibles** |
| `/opt/gramalote` | ~104 KB (solo `docker-compose.yml`, `.env` y los `.sql`) |

El espacio lo consumen las imágenes de Docker (ECR y capas antiguas), el volumen
de MySQL y los logs. Antes de fijar cualquier cuota hay que mirar
`df -h /` y `docker system df`; hoy el margen real es de **2.6 GiB**.

### 3.2 Comparación

| Opción | Pros | Contras | Cuándo usarla |
| --- | --- | --- | --- |
| **A. Bind mount en el disco raíz** (`/opt/gramalote/media`) | Cero costo extra; archivos visibles en el host; `rsync` directo al servidor físico; una sola cosa que respaldar; Docker no la gestiona | Compite con MySQL, imágenes Docker y logs por 2.6 GiB; un pico de subidas puede llenar `/` y tumbar la base | **Ahora**, con cuota y alertas estrictas |
| **B. Ampliar el volumen raíz** (8 → 20 GiB) y usar A | Resuelve de golpe la presión general del disco (69 % hoy); operación simple (`growpart` + `xfs_growfs`); +12 GiB ≈ **$0.96/mes** en `gp3` | Requiere reinicio/expansión controlada y snapshot previo; el sitio sigue dependiendo de un único volumen | **Recomendada junto con A** antes de habilitar subidas |
| **C. Volumen EBS dedicado** montado en `/opt/gramalote/media` | Aísla el crecimiento de imágenes del sistema; se redimensiona sin tocar el raíz; snapshot independiente; el costo por GiB es el mismo que B | Hay que configurar el montaje en `/etc/fstab` (si falla, el sitio arranca sin medios); un disco más que vigilar; sigue atado a AWS, aunque los datos salen con `rsync` | Si se esperan **más de ~5 GiB** de fotos |
| **D. Volumen nombrado de Docker** (`gramalote_media`) | Docker maneja permisos y ciclo de vida; respaldo con `docker run --rm -v …` | Vive bajo `/var/lib/docker` (ruta opaca, difícil de inspeccionar); `rsync` menos directo y acoplado al motor; no aporta nada frente a A | No se recomienda |
| **E. MinIO en la EC2** (S3-compatible local) | API tipo S3 sin AWS; muy portable a un servidor físico; si algún día se usa S3 real, el código no cambia | **Consume RAM que no hay** (~100–150 MB de los 309 disponibles); contenedor y credenciales extra; otro servicio que respaldar y actualizar; el `sharp` de recorte ya compite por CPU | Solo si el cliente exige una API S3 |
| **F. Imágenes en MySQL** (`LONGBLOB`) | Un único respaldo (el dump) y transaccionalidad total | Infla la base y cada `mysqldump`; presión de memoria en 913 MB; sin caché de nginx ni `sendfile`; mata el objetivo de migrar rápido | Nunca |
| **G. Empaquetar las fotos en la imagen del frontend** (`public/`) | Cero almacenamiento en runtime; versionado y reproducible | El administrador no puede subir nada: cada foto exigiría `build` + despliegue; la imagen crece y se descarga entera | Solo assets de marca estáticos (los de `public/brand/`) |
| **H. Servir desde la API** (`express.static`) en vez de nginx | Un solo contenedor con acceso al archivo | Node consume CPU/RAM sirviendo bytes; pierde `sendfile`, caché y compresión de nginx; peor en la t3.micro | Nunca para medios públicos |
| **I. Instance store / RAM disk** | Rápido | La t3.micro **no tiene** instance store y el contenido es volátil | No aplica |
| **J. CloudFront delante** del disco de la EC2 | Caché y TLS gratis para el visitante; menos carga en la instancia | Sigue siendo un servicio de AWS; hay que invalidar caché al reemplazar una imagen; **nunca** debe ser el origen | Opcional, solo como caché |

### 3.3 Costo del cambio (Cost Explorer, 2026-10-28)

Tarifas **verificadas** contra el consumo real de la cuenta `706637772877`
(us-east-2), no estimadas:

| Concepto | Consumo de octubre | Costo | Tarifa deducida |
| --- | --- | ---: | --- |
| `t3.micro` | 122 h | $1.2688 | $0.0104/h |
| IPv4 pública en uso | 124 h | $0.6200 | $0.0050/h |
| EBS `gp3` | 1.29 GB-mes (8 GB) | $0.1032 | **$0.08/GB-mes** |
| ECR | — | $0.0004 | — |
| **Total bruto 1–28 oct** | | **$1.9925** | |
| **Créditos aplicados** | | **−$1.9925** | |
| **Neto a pagar** | | **$0.00** | |

Proyección a mes completo con la instancia 24/7:

| Escenario | Cómputo + IPv4 | EBS | **Total/mes** | Delta |
| --- | ---: | ---: | ---: | ---: |
| Hoy (8 GB) | $11.24 | $0.64 | **$11.88** | — |
| 20 GB | $11.24 | $1.60 | **$12.84** | **+$0.96** (+$11.52/año) |
| 30 GB | $11.24 | $2.40 | **$13.64** | +$1.76 |

Notas del pronóstico:

- `ce get-cost-forecast` respondió `DataUnavailableException` (cuenta con menos de
  un mes de historia); la proyección de arriba es aritmética sobre las tarifas
  deducidas del consumo real.
- El aumento de EBS se cobra **prorrateado por segundo**, así que a mitad de mes
  son centavos, no el dólar completo.
- `gp3` incluye 3000 IOPS y 125 MB/s; 20 GB siguen dentro de la base, sin cargo
  extra de IOPS.
- **No hay snapshots** hoy (`describe-snapshots` vacío). Si se crean, cuestan
  $0.05/GB-mes incremental: un snapshot inicial de 8 GB ≈ $0.40.
- Los créditos cubren el 100 % del consumo actual; al agotarse, el cargo real
  será el bruto (~$12.84/mes con 20 GB).
- No hay ningún budget configurado en la cuenta: conviene crear uno con
  `aws budgets create-budget` (región `us-east-1`) avisando a los $20/mes.

### 3.4 Recomendación

1. **Hoy:** opción **A** con cuota de **500 MB** y aviso al 80 % — cabe de sobra
   para las ~1.300 fotos actuales (~150 KB por WebP de 1440 px ≈ 200 MB).
2. **Antes de abrir el panel al público:** opción **B** (raíz a 20 GiB, +$0.96/mes), porque el
   69 % de uso actual no deja margen para MySQL + logs + fotos nuevas.
3. **Si las fotos pasan de ~5 GiB:** migrar a **C** sin cambiar código, solo
   moviendo `MEDIA_DIR` y el montaje.
4. **Descartar** D, E, F, G, H e I: o no aportan, o van contra la meta de
   portabilidad y contra los 913 MB de RAM.

---

## 4. Estructura en disco

```
/opt/gramalote/media/                    # volumen del host (bind mount)
├─ establishments/<id>/
│  ├─ <uuid>-cover.webp                  # 1440 px, calidad 82
│  ├─ <uuid>-cover-960.webp
│  ├─ <uuid>-cover-480.webp
│  └─ <uuid>-gallery-01.webp …
├─ experiences/<id>/
├─ curiosities/<block_id>/
├─ history/<entry_id>/
├─ site/                                 # hero, logos de sección, og:image
├─ originals/                            # opcional: archivo tal como se subió
└─ tmp/                                  # subidas en proceso; se vacía al arrancar
```

Convenciones:

- Nombre de archivo = **UUID v4** + sufijo de rol. Nunca el nombre original:
  evita colisiones, acentos, espacios y rutas arbitrarias.
- Extensión y `mime_type` se derivan del contenido real (firma del archivo),
  no de lo que declare el navegador.
- `storage_path` guarda la ruta relativa (`establishments/12/<uuid>-cover.webp`);
  `public_url` es `/media/` + esa ruta.
- Los originales de más de 4 MB se conservan en `originals/` solo si se pide;
  por defecto se descartan tras generar las variantes (ahorra disco en la EC2).

---

## 5. Montaje en Docker y servido por nginx

### 5.1 `docker-compose.yml`

```yaml
services:
  api:
    environment:
      MEDIA_ROOT: /app/media              # ruta dentro del contenedor
      MEDIA_PUBLIC_BASE: /media           # prefijo de public_url
      MEDIA_DIR: /opt/gramalote/media     # ruta en el host
      MEDIA_MAX_UPLOAD_MB: "12"
      MEDIA_VARIANTS: "480,960,1440"
      MEDIA_ORIGINALS: "false"            # true = conservar el archivo original
      MEDIA_QUOTA_MB: "500"               # subir tras ampliar el volumen (§3.3)
    volumes:
      - ${MEDIA_DIR:-/opt/gramalote/media}:/app/media

  web:
    volumes:
      - ${MEDIA_DIR:-/opt/gramalote/media}:/srv/media:ro   # solo lectura
```

Notas:

- El bind mount (no un volumen nombrado) deja los archivos **visibles en el host**:
  copiarlos a un servidor físico es un `rsync`. Un volumen Docker también sirve,
  pero complica el respaldo y la inspección.
- El contenedor `api` corre como `node` (UID 1000). En la instancia:
  `sudo chown -R 1000:1000 /opt/gramalote/media` y `chmod 750`.
- El contenedor `web` monta la carpeta en **solo lectura**: nginx nunca escribe.

### 5.2 `frontend/nginx.conf`

```nginx
# Imágenes subidas desde el panel (disco local de la instancia).
location /media/ {
    alias /srv/media/;
    access_log off;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
    add_header X-Content-Type-Options nosniff always;
    try_files $uri =404;
}
```

Además hay que subir el límite de subida, que hoy es `client_max_body_size 4m`:

```nginx
client_max_body_size 12m;   # una foto de teléfono; el API valida de nuevo
```

Como las URLs son relativas (`/media/...`), el mismo frontend funciona en
producción, en local y en el futuro servidor físico sin tocar código. CloudFront,
si sigue delante, solo hace de caché: **el origen de verdad es el disco**.

---

## 6. API de escritura del panel

Se montan bajo `/api/admin/*`, todas con `requireAuth` y verificación de rol. El
resto de rutas actuales (`/api/establishments`, etc.) siguen siendo de lectura.

| Método | Ruta | Rol | Descripción |
| --- | --- | --- | --- |
| `POST` | `/api/admin/media` | editor | Sube una imagen (`multipart/form-data`, campo `file`), genera variantes y devuelve el registro de `media`. |
| `PATCH` | `/api/admin/media/:id` | editor | Edita `alt_text`, `caption`, `credit`. |
| `DELETE` | `/api/admin/media/:id` | admin | Borra el archivo y la fila, solo si no está referenciada. |
| `POST` | `/api/admin/establishments/:id/images` | editor | Adjunta un `media` existente con `role` y `sort_order`. |
| `PATCH` | `/api/admin/establishments/:id/images/:imageId` | editor | Cambia `role`, `sort_order` o `alt_override`. |
| `DELETE` | `/api/admin/establishments/:id/images/:imageId` | editor | Desvincula la imagen de la ficha (no borra `media`). |
| `PUT` | `/api/admin/establishments/:id/images/order` | editor | Recibe la lista de IDs en el orden final. |
| `PATCH` | `/api/admin/establishments/:id` | editor | Edita la ficha y sus tablas hijas en una transacción. |
| `POST` | `/api/admin/establishments` | editor | Crea una ficha en borrador (`is_published = 0`). |
| `POST` | `/api/admin/establishments/:id/publish` | admin | Publica o despublica. |
| `DELETE` | `/api/admin/establishments/:id` | admin | *Soft delete* (`deleted_at`). |

### 6.1 Subida de imágenes — validaciones obligatorias

1. Tamaño máximo `MEDIA_MAX_UPLOAD_MB` (12 MB) y límite de `express.json` aparte;
   el endpoint multipart usa su propio límite.
2. Tipos permitidos: `image/jpeg`, `image/png`, `image/webp`. **Se verifica la
   firma del archivo**, no solo el `Content-Type`.
3. Rechazar SVG subidos por el panel (pueden llevar scripts). Los SVG de marca
   siguen viniendo del repositorio, en `frontend/public/brand/`.
4. Re-codificar siempre con `sharp`: elimina EXIF (incluidas coordenadas GPS),
   corrige orientación y normaliza el espacio de color.
5. Generar variantes WebP en 480 / 960 / 1440 px de ancho máximo, sin ampliar.
6. Escribir primero en `tmp/` y mover a su carpeta final solo cuando las
   variantes terminen, para no dejar archivos a medias si falla.
7. Responder `201` con `{ id, url, width, height, mimeType, variants }`.
8. Registrar `upload_media` en `audit_log`.
9. Límite de memoria: `sharp.concurrency(1)` y `sharp.cache(false)` para no
   ahogar la t3.micro (913 MB).

### 6.2 Edición de la ficha — una sola transacción

`PATCH /api/admin/establishments/:id` recibe el formulario completo (o solo los
campos cambiados) y dentro de una transacción:

```text
BEGIN
  SELECT … FOR UPDATE                       -- bloquea la fila
  UPDATE establishments SET … , updated_at = NOW()
  DELETE/INSERT establishment_features, establishment_products,
         establishment_services, establishment_payments,
         establishment_social_links, establishment_relations,
         opening_hours, opening_hours_exceptions
  REPLACE/UPDATE search_documents           -- misma transacción
  INSERT audit_log (changes JSON)
COMMIT
```

Reglas de negocio:

- **Slug**: se genera desde el nombre al crear; cambiarlo después exige
  confirmación explícita y actualiza `search_documents.url`.
- **Conflictos**: el cliente envía el `updatedAt` que leyó. Si no coincide con el
  de la base, se responde `409` con el registro actual (edición concurrente).
- **Publicación**: `is_published = 1` exige `summary`, `description`, categoría,
  al menos una portada con `alt_text` y `published_at` no nulo.
- **Soft delete**: `deleted_at` saca la ficha de las vistas públicas
  (`v_public_establishments` ya filtra); `media` no se toca.
- **Zona horaria**: las horas se guardan como texto y se calculan con
  `America/Bogota` (`backend/src/opening-hours.js`).

---

## 7. Flujo del administrador (UI)

1. `/acceder` → login → `/admin`.
2. Listado de establecimientos con filtros (categoría, zona, estado, con/sin
   portada) y buscador por nombre.
3. Ficha en `/admin/establecimientos/:id` con pestañas:
   - **Información**: campos de `establishments` + servicios, pagos, redes,
     productos, relaciones.
   - **Horarios**: `opening_hours` y excepciones.
   - **Imágenes**: arrastrar y soltar, marcador de portada, reordenar, texto
     alternativo por imagen, crédito.
   - **Publicación**: estado, vista previa, historial (`audit_log`).
4. Barra fija con **Guardar borrador** y **Publicar** (Publicar solo para `admin`).
5. Aviso si se intenta salir con cambios sin guardar.
6. Vista previa que consume la API pública con el `slug` de la ficha, para ver el
   resultado real antes de publicar.

Cada acción del panel llama a la API real; **no** hay guardado directo en MySQL
desde el navegador.

---

## 8. Límites y salud del disco en la EC2

La t3.micro tiene poco margen; el plan debe incluir control, no solo subida:

- **Cuota inicial: 500 MB** (≈ 1.300 fotos WebP de 1440 px a ~150 KB). Cabe en
  los 2.6 GiB libres sin poner en riesgo a MySQL.
- Tras ampliar el volumen raíz a 20 GiB (§3.4), subir la cuota a **2 GB**.
- `GET /api/admin/media/stats` devuelve uso total, número de archivos y los 10
  medios más pesados.
- Aviso en el panel al superar el 80 % de la cuota; bloqueo de nuevas subidas al
  95 %.
- Vigilar también el disco, no solo la cuota: `df -h /` y `docker system df`
  (las capas viejas de imagen son lo que más crece).
- Trabajo de limpieza (`npm run media:prune`) que borra archivos de `tmp/`,
  variantes huérfanas y registros de `media` sin ninguna tabla puente.
  **Siempre en modo simulación por defecto** (`--dry-run`).
- No se guardan originales por defecto (`MEDIA_ORIGINALS=false`).

---

## 9. Respaldos

`/opt/gramalote/media` es parte del estado del sitio, igual que MySQL. Los
respaldos se **transmiten** fuera de la instancia: escribir un `.tar.gz` en `/tmp`
de 2.6 GiB libres es arriesgado.

```bash
# Desde la máquina del administrador: medios comprimidos por el canal SSH.
ssh -i gramalote-key.pem ec2-user@18.119.155.81 \
  'tar -C /opt/gramalote -czf - media' > media-$(date +%F).tar.gz

# Base de datos, también en streaming.
ssh -i gramalote-key.pem ec2-user@18.119.155.81 \
  'sudo docker exec gramalote-db sh -c "mysqldump -uroot -p\$MYSQL_ROOT_PASSWORD --single-transaction gramalote"' \
  > gramalote-$(date +%F).sql
```

- No se borra un `media` en uso: las claves foráneas son `ON DELETE RESTRICT`.
- Si se usa S3, que sea **solo destino de respaldo** y gestionado por un script
  aparte: el runtime del sitio no debe depender de él.
- Probar la restauración en un directorio limpio al menos una vez por entrega.

---

## 10. Migración a servidor físico

Lo que este diseño garantiza: nada del panel ni del almacenamiento depende de
servicios propietarios. Checklist al mudar:

1. Instalar Docker + Docker Compose en el servidor físico.
2. Copiar el proyecto, `/opt/gramalote/.env` y `/opt/gramalote/media` (`rsync -a`).
3. Restaurar la base: `mysql … < gramalote-YYYY-MM-DD.sql`.
4. Ajustar solo lo que es de despliegue:
   - `IMAGE` / `API_IMAGE` de ECR → build local (`docker build`) o un registro
     propio; el `docker-compose.yml` ya acepta ambas formas por variable.
   - `CORS_ORIGIN` → dominio definitivo.
   - nginx del servidor físico: proxy a `127.0.0.1:80` + TLS (Certbot o
     certificado propio). CloudFront deja de ser necesario.
   - Reemplazar el despliegue por SSM del CI por `ssh` + `git pull` +
     `docker compose up -d`.
5. Verificar: `/healthz`, `/api/health`, login, una ficha con imágenes y el
   `audit_log` de esa edición.
6. Mantener CloudFront solo como caché opcional; nunca como requisito.

---

## 11. Checklist de implementación

- [x] `PATCH /api/admin/establishments/:id` transaccional + `audit_log`.
- [x] `POST /api/admin/media` con `sharp`, validación de firma y variantes.
- [x] Asociación, orden y portada de `establishment_images`.
- [x] Script `media:prune` (dry-run por defecto) y endpoint de estadísticas.
- [x] UI: listado, formulario por pestañas y gestor de imágenes.
- [x] Matriz de roles aplicada en API **y** en UI.
- [x] Montaje `/srv/media` en nginx y `client_max_body_size` ajustado.
- [ ] Ampliar el volumen raíz EBS (8 → 20 GiB) o decidir volumen dedicado.
- [ ] Editor de horarios por día (`opening_hours`) en la UI.
- [ ] Módulos de experiencias, curiosidades e historia.
- [ ] Prueba de migración a un directorio limpio para validar portabilidad.

## 12. Decisiones abiertas

- ¿`editor` puede publicar sin revisión, o requiere aprobación de `admin`?
- ¿Se conservan los originales en `originals/` (más calidad, más disco)?
- ¿Límite de imágenes por establecimiento (hoy el esquema no lo impone)?
- ¿Se amplía el volumen raíz (opción B) o se añade un EBS dedicado (opción C)?
