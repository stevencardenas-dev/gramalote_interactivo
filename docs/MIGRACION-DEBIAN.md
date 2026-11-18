# Migración de la EC2 (Amazon Linux) a Debian

Este documento explica cómo dejar todo lo que hoy vive en la EC2 guardado en el
repositorio de GitHub, y cómo reconstruir el sitio en un servidor Debian
**cuando lo único a lo que tendrás acceso es el repositorio**: sin consola de
AWS, sin perfil IAM y sin llave SSH.

> El nombre del documento y del script (`levantar-debian.sh`) es histórico: el
> stack es el mismo en cualquier Linux con Docker y systemd. El script detecta
> Ubuntu, Fedora/RHEL/Rocky/Alma, openSUSE y Arch, instala Docker con el gestor
> de paquetes que haya, abre el puerto en `ufw` **o** `firewalld` y añade `:z` a
> los montajes cuando SELinux está en enforcing. Los pasos manuales de este
> documento son los de Debian/Ubuntu (`apt`).

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

> Si vas a usar el script de la sección 6.6, **sáltate este paso**: él instala
> Docker con `apt`, `dnf`, `zypper` o `pacman` según la distribución.

```bash
sudo apt update
sudo apt install -y git curl ca-certificates
curl -fsSL https://get.docker.com | sudo sh          # instala docker + compose plugin
sudo usermod -aG docker "$USER"                       # cerrar y abrir sesión después
```

Necesita **Docker Compose ≥ 2.24** solo si la máquina tiene **SELinux en
enforcing** (RHEL/Fedora/Rocky/Alma): el `compose-selinux.yml` que genera
`levantar-debian.sh` usa la etiqueta YAML `!override`. En Debian/Ubuntu no hace
falta. Aun así, el paquete `docker-compose-v2` de los repos de Ubuntu 22.04 es
más viejo que el resto del stack, así que instala Docker con `get.docker.com`
(lo que hace el script), no con `apt`.

### 6.2 Traer el repositorio

```bash
sudo mkdir -p /opt && sudo chown "$USER":"$USER" /opt
git clone https://github.com/<usuario>/gramalote_interactivo.git /opt/gramalote
cd /opt/gramalote
```

El repo es ahora la única fuente de verdad: `docker-compose.yml`,
`deploy/desplegar-ec2.sh` (EC2), `deploy/levantar-debian.sh` (este servidor), los
`Dockerfile` y el snapshot en `migracion/`.

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

En AWS las imágenes se descargan ya hechas de ECR
(`docker compose -f docker-compose.yml -f docker-compose.aws.yml pull`). Sin
cuenta AWS se compilan desde el repositorio, y eso es lo que hace el
`docker-compose.yml` de la raíz, que ya es el archivo **local** por defecto
(`docker compose up -d --build`). El `docker-compose.aws.yml` es solo el overlay
de producción. Diferencias entre los dos entornos:

| Ajuste | Por qué |
|---|---|
| `build` de `frontend` y `backend` en el base; `image` de ECR solo en el overlay | no hay ECR fuera de AWS |
| publica en **8080** (base) y en el 80 (overlay de AWS) | 8080 no choca con un nginx/apache del sistema; el 80 es el origen de CloudFront |
| los `.sql` apuntan a `backend/database/` | es la ruta del repo; `deploy/desplegar-ec2.sh` los deja ahí también en la instancia |
| `TRUST_PROXY_HOPS=1` (base) y `2` (overlay) | aquí solo hay un nginx delante; en AWS, CloudFront y nginx |

Local se usa el archivo corto:

```bash
docker compose build          # compila las dos imágenes
docker compose up -d         # nginx + API + MySQL en :8080
```

Ya no hace falta el `docker-compose.override.yml` manual de versiones anteriores
de este documento ni el antiguo `docker-compose.debian.yml`.

### 6.6 Un solo comando: `deploy/levantar-debian.sh`

