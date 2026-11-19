#!/bin/bash
# Arranque del contenedor db: antes de iniciar MySQL, deja las claves de root y
# de la app iguales a las del .env.
#
# MySQL solo lee MYSQL_ROOT_PASSWORD / MYSQL_USER / MYSQL_PASSWORD al crear el
# volumen. Si después el volumen se reutiliza con otro .env (otro clon del repo,
# un .env regenerado...), la API queda «Access denied» y el stack no arranca.
# Con esto «docker compose up -d --build» siempre funciona: el .env manda.
#
# Cómo: con un volumen ya inicializado se levanta mysqld un momento sin red y
# sin tabla de permisos (solo accesible por un socket dentro del contenedor),
# se fijan las claves y se apaga. Los datos no se tocan. Si algo falla, se
# avisa y se sigue con el arranque normal.

DATADIR=/var/lib/mysql
SOCK=/tmp/db-arranque.sock

log() { echo "[db-arranque] $*"; }

# Comillas simples escapadas para meter un valor en un literal SQL.
sql_lit() { printf "%s" "$1" | sed "s/\\\\/\\\\\\\\/g; s/'/\\\\'/g"; }

sincronizar() {
  mysqld --user=mysql --datadir="$DATADIR" --skip-grant-tables --skip-networking \
    --socket="$SOCK" --pid-file=/tmp/db-arranque.pid --mysqlx=0 \
    --performance-schema=OFF --log-error=/tmp/db-arranque.err &
  local pid=$! i
  for i in $(seq 1 60); do
    mysqladmin --socket="$SOCK" ping >/dev/null 2>&1 && break
    kill -0 "$pid" 2>/dev/null || { log "mysqld temporal no arrancó:"; cat /tmp/db-arranque.err; return 1; }
    sleep 1
  done

  local root user pass db
  root="$(sql_lit "$MYSQL_ROOT_PASSWORD")"
  user="$(sql_lit "${MYSQL_USER:-}")"
  pass="$(sql_lit "${MYSQL_PASSWORD:-}")"
  db="${MYSQL_DATABASE:-}"

  {
    echo "FLUSH PRIVILEGES;"
    echo "ALTER USER IF EXISTS 'root'@'localhost' IDENTIFIED BY '$root';"
    echo "ALTER USER IF EXISTS 'root'@'%' IDENTIFIED BY '$root';"
    if [ -n "$user" ] && [ -n "$pass" ]; then
      echo "CREATE USER IF NOT EXISTS '$user'@'%' IDENTIFIED BY '$pass';"
      echo "ALTER USER '$user'@'%' IDENTIFIED BY '$pass';"
      [ -n "$db" ] && echo "GRANT ALL PRIVILEGES ON \`$db\`.* TO '$user'@'%';"
    fi
    echo "FLUSH PRIVILEGES;"
  } | mysql --socket="$SOCK" -uroot
  local rc=$?

  mysqladmin --socket="$SOCK" -uroot -p"$MYSQL_ROOT_PASSWORD" shutdown >/dev/null 2>&1 \
    || kill "$pid" 2>/dev/null
  wait "$pid" 2>/dev/null
  return $rc
}

# Solo cuando se va a arrancar el servidor (los argumentos son mysqld o sus
# opciones) y el volumen ya tiene una base creada.
case "${1:-}" in
  mysqld | -*)
    if [ -d "$DATADIR/mysql" ] && [ -n "${MYSQL_ROOT_PASSWORD:-}" ]; then
      if sincronizar; then
        log "claves sincronizadas con el .env"
      else
        log "AVISO: no se pudieron sincronizar las claves; se arranca igual"
      fi
    fi
    ;;
esac

exec docker-entrypoint.sh "$@"
