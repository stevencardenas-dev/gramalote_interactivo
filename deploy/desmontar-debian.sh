#!/usr/bin/env bash
# Desmonta por completo lo que levanta deploy/levantar-debian.sh: contenedores,
# red, volumen, imágenes, /srv/gramalote y (si se pide) el propio repositorio y
# el motor de Docker.
#
# No necesita el repositorio para funcionar: encuentra todo por nombre y por las
# etiquetas de docker compose. Por eso se puede copiar fuera del repo (o quedar
# instalado con --instalar) y ejecutarlo cuando la carpeta del proyecto ya no
# existe. Ese es justo el caso que deja contenedores sirviendo en el :8080 tras
# borrar el repo.
#
# Uso:
#   sudo bash desmontar-debian.sh                  # muestra lo que hay y pregunta
#   sudo bash desmontar-debian.sh --estado         # solo diagnóstico, no borra
#   sudo bash desmontar-debian.sh --si             # sin preguntar (contenedores,
#                                                  #  red, imágenes del proyecto)
#   sudo bash desmontar-debian.sh --si --borrar-datos   # + /srv/gramalote, volumen
#                                                  #  y el .env de cada clon
#   sudo bash desmontar-debian.sh --si --todo      # + mysql:8.4 y el motor Docker
#   sudo bash desmontar-debian.sh --instalar       # copia a /usr/local/sbin y /root
#
# Por defecto NO se borran los datos: /srv/gramalote (fotos, mapa y respaldos de
# la base) y el volumen gramalote_gramalote_db se conservan salvo --borrar-datos.
# Antes de usar --borrar-datos copia /srv/gramalote/respaldos si te importa algo.
#
# Variables: PROYECTO (gramalote), PUERTO (8080), BASE_DIR (/srv/gramalote).
# Opciones: --si · --borrar-datos · --todo · --docker · --estado · --instalar
#           --repo=RUTA · --base=RUTA · --puerto=N
# Todo salvo el motor Docker (que se quede instalado): --borrar-datos --borrar-base
set -uo pipefail

PROYECTO="${PROYECTO:-gramalote}"
PUERTO="${PUERTO:-8080}"
BASE_DIR="${BASE_DIR:-/srv/gramalote}"
CONTENEDORES=(gramalote-web gramalote-api gramalote-db)
RED="gramalote_gramalote"
VOLUMEN="gramalote_gramalote_db"
IMAGENES_APP=(gramalote-web:local gramalote-api:local)
IMAGEN_BASE="mysql:8.4"
DESTINO="/usr/local/sbin/gramalote-desmontar"

SI=0
BORRAR_DATOS=0
BORRAR_BASE=0
BORRAR_DOCKER=0
SOLO_ESTADO=0
REPO=""

log() { printf '\n==> %s\n' "$*"; }
aviso() { printf 'AVISO: %s\n' "$*" >&2; }
ok() { printf '    ok: %s\n' "$*"; }
fallo() { printf '    fallo: %s\n' "$*" >&2; }
# Imprime una lista guardada en una variable, una entrada por línea.
imprimir() {
  local l
  while IFS= read -r l; do
    [ -n "$l" ] && printf '      %s\n' "$l"
  done <<< "${1:-}"
}

ayuda() {
  sed -n '2,29p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

for arg in "$@"; do
  case "$arg" in
    --si|-y|--yes) SI=1 ;;
    --borrar-datos) BORRAR_DATOS=1 ;;
    --borrar-base) BORRAR_BASE=1 ;;
    --todo) BORRAR_BASE=1; BORRAR_DATOS=1; BORRAR_DOCKER=1 ;;
    --docker) BORRAR_DOCKER=1 ;;
    --estado) SOLO_ESTADO=1 ;;
    --instalar) INSTALAR=1 ;;
    --puerto=*) PUERTO="${arg#*=}" ;;
    --base=*) BASE_DIR="${arg#*=}" ;;
    --repo=*) REPO="${arg#*=}" ;;
    --ayuda|-h|--help) ayuda; exit 0 ;;
    *) printf 'ERROR: opción desconocida: %s (usa --ayuda)\n' "$arg" >&2; exit 1 ;;
  esac
done

