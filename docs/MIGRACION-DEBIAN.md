# Migración de la EC2 (Amazon Linux) a Debian

Este documento explica cómo dejar todo lo que hoy vive en la EC2 guardado en el
repositorio de GitHub, y cómo reconstruir el sitio en un servidor Debian
**cuando lo único a lo que tendrás acceso es el repositorio**: sin consola de
AWS, sin perfil IAM y sin llave SSH.

> Resumen en una línea: el **código** ya está en Git; lo que falta son la **base
> de datos**, las **fotos subidas** y el **mapa**. Para eso está
> `deploy/migracion-exportar.ps1`.

---

## 1. Qué hay hoy en la EC2 y dónde vive

| Cosa | En la EC2 | ¿Está en Git? |
|---|---|---|
| Código (frontend, backend, deploy) | `/opt/gramalote` (repo clonado por SSM) | **Sí** — es el repositorio |
| Base de datos `gramalote` | contenedor `gramalote-db`, volumen Docker | **No** — hay que exportarla |
| Fotos y variantes subidas | `/opt/gramalote/media` (59 MB, 561 archivos) | **No** — hay que exportarlas |
| Mapa PMTiles | `/opt/gramalote/tiles/*.pmtiles` (50 MB) | **No** (*.pmtiles está en `.gitignore`) |
| Secretos y configuración | `/opt/gramalote/.env` (root, `600`) | **No, nunca** |
| Respaldos viejos | `/opt/gramalote/backups` | No (son históricos) |
| Imágenes Docker | Amazon ECR | No (se reconstruyen con los `Dockerfile`) |

Todo lo marcado como "hay que exportar" se resuelve con el script de la sección 3
y queda en `migracion/<fecha>/`.

---

## 2. Límites de GitHub que condicionan el plan

| Límite | Valor | ¿Nos afecta? |
|---|---|---|
| Tamaño máximo por archivo | **100 MiB** (bloqueante) | No: el archivo más grande son 50 MB de teselas |
| Aviso por archivo | 50 MiB | Solo el `.pmtiles` |
| Tamaño recomendado del repo | < 1 GB | No: hoy son 6 MB; con el snapshot quedaría en ~120 MB |
| Tamaño de push | > 2 GB se rechaza | No |

Con los tamaños reales de hoy **todo cabe en GitHub sin Git LFS**. Si algún día
las fotos crecen, el script aborta y lista los archivos problemáticos antes de
subir nada.

⚠️ **El repositorio debe ser privado.** El volcado de la base contiene datos
reales de personas: correos de administradores, sugerencias con nombre y
teléfono, calificaciones y comentarios. No es material para un repo público.

---

## 3. Exportar: `deploy/migracion-exportar.ps1`

Se ejecuta **en tu PC**, mientras aún tienes la llave SSH. Requiere PowerShell,
`git` y el cliente OpenSSH de Windows (`ssh`/`scp`, ya vienen con Windows 10+).

Antes de lanzarlo, el *security group* de la instancia debe permitir el puerto
22 desde tu IP actual (`sg-039d50b49a57859d8`; cambia cada vez que cambias de
red).

La descarga completa tarda unos 10 minutos: `scp` va archivo por archivo y son
561 fotos pequeñas. Puedes dejarlo corriendo; al final imprime el resumen y
deja el snapshot listo para `git push`.

```powershell
# 1) Comprobar conexión y tamaños sin descargar nada
powershell -File deploy/migracion-exportar.ps1 -SoloDiagnostico

# 2) Exportar todo (base de datos + esquema + fotos + mapa) a migracion\<fecha>\
powershell -File deploy/migracion-exportar.ps1

# 3) Publicarlo en la rama actual
powershell -File deploy/migracion-exportar.ps1 -Commit
```

Opciones:

| Parámetro | Para qué |
|---|---|
| `-SoloDiagnostico` | Solo mide y comprueba; no descarga. |
| `-Etiqueta 2026-11-20` | Nombre de la carpeta (por defecto `aaaa-MM-dd-HHmm`). |
| `-SinTiles` | No bajar el mapa (el sitio quedará sin mapa hasta generarlo). |
| `-Commit` | Hace `git add` del snapshot, lo confirma y hace `push`. |
| `-Conservar N` | Avisa de snapshots viejos en la carpeta de trabajo (por defecto 2). |
| `-Servidor`, `-Llave` | Si cambian el usuario/IP o la ruta de la llave. |