`deploy/levantar-debian.sh` hace las secciones 6.3 a 6.7 de esta guía de una vez
y es idempotente y repetible: cada ejecución deja el sitio con **los datos del
snapshot más reciente de `migracion/`** (base, usuarios del panel, fotos y mapa)
y vuelve a levantar el stack.

1. Detecta la distribución e instala Docker si falta (`get.docker.com` en
   Debian/Ubuntu/Fedora/RHEL; `zypper`/`pacman` en openSUSE/Arch), y comprueba
   que el plugin `docker compose` sea ≥ 2.24 (solo hace falta para el
   `compose-selinux.yml`, ver 6.1).
2. Sincroniza `media/` y los `.pmtiles` del snapshot a `/srv/gramalote/media` y `/srv/gramalote/tiles`, y
   ajusta permisos (UID 1000 para la API, lectura para nginx). Si **SELinux** está
   en enforcing (RHEL/Fedora/Rocky/Alma) genera
   `/srv/gramalote/compose-selinux.yml` con `:z` en los montajes; en el resto no
   existe ese archivo y no se usa.
3. Crea el `.env` con secretos nuevos y `CORS_ORIGIN`/`PUBLIC_SITE_URL` con la IP
   local de la máquina (si ya existe, lo reutiliza y solo completa lo que falte).
4. Levanta MySQL y **restaura el volcado cuando el snapshot cambió**: guarda el
   sha256 del último importado en `/srv/gramalote/estado-snapshot`. Antes de pisar
   una base con datos deja un respaldo en `/srv/gramalote/respaldos/`. Si el
   sha256 coincide, no toca los datos.
5. Comprueba fila por fila contra `conteos.tsv` y avisa de las diferencias.
6. Compila las imágenes, arranca `web` + `api`, aplica migraciones y abre el
   puerto en `ufw` o `firewalld` si están activos (con `nftables`/`iptables` a
   mano solo avisa con el comando exacto).
7. **No toca los usuarios**: los del volcado conservan sus contraseñas de la
   EC2. Solo siembra la cuenta del `.env` si `admin_users` quedó vacía, o con
   `--rotar-admin`.
8. Espera `/healthz` y `/api/health` y comprueba que una foto real de `/media`
   responde 200.

Si el repositorio está en `/root` (como en la VM actual), hay que ejecutarlo como
root (`su -`); un usuario normal sin `sudo` no puede ni leer el `.env`.

```bash
cd /opt/gramalote
sudo bash deploy/levantar-debian.sh                  # http://<ip-debian>:8080
PORT=9090 sudo -E bash deploy/levantar-debian.sh     # otro puerto
sudo bash deploy/levantar-debian.sh --forzar-datos   # reimporta el volcado
sudo bash deploy/levantar-debian.sh --rotar-admin    # rota la clave del .env
```

Para tomar un snapshot nuevo desde la EC2 (con la llave SSH todavía en mano):

```powershell
powershell -File deploy/migracion-exportar.ps1
```

Y luego se vuelve a ejecutar `levantar-debian.sh`: al cambiar el sha256 del
volcado, restaura la base nueva conservando los usuarios y las contraseñas.

Al terminar imprime la URL del sitio y del panel. Desde Windows (o cualquier
máquina de la red) se abre esa misma URL; el panel queda en `/acceder` y la API
en `/api/health`. El script abre el puerto él mismo si encuentra `ufw` o
`firewalld` activos; si no, avisa con el comando que hay que lanzar. Si la Debian
es una VM en Windows con red **NAT**, cambia el adaptador a puente o reenvía el
puerto.

### 6.7 Lo mismo paso a paso

Si prefieres controlar cada paso —o el script falla a mitad—, se descompone así:

```bash
cd /opt/gramalote
set -a; . ./.env; set +a                 # MYSQL_*, ADMIN_*, MEDIA_DIR, TILES_DIR
C="docker compose"                       # el compose base ya es el local

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

### 6.9 Actualizar un despliegue existente

`levantar-debian.sh` **no hace `git pull`**: el orden es código primero, script
después. El script sí recompila siempre (con caché de Docker, así que si el
código no cambió no recrea nada), aplica migraciones, sincroniza fotos y mapa y
vuelve a comprobar el sitio.

| Qué cambió | Qué hacer | Qué toca |
|---|---|---|
| **Código** (frontend/backend) | `cd /opt/gramalote && sudo git pull` y luego `sudo bash deploy/levantar-debian.sh --sin-fotos` | Recompila y, si la imagen cambió, recrea `web`/`api`; aplica migraciones. No toca base, fotos ni mapa. |
| **Fotos** subidas desde el panel de producción | Snapshot nuevo (sección 3) + `git pull` + script **sin** `--sin-fotos` | Copia `media/` encima (no borra: lo subido en este servidor se queda). |
| **Mapa** (`.pmtiles`) | Regenerarlo con `deploy/tiles/build-tiles.sh` (dejando `OUT` dentro del snapshot) o copiar el archivo a `/srv/gramalote/tiles/` | nginx lo sirve del disco: reemplazarlo basta. Solo reinicia si además recompilas. |
| **Datos** (fichas, usuarios, textos) | Panel del sitio, o snapshot nuevo | Con snapshot nuevo, el script respalda la base actual y restaura la del volcado. |
| **Todo a la vez** | Snapshot nuevo con `pwsh -File deploy/migracion-exportar.ps1 -Commit`, `git pull` y `bash deploy/levantar-debian.sh` sin flags | Es el escenario completo: base + usuarios + fotos + mapa + código. |

Trampas que conviene saber:

- **El `.pmtiles` del snapshot pisa el del servidor** en cada ejecución (salvo
  `--sin-fotos`). Si refrescaste el mapa a mano, guárdalo también en el snapshot
  o ejecuta con `--sin-fotos` las veces siguientes.
- `/tiles/` se sirve con `Cache-Control: max-age=86400`: tras cambiar el mapa,
  el navegador puede seguir con el viejo hasta un día (recarga forzada). El
  nombre del archivo lo fija el build (`VITE_MAP_PMTILES_URL`), así que si lo
  renombras hay que recompilar el frontend.
- Si restauras un snapshot **antiguo**, la base vuelve a ese estado: las fotos
  subidas después dejan de estar referenciadas aunque los archivos sigan en
  `/srv/gramalote/media` (quedan huérfanos, no rompen nada).
- El aviso «N tabla(s) no coinciden» de `conteos.tsv` es normal si el sitio se
  usó después del snapshot; no es un fallo del despliegue.
- El script avisa (`AVISO`) pero no falla si una tabla difiere o si una
  migración no se pudo aplicar: mira el final del log antes de darlo por bueno.

Cuando la EC2 ya no exista, «todo» deja de venir de un snapshot: las fotos
nuevas se suben desde el panel de este servidor (viven en `/srv/gramalote/media`),
los datos se editan en el panel y solo el **código** llega por `git pull`. El
snapshot queda como respaldo histórico y como forma de resembrar la base.

Si más adelante quieres CI para el servidor, lo natural es un workflow con SSH
(con llave dedicada en los *secrets* del repo) o un runner autoalojado; hoy no
existe.

### 6.10 Desmontar el stack

`deploy/desmontar-debian.sh` hace lo contrario del anterior y **no necesita el
repositorio**: localiza los contenedores, la red, el volumen y las imágenes por
nombre y por las etiquetas de `docker compose`, así que funciona aunque ya hayas
borrado la carpeta del proyecto (que es justo lo que deja `gramalote-web`
sirviendo en el `:8080` sin nada desde donde hacer `docker compose down`).

```bash
sudo bash deploy/desmontar-debian.sh --estado        # solo enseña qué hay
sudo bash deploy/desmontar-debian.sh                 # contenedores + red + imágenes
sudo bash deploy/desmontar-debian.sh --borrar-datos  # + /srv/gramalote y el volumen
sudo bash deploy/desmontar-debian.sh --todo          # + mysql:8.4 y el motor Docker
sudo bash deploy/desmontar-debian.sh --instalar      # copia fija fuera del repo
```

- Sin opciones **conserva los datos** (`/srv/gramalote` y el volumen
  `gramalote_gramalote_db`); `--borrar-datos` los elimina y `--todo` añade la
  imagen base y la desinstalación de Docker. Para dejarlo todo limpio **menos el
  motor** (la máquina conserva Docker y el grupo `docker`): `--borrar-datos
  --borrar-base`.
- Cierra la regla `8080/tcp` de `ufw` y borra el clon del repo si lo encuentra
  (`/opt/gramalote`, `/root/gramalote_interactivo`, `/root/gramalote`,
  `/srv/gramalote-interactivo`, el directorio actual o el que pase `--repo=RUTA`).
- Si el propio script está dentro del repo que va a borrar, se relanza desde
  `/tmp` para no quedarse sin archivo a medio ejecutar.
- `--instalar` deja una copia en `/usr/local/sbin/gramalote-desmontar` y otra en
  `/root/gramalote-desmontar.sh`: eso es lo que sobrevive a `rm -rf` del repo.


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
   apagar la EC2: `sudo bash deploy/levantar-debian.sh` (sección 6.6) levanta el
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
| La VM muestra los datos de ejemplo: sin usuarios del panel y las fichas con `cover: null` | La base tiene lo de `seed.sql` y el volcado nunca se importó (era el comportamiento del script anterior). `levantar-debian.sh` compara el sha256 del snapshot con `/srv/gramalote/estado-snapshot`; si no coincide restaura, y si quieres repetirlo: `--forzar-datos`. |
| `ERROR 1064 (42000) ... near ' */'` al importar el volcado | mysqldump deja el `;` final del cuerpo del trigger dentro del comentario de versión y MySQL corta ahí la sentencia. El script quita ese `;` al importar. A mano: `gunzip -c volcado.sql.gz \| sed 's/; \*\/;;$/ *\/;;/' \| docker compose exec -T db sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" gramalote'`. |
| El mapa sale en blanco | Falta el `.pmtiles` en `/srv/gramalote/tiles` (o `VITE_MAP_PMTILES_URL` mal). Se regenera con `deploy/tiles/build-tiles.sh`. |
| El panel dice «sesión expirada» para todos | Cambiaste `JWT_SECRET`: es esperado, hay que volver a entrar. |
| Login falla con 401 y la web responde bien | La base se importó pero `users` está vacía: ejecuta `npm run seed:admin`. |
| En RHEL/Fedora/Rocky el sitio carga pero `/media` da **403** y el panel no deja subir fotos | SELinux en enforcing con el contexto del host. El script genera `/srv/gramalote/compose-selinux.yml` con `:z`; si lo lanzaste a mano, añade `:z` a los montajes o ejecuta `sudo chcon -Rt container_file_t /srv/gramalote`. |
| Desde otra máquina no se ve el sitio, pero `curl localhost:8080` sí funciona | Cortafuegos del host: `sudo firewall-cmd --permanent --add-port=8080/tcp && sudo firewall-cmd --reload` (firewalld) o `sudo ufw allow 8080/tcp` (ufw). El script lo hace solo si detecta alguno activo. |
| `unexpected tag !override` al arrancar | `docker compose` < 2.24 y SELinux en enforcing (el `compose-selinux.yml` generado usa esa etiqueta). Instala Docker con `get.docker.com` en vez del paquete `docker-compose-v2` de la distro. |
| `git clone` va a ~100 KB/s y tarda horas (con la red de la máquina a 10 MB/s) | La VM resuelve GitHub por IPv6 y esa ruta no funciona: `curl -6` da 0 B/s e `curl -4` va a 10 MB/s. Prefiere IPv4 con `echo 'precedence ::ffff:0:0/96  100' >> /etc/gai.conf` (o desactiva IPv6 en el adaptador de la VM) y repite el clon. |