# Quitar el motor borra /var/lib/docker, donde vive el volumen: los datos se
# pierden igual, así que se pide lo mismo que --borrar-datos (y se avisa).
if [ "$BORRAR_DOCKER" = 1 ]; then
  BORRAR_DATOS=1
fi

# --- Instalarse fuera del repo ---------------------------------------------
if [ "${INSTALAR:-0}" = 1 ]; then
  if [ "$(id -u)" -ne 0 ]; then
    printf 'ERROR: --instalar necesita root. Usa: sudo bash %s --instalar\n' "${BASH_SOURCE[0]}" >&2
    exit 1
  fi
  log "Instalando una copia fuera del repositorio"
  install -m 0755 "${BASH_SOURCE[0]}" "$DESTINO"
  ok "$DESTINO"
  # Segunda copia en /root, por si se pierde /usr/local/sbin o se entra con su -.
  install -m 0755 "${BASH_SOURCE[0]}" /root/gramalote-desmontar.sh
  ok "/root/gramalote-desmontar.sh"
  cat <<EOF

Listo: el desmontaje ya vive fuera del repo. Cuando quieras borrar todo:

  sudo $DESTINO              # pregunta antes de tocar nada
  sudo $DESTINO --estado     # solo enseña qué hay

EOF
  exit 0
fi

if [ "$(id -u)" -ne 0 ]; then
  printf 'ERROR: ejecútalo como root:  sudo bash %s\n' "${BASH_SOURCE[0]}" >&2
  exit 1
fi

# Repositorio: el que se indique con --repo, o los que parezcan un clon del
# proyecto (frontend + backend + docker-compose.yml).
detectar_repos() {
  local d
  if [ -n "$REPO" ]; then
    printf '%s\n' "$REPO"
    return 0
  fi
  for d in /opt/gramalote /root/gramalote_interactivo /root/gramalote /srv/gramalote-interactivo \n    /home/*/gramalote_interactivo /home/*/gramalote "$PWD"; do
    [ -d "$d/frontend" ] && [ -d "$d/backend" ] && [ -f "$d/docker-compose.yml" ] && printf '%s\n' "$d"
  done | awk '!visto[$0]++'
}

REPOS_ACTUALES="$(detectar_repos)"