Qué hace exactamente:

1. Entra por SSH y, dentro del contenedor `gramalote-db`, genera el volcado con
   `mysqldump --single-transaction --routines --triggers --no-tablespaces`
   (consistente sin bloquear la web) y lo comprime con gzip.
2. Comprueba que el volcado termina con su marca `Dump completed` y calcula su
   `sha256`.
3. Genera además `esquema-<fecha>.sql` (solo estructura, legible) y
   `conteos.tsv` (filas por tabla, para verificar la importación).
4. Inventaría `/opt/gramalote/media` y `/opt/gramalote/tiles` y **aborta** si
   algún archivo pasa de 95 MB.
5. Descarga con `scp` a `migracion\<fecha>\`, y verifica que el `sha256` del
   volcado y el número/tamaño de las fotos coincidan con el servidor.
6. Escribe `MANIFIESTO.md` con fecha, commit, tamaños, checksums y conteos.
7. Borra su directorio temporal en el servidor. **No modifica nada más del
   servidor.**

No usa la API de AWS ni ECR: solo SSH/SCP, igual que `deploy/backup-pull.ps1`.

### Qué queda en `migracion/<fecha>/`

```
migracion/2026-11-15-1830/
├── MANIFIESTO.md                  fecha, commit, tamaños, sha256, conteos
├── gramalote-2026-11-15-1830.sql.gz   volcado completo (esquema + datos)
├── esquema-2026-11-15-1830.sql        solo estructura
├── conteos.tsv                    filas por tabla
├── archivos-media.tsv             inventario de fotos (tamaño y ruta)
├── media/                         561 fotos y sus variantes
└── tiles/                         norte-de-santander.pmtiles
```

---

## 4. Verificar antes de desconectarte de AWS

Hazlo **antes** de dar la EC2 por perdida; si algo falta, todavía estás a
tiempo de volver a exportar.

- [ ] `MANIFIESTO.md` dice «Verificado: el volcado cierra con "Dump completed"».
- [ ] `git log` muestra el commit del snapshot y `git status` está limpio.
- [ ] En GitHub se ven `media/` y `tiles/` (navega la carpeta en la web).
- [ ] El volcado abre y tiene datos, no solo estructura:

```powershell
# Buscar filas reales en el volcado (debe imprimir INSERT INTO)
gzip -dc migracion\<fecha>\gramalote-<fecha>.sql.gz | Select-String 'INSERT INTO' | Measure-Object
```

- [ ] `conteos.tsv` tiene números plausibles (p. ej. `lugares`, `patrimonio`,
      `usuarios`, `sugerencias` con más de 0 filas).
- [ ] El `.env` de producción está guardado **fuera** de Git (sección 5).
- [ ] El repositorio es **privado**.

---

## 5. Secretos: lo único que no puede ir al repo

`/opt/gramalote/.env` tiene la contraseña de MySQL, el `JWT_SECRET` y la cuenta
admin. **Nunca** se versiona. Guárdalo en tu gestor de contraseñas (o en un
archivo cifrado fuera del repo) **hoy**, porque después no habrá SSH.

Para copiarlo a tu PC (a una ruta ignorada por Git):

```powershell
scp -i "$env:USERPROFILE\.ssh\gramalote-key.pem" ec2-user@18.119.155.81:/opt/gramalote/.env `
    "$env:USERPROFILE\gramalote-env-produccion.txt"
```

Variables que debe tener el `.env` nuevo (valores de ejemplo; **genera otros**):

```ini
MYSQL_ROOT_PASSWORD=<openssl rand -hex 16>
MYSQL_DATABASE=gramalote
MYSQL_USER=gramalote
MYSQL_PASSWORD=<openssl rand -hex 16>

JWT_SECRET=<openssl rand -hex 32>
ADMIN_EMAIL=<el de siempre>
ADMIN_PASSWORD=<la de siempre, o una nueva>
ADMIN_NAME=Administrador

CORS_ORIGIN=https://<dominio-nuevo>
PUBLIC_SITE_URL=https://<dominio-nuevo>
TRUST_PROXY=1

MEDIA_DIR=/srv/gramalote/media
TILES_DIR=/srv/gramalote/tiles
BACKUP_ENABLED=1
```