# Si el script vive dentro de un repositorio que va a borrarse, bash se quedaría
# sin archivo a medio ejecutar. Se relanza desde una copia en /tmp y esa copia se
# borra al salir.
if [ "${REENLAZADO:-0}" = 0 ] && [ "$SOLO_ESTADO" = 0 ]; then
  yo="$(readlink -f "${BASH_SOURCE[0]}")"
  for d in $REPOS_ACTUALES; do
    case "$yo" in
      "$d"/*)
        aviso "este script está dentro de $d; se relanza desde /tmp para poder borrarlo"
        tmp="$(mktemp /tmp/desmontar-debian.XXXXXX.sh)"
        cp "$yo" "$tmp"
        REENLAZADO=1 exec bash "$tmp" "$@"
        ;;
    esac
  done
else
  trap 'rm -f "$0"' EXIT
fi

if ! command -v docker >/dev/null 2>&1; then
  aviso "Docker no está instalado: no hay contenedores del proyecto que borrar."
  HAY_DOCKER=0
else
  HAY_DOCKER=1
  if ! docker info >/dev/null 2>&1; then
    aviso "Docker está instalado pero el demonio no responde; se arranca."
    systemctl start docker >/dev/null 2>&1 || true
    sleep 2
    docker info >/dev/null 2>&1 || { aviso "El demonio sigue caído: no se pueden borrar contenedores."; HAY_DOCKER=0; }
  fi
fi

# --- Qué hay (por nombre y por etiquetas de compose) -----------------------
lista_contenedores() {
  [ "$HAY_DOCKER" = 1 ] || return 0
  {
    docker ps -a --format '{{.Names}}' 2>/dev/null \
      --filter "label=com.docker.compose.project=$PROYECTO"
    for c in "${CONTENEDORES[@]}"; do
      docker ps -a --format '{{.Names}}' --filter "name=^${c}$" 2>/dev/null
    done
  } | grep -v '^$' | awk '!visto[$0]++'
}

lista_redes() {
  [ "$HAY_DOCKER" = 1 ] || return 0
  {
    docker network ls --format '{{.Name}}' --filter "label=com.docker.compose.project=$PROYECTO" 2>/dev/null
    docker network ls --format '{{.Name}}' --filter "name=^${RED}$" 2>/dev/null
  } | grep -v '^$' | awk '!visto[$0]++'
}

lista_volumenes() {
  [ "$HAY_DOCKER" = 1 ] || return 0
  {
    docker volume ls --format '{{.Name}}' --filter "label=com.docker.compose.project=$PROYECTO" 2>/dev/null
    docker volume ls --format '{{.Name}}' --filter "name=^${VOLUMEN}$" 2>/dev/null
  } | grep -v '^$' | awk '!visto[$0]++'
}

lista_imagenes() {
  [ "$HAY_DOCKER" = 1 ] || return 0
  for i in "${IMAGENES_APP[@]}"; do
    docker image inspect "$i" >/dev/null 2>&1 && printf '%s\n' "$i"
  done
  if [ "$BORRAR_BASE" = 1 ]; then
    docker image inspect "$IMAGEN_BASE" >/dev/null 2>&1 && printf '%s\n' "$IMAGEN_BASE"
  fi
}

puerto_ocupado() {
  if command -v ss >/dev/null 2>&1; then
    ss -ltnp 2>/dev/null | grep -q ":${PUERTO} "
  else
    netstat -ltnp 2>/dev/null | grep -q ":${PUERTO} "
  fi
}

contenedores_8080() {
  [ "$HAY_DOCKER" = 1 ] || return 0
  docker ps -a --format '{{.Names}}' --filter "publish=${PUERTO}" 2>/dev/null
}

CONTENEDORES_ACTUALES="$(lista_contenedores)"
REDES_ACTUALES="$(lista_redes)"
VOLUMENES_ACTUALES="$(lista_volumenes)"
IMAGENES_ACTUALES="$(lista_imagenes)"
OTROS_8080="$(contenedores_8080 | while read -r n; do
  [ -n "$n" ] || continue
  printf '%s\n' "$CONTENEDORES_ACTUALES" | grep -qxF "$n" && continue
  printf '%s\n' "$n"
done)"

log "Estado actual del proyecto «$PROYECTO»"
if [ -n "$CONTENEDORES_ACTUALES" ]; then
  printf '    contenedores:\n'; imprimir "$CONTENEDORES_ACTUALES"
else
  printf '    contenedores: ninguno\n'
fi
if [ -n "$REDES_ACTUALES" ]; then
  printf '    redes:\n'; imprimir "$REDES_ACTUALES"
else
  printf '    redes: ninguna\n'
fi
if [ -n "$VOLUMENES_ACTUALES" ]; then
  printf '    volúmenes (datos de MySQL):\n'; imprimir "$VOLUMENES_ACTUALES"
else
  printf '    volúmenes: ninguno\n'
fi
if [ -n "$IMAGENES_ACTUALES" ]; then
  printf '    imágenes:\n'; imprimir "$IMAGENES_ACTUALES"
else
  printf '    imágenes: ninguna del proyecto\n'
fi
if [ -d "$BASE_DIR" ]; then
  printf '    %s: %s archivo(s), %s\n' "$BASE_DIR" \
    "$(find "$BASE_DIR" -type f 2>/dev/null | wc -l)" \
    "$(du -sh "$BASE_DIR" 2>/dev/null | cut -f1)"
  [ -d "$BASE_DIR/respaldos" ] && printf '      respaldos de la base: %s archivo(s)\n' \
    "$(find "$BASE_DIR/respaldos" -type f 2>/dev/null | wc -l)"
else
  printf '    %s: no existe\n' "$BASE_DIR"
fi
if [ -n "$REPOS_ACTUALES" ]; then
  printf '    repositorios:\n'; imprimir "$REPOS_ACTUALES"
else
  printf '    repositorios: no encontrados\n'
fi
puerto_ocupado && printf '    puerto %s: OCUPADO\n' "$PUERTO" || printf '    puerto %s: libre\n' "$PUERTO"
if [ -n "${OTROS_8080:-}" ]; then
  printf '    publican el %s y no son del proyecto (no se tocan):\n' "$PUERTO"; imprimir "$OTROS_8080"
fi
command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q 'Status: active' \
  && printf '    ufw: activo\n' || printf '    ufw: inactivo o no instalado\n'

if [ "$SOLO_ESTADO" = 1 ]; then
  printf '\n--estado: no se ha borrado nada.\n'
  exit 0
fi

# --- Confirmación ----------------------------------------------------------
printf '\nSe va a desmontar el stack de Gramalote. Esto es lo que se eliminará:\n\n'
printf '  · contenedores:\n'; imprimir "${CONTENEDORES_ACTUALES:-ninguno}"
printf '  · red:\n'; imprimir "${REDES_ACTUALES:-ninguna}"
printf '  · imágenes:\n'; imprimir "${IMAGENES_ACTUALES:-ninguna}"
if [ "$BORRAR_DATOS" = 1 ]; then
  printf '  · volúmenes (¡se pierde la base!):\n'; imprimir "${VOLUMENES_ACTUALES:-ninguno}"
  printf '  · carpeta (¡se pierden fotos, mapa y respaldos!):\n'; imprimir "$BASE_DIR"
fi
if [ "$BORRAR_BASE" = 1 ]; then
  printf '  · imagen base:\n'; imprimir "$IMAGEN_BASE"
fi
if [ "$BORRAR_DOCKER" = 1 ]; then
  printf '  · motor Docker: paquetes, /var/lib/docker y /var/lib/containerd\n'
fi
if [ -n "$REPOS_ACTUALES" ]; then
  printf '  · repositorios:\n'; imprimir "$REPOS_ACTUALES"
fi
if [ "$BORRAR_DATOS" = 0 ]; then
  printf '\nLos datos se conservan (usa --borrar-datos para borrarlos también).\n'
fi

if [ "$SI" = 0 ]; then
  printf '\n¿Continuar? [s/N] '
  resp=""
  if [ -r /dev/tty ]; then
    read -r resp < /dev/tty || resp=""
  else
    read -r resp || resp=""
  fi
  case "${resp,,}" in
    s|si|sí|y|yes) : ;;
    *) printf 'Cancelado: no se ha tocado nada.\n'; exit 0 ;;
  esac
fi

# --- Contenedores ----------------------------------------------------------
if [ -n "$CONTENEDORES_ACTUALES" ]; then
  log "Parando y borrando contenedores"
  # shellcheck disable=SC2086
  docker rm -f $CONTENEDORES_ACTUALES >/dev/null 2>&1 \
    && ok "contenedores eliminados" || fallo "no se pudieron borrar todos los contenedores"
else
  log "Contenedores: no hay nada que borrar"
fi

# --- Red -------------------------------------------------------------------
if [ -n "$REDES_ACTUALES" ]; then
  log "Borrando red"
  for r in $REDES_ACTUALES; do
    docker network rm "$r" >/dev/null 2>&1 && ok "red $r" || fallo "red $r (¿algún contenedor la sigue usando?)"
  done
else
  log "Red: no hay nada que borrar"
fi

# --- Volumen y datos -------------------------------------------------------
if [ "$BORRAR_DATOS" = 1 ]; then
  if [ -n "$VOLUMENES_ACTUALES" ]; then
    log "Borrando volúmenes (se pierde la base de datos)"
    for v in $VOLUMENES_ACTUALES; do
      docker volume rm -f "$v" >/dev/null 2>&1 && ok "volumen $v" || fallo "volumen $v"
    done
  else
    log "Volúmenes: no hay nada que borrar"
  fi

  # Cada clon guarda en su .env las claves con las que se creó el volumen. Con
  # el volumen borrado esas claves ya no sirven, y si quedan dos clones con
  # .env distintos el siguiente arranque mezcla unas con otras. Se borran para
  # que levantar-debian.sh genere uno nuevo y coherente.
  for d in $REPOS_ACTUALES; do
    if [ -f "$d/.env" ]; then
      rm -f "$d/.env" && ok "$d/.env eliminado" || fallo "no se pudo borrar $d/.env"
    fi
  done

  if [ -d "$BASE_DIR" ]; then
    log "Borrando $BASE_DIR"
    rm -rf --one-file-system "$BASE_DIR" && ok "$BASE_DIR eliminado" || fallo "no se pudo borrar $BASE_DIR"
  else
    log "$BASE_DIR: no existe"
  fi
fi

# --- Imágenes --------------------------------------------------------------
if [ -n "$IMAGENES_ACTUALES" ]; then
  log "Borrando imágenes"
  for i in $IMAGENES_ACTUALES; do
    docker image rm -f "$i" >/dev/null 2>&1 && ok "imagen $i" || fallo "imagen $i (en uso por otro contenedor)"
  done
  # Capas y caché de compilación que dejaron los dos Dockerfile.
  docker builder prune -f >/dev/null 2>&1 || true
  docker image prune -f >/dev/null 2>&1 || true
fi

# --- Puerto en ufw ---------------------------------------------------------
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q 'Status: active'; then
  log "Cerrando el puerto ${PUERTO} en ufw"
  ufw --force delete allow "${PUERTO}/tcp" >/dev/null 2>&1 && ok "regla ${PUERTO}/tcp eliminada" \
    || printf '    (no había regla para %s/tcp)\n' "$PUERTO"
fi

# --- Repositorio -----------------------------------------------------------
if [ -n "$REPOS_ACTUALES" ]; then
  log "Borrando el repositorio"
  for d in $REPOS_ACTUALES; do
    # Protección: nunca borrar la raíz ni una ruta del sistema.
    case "${d%/}" in
      ""|/bin|/boot|/dev|/etc|/home|/lib|/lib64|/media|/mnt|/opt|/proc|/root|/run|/sbin|/srv|/sys|/tmp|/usr|/var)
        fallo "se omite ruta del sistema: $d"; continue ;;
    esac
    rm -rf --one-file-system "$d" && ok "$d eliminado" || fallo "no se pudo borrar $d"
  done
fi

# --- Motor Docker ----------------------------------------------------------
if [ "$BORRAR_DOCKER" = 1 ]; then
  log "Desinstalando el motor Docker"
  systemctl stop docker docker.socket containerd >/dev/null 2>&1 || true
  export DEBIAN_FRONTEND=noninteractive
  dpkg -P --force-all docker-ce docker-ce-cli docker-ce-rootless-extras \
    containerd.io docker-buildx-plugin docker-compose-plugin docker.io \
    docker-compose docker-compose-v2 >/dev/null 2>&1 || true
  apt-get -y autoremove --purge >/dev/null 2>&1 || true
  rm -rf /var/lib/docker /var/lib/containerd /etc/docker /etc/apt/sources.list.d/docker.list
  ok "Docker desinstalado"
fi

# --- Comprobación ----------------------------------------------------------
log "Comprobación final"
if [ "$HAY_DOCKER" = 1 ] && [ "$BORRAR_DOCKER" = 0 ]; then
  quedan="$(lista_contenedores)"
  [ -z "$quedan" ] && ok "no queda ningún contenedor del proyecto" || fallo "siguen: $quedan"
  quedan="$(lista_redes)"
  [ -z "$quedan" ] && ok "no queda ninguna red del proyecto" || fallo "siguen: $quedan"
  if [ "$BORRAR_DATOS" = 1 ]; then
    quedan="$(lista_volumenes)"
    [ -z "$quedan" ] && ok "no queda ningún volumen del proyecto" || fallo "siguen: $quedan"
  else
    printf '    (los volúmenes se conservan a propósito)\n'
  fi
fi
if puerto_ocupado; then
  fallo "el puerto ${PUERTO} sigue ocupado:"
  command -v ss >/dev/null 2>&1 && ss -ltnp 2>/dev/null | grep ":${PUERTO} "
else
  ok "el puerto ${PUERTO} quedó libre"
fi
if [ "$BORRAR_DATOS" = 1 ]; then
  [ -d "$BASE_DIR" ] && fallo "$BASE_DIR sigue existiendo" || ok "$BASE_DIR eliminado"
fi

cat <<'EOF'

Desmontaje terminado. Si quieres volver a levantarlo, con el repo de nuevo:

  sudo bash deploy/levantar-debian.sh

EOF