Dos avisos importantes:

- **`JWT_SECRET` nuevo cierra todas las sesiones** del panel: todos tendrán que
  volver a entrar. No es un problema, solo hay que saberlo.
- La contraseña de correo (Gmail) está **cifrada en la base** con
  `MAIL_SECRET_KEY` o, si no existe, con `JWT_SECRET`. Si cambias el
  `JWT_SECRET` y no tenías `MAIL_SECRET_KEY`, la contraseña guardada deja de
  poder descifrarse: hay que volver a escribirla en *Panel › Correo*. Si quieres
  evitar eso, copia el valor de `MAIL_SECRET_KEY` (o el `JWT_SECRET` viejo) tal
  cual y reutilízalo.
- La cuenta admin se recrea/actualiza con `npm run seed:admin`, así que basta
  con tener `ADMIN_*` en el `.env`.

---

## 6. Restaurar en Debian (12/13), solo con GitHub

### 6.1 Paquetes base

```bash
sudo apt update
sudo apt install -y git curl ca-certificates
curl -fsSL https://get.docker.com | sudo sh          # instala docker + compose plugin
sudo usermod -aG docker "$USER"                       # cerrar y abrir sesión después
```

### 6.2 Traer el repositorio

```bash
sudo mkdir -p /opt && sudo chown "$USER":"$USER" /opt
git clone https://github.com/<usuario>/gramalote_interactivo.git /opt/gramalote
cd /opt/gramalote
```

El repo es ahora la única fuente de verdad: `docker-compose.yml`,
`deploy/deploy.sh`, los `Dockerfile` y el snapshot en `migracion/`.

### 6.3 Directorios de datos (fuera del repo)

```bash
sudo mkdir -p /srv/gramalote/media /srv/gramalote/tiles

D=$(ls -d /opt/gramalote/migracion/*/ | tail -1)   # el snapshot más reciente
sudo cp -a "$D"/media/. /srv/gramalote/media/
sudo cp -a "$D"/tiles/*.pmtiles /srv/gramalote/tiles/ 2>/dev/null || true

sudo chown -R 1000:1000 /srv/gramalote/media   # la API corre como usuario node (uid 1000)
sudo chmod -R a+rX /srv/gramalote/media
sudo chmod -R a+rX /srv/gramalote/tiles
```

Comprueba que llegaron las fotos: `find /srv/gramalote/media -type f | wc -l`
debe coincidir con el número del `MANIFIESTO.md`.

### 6.4 Crear el `.env`

```bash
cd /opt/gramalote
cat > .env <<'EOF'
MYSQL_ROOT_PASSWORD=...
MYSQL_DATABASE=gramalote
MYSQL_USER=gramalote
MYSQL_PASSWORD=...
JWT_SECRET=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
ADMIN_NAME=Administrador
CORS_ORIGIN=https://gramalote.example
PUBLIC_SITE_URL=https://gramalote.example
TRUST_PROXY=1
MEDIA_DIR=/srv/gramalote/media
TILES_DIR=/srv/gramalote/tiles
BACKUP_ENABLED=1
EOF
chmod 600 .env
```

### 6.5 Imágenes: ya no hay ECR

En AWS las imágenes se descargaban de ECR (`docker compose pull`). Sin cuenta AWS
se compilan desde el repositorio, y para eso está el overlay versionado
`docker-compose.debian.yml`, que se aplica **encima** del `docker-compose.yml` de
producción. Lo que cambia:

| Ajuste | Por qué |
|---|---|
| `build` de `frontend` y `backend` en vez de `pull` | no hay ECR |
| publica en **8080** en lugar del 80 | no choca con un nginx/apache del sistema |
| los `.sql` apuntan a `backend/database/` | el compose base los espera en `./database/`, que en la instancia crea `deploy.sh` |
| `TRUST_PROXY_HOPS=1` | aquí solo hay un nginx delante, no CloudFront |

Se usa siempre con los dos `-f`, en ese orden:

```bash
alias gc='docker compose -f docker-compose.yml -f docker-compose.debian.yml'
gc build          # compila las dos imágenes
gc up -d          # nginx + API + MySQL
```

Ya no hace falta el `docker-compose.override.yml` manual de versiones anteriores
de este documento. El puerto se cambia en el overlay (o con `PORT`, ver 6.6).

### 6.6 Un solo comando: `deploy/local-debian.sh`

`deploy/local-debian.sh` hace las secciones 6.3 a 6.7 de esta guía de una vez y
es idempotente: si ya hay `.env`, base de datos o fotos, los respeta.

1. Instala Docker si falta y comprueba el plugin `docker compose`.
2. Copia `media/` y los `.pmtiles` del snapshot más reciente de `migracion/` a
   `/srv/gramalote/` y ajusta permisos (UID 1000 para la API, lectura para nginx).
3. Crea el `.env` con secretos nuevos y `CORS_ORIGIN`/`PUBLIC_SITE_URL` con la IP
   local de la máquina.
4. Levanta MySQL, importa el volcado **solo si la base está vacía**, compila las
   imágenes y arranca `web` + `api`.
5. Aplica migraciones, siembra la cuenta admin, abre el puerto en `ufw` si está
   activo y espera a que respondan `/healthz` y `/api/health`.

```bash
cd /opt/gramalote
sudo bash deploy/local-debian.sh                  # http://<ip-debian>:8080
PORT=9090 sudo -E bash deploy/local-debian.sh     # otro puerto
```

Al terminar imprime la URL del sitio y del panel. Desde Windows (o cualquier
máquina de la red) se abre esa misma URL; el panel queda en `/acceder` y la API
en `/api/health`. Conviene abrir el puerto si el firewall no lo permite:
`sudo ufw allow 8080/tcp`. Si la Debian es una VM en Windows con red **NAT**,
cambia el adaptador a puente o reenvía el puerto.

### 6.7 Lo mismo paso a paso

Si prefieres controlar cada paso —o el script falla a mitad—, se descompone así:

```bash
cd /opt/gramalote
set -a; . ./.env; set +a                 # MYSQL_*, ADMIN_*, MEDIA_DIR, TILES_DIR
C="docker compose -f docker-compose.yml -f docker-compose.debian.yml"

D=$(ls -d migracion/*/ | tail -1)        # snapshot más reciente
$C up -d db
until [ "$(docker inspect -f '{{.State.Health.Status}}' gramalote-db)" = healthy ]; do sleep 3; done

gunzip -c "$D"/gramalote-*.sql.gz \
  | $C exec -T db sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'

$C up -d --build
$C exec -T api node scripts/migrate.js            # «Base de datos al día»
$C exec -T -e ADMIN_EMAIL -e ADMIN_PASSWORD -e ADMIN_NAME \
  api node scripts/seed-admin.js

curl -s http://127.0.0.1:8080/healthz
curl -s http://127.0.0.1:8080/api/health
```

El volcado no crea la base: en el primer arranque el contenedor la crea con
`schema.sql` + `seed*.sql`, y el volcado **reemplaza** las tablas con los datos
reales (`DROP TABLE IF EXISTS` + `CREATE TABLE` + `INSERT`). Si una migración
quedó pendiente respecto al código (poco probable, porque el snapshot es del
mismo commit), `node scripts/migrate.js` la aplica.

Verifica los conteos contra `conteos.tsv`:

```bash
$C exec -T db sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -N -B "$MYSQL_DATABASE" -e "SHOW TABLES"' | while read t; do
  n=$($C exec -T db sh -c "exec mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" -N -B \"\$MYSQL_DATABASE\" -e 'SELECT COUNT(*) FROM \`$t\`'")
  printf '%s	%s\n' "$t" "$n"
done
```

### 6.8 Publicar el sitio (esto sí hay que decidirlo con calma)

CloudFront y el DNS son de AWS: **no se pueden recuperar desde GitHub**. Las
opciones, de menos a más trabajo:

1. **Dominio apuntando directo al servidor** con un proxy inverso que dé HTTPS:
   [Caddy](https://caddyserver.com) es el camino corto (`caddy reverse-proxy
   --from gramalote.example --to 127.0.0.1:80`).
2. **Cloudflare Tunnel**: no hay que abrir puertos ni tocar el router y el TLS
   es gratis; el sitio deja de depender de una IP elástica.
3. Mantener CloudFront apuntando al nuevo origen (requiere la cuenta AWS, que es
   justo lo que no vas a tener).

Recuerda que el `frontend` pide la API por rutas relativas (`/api`, `/media`,
`/tiles`), así que nginx sirve todo y el dominio nuevo solo necesita HTTPS y
`CORS_ORIGIN`/`PUBLIC_SITE_URL` correctos en el `.env`.

### 6.9 Despliegues futuros sin AWS

El workflow `deploy-ec2.yml` usa SSM y ECR: en Debian no sirve. Mientras tanto,
desplegar a mano es:

```bash
cd /opt/gramalote
git pull
C="docker compose -f docker-compose.yml -f docker-compose.debian.yml"
$C up -d --build
$C exec -T api node scripts/migrate.js
```

Si más adelante quieres CI, lo natural es un workflow con SSH al servidor
(llave dedicada en los *secrets* del repo) o un runner autoalojado.

---

## 7. Lo que GitHub **no** recupera

| Dependencia | Se pierde al soltar AWS | Cómo se reemplaza |
|---|---|---|
| Distribución CloudFront `E1P9GLTGDGI4RL` | Sí | Caddy/Cloudflare Tunnel + DNS del dominio |
| IP elástica `18.119.155.81` | Sí | IP del nuevo servidor / túnel |
| Imágenes en ECR | Sí | `docker compose build` (sección 6.5) |
| Usuario IAM y SSM | Sí | despliegue manual o por SSH |
| Certificados TLS | Sí (eran de `*.cloudfront.net`) | Let's Encrypt/Caddy o Cloudflare |
| Contraseña SMTP guardada cifrada | Sí, si cambia el `JWT_SECRET` | Reescribirla en *Panel › Correo* |
| `.env` de producción | Sí | Guárdalo antes (sección 5) |
| Respaldos históricos de `/opt/gramalote/backups` | Sí | No hacen falta: el snapshot es más nuevo |

---

## 8. Orden recomendado de trabajo

1. `deploy/migracion-exportar.ps1 -SoloDiagnostico` (comprueba SSH y tamaños).
2. Exportar con `-Commit` y revisar el snapshot en GitHub (sección 4).
3. Guardar el `.env` en el gestor de contraseñas (sección 5).
4. Preparar el Debian y ensayar la restauración **con el snapshot** antes de
   apagar la EC2: `sudo bash deploy/local-debian.sh` (sección 6.6) levanta el
   sitio completo y se comprueba desde el navegador. Un ensayo vale más que
   cualquier checklist.
5. Solo cuando el ensayo funcione: DNS al servidor nuevo y dar de baja la EC2.

---

## 9. Problemas típicos

| Síntoma | Causa y solución |
|---|---|
| `Connection timed out` al ejecutar el script | El security group no abre el 22 a tu IP actual. Añádela en `sg-039d50b49a57859d8`. |
| `permission denied (publickey)` | Ruta de la llave equivocada: `-Llave C:\Users\...\.ssh\gramalote-key.pem`. |
| GitHub rechaza el push por tamaño | Algún archivo pasó de 100 MB: mira `archivos-media.tsv`, sácalo con `-SinTiles` o usa Git LFS. |
| El sitio nuevo carga sin fotos | `MEDIA_DIR` mal o permisos: `chown -R 1000:1000 /srv/gramalote/media`. |
| El mapa sale en blanco | Falta el `.pmtiles` en `/srv/gramalote/tiles` (o `VITE_MAP_PMTILES_URL` mal). Se regenera con `deploy/tiles/build-tiles.sh`. |
| El panel dice «sesión expirada» para todos | Cambiaste `JWT_SECRET`: es esperado, hay que volver a entrar. |
| Login falla con 401 y la web responde bien | La base se importó pero `users` está vacía: ejecuta `npm run seed:admin`. |
