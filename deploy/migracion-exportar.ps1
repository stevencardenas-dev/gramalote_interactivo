<#
.SYNOPSIS
  Baja de la EC2 todo lo que no vive en Git y lo deja en migracion\<fecha>\ para
  poder reconstruir el sitio en Debian solo con el repositorio de GitHub.

.DESCRIPTION
  Se trae, desde la instancia de producción:

    - gramalote-<fecha>.sql.gz  volcado completo (esquema + datos, listo para importar)
    - esquema-<fecha>.sql       solo la estructura, para revisarla y compararla
    - conteos.tsv              filas por tabla (para comprobar la importación)
    - media\                   fotos subidas desde el panel (/opt/gramalote/media)
    - tiles\                   mapa PMTiles (/opt/gramalote/tiles) — sin él el mapa sale vacío
    - MANIFIESTO.md            tamaños, checksums, commit y fecha

  No toca nada del servidor: el volcado se genera en un directorio temporal del
  usuario SSH y se borra al terminar. No usa AWS ni la API de ECR; solo SSH/SCP,
  que es lo que ya usa deploy/backup-pull.ps1.

  Ojo con GitHub: ningún archivo puede pasar de 100 MiB (y avisa a partir de
  50 MiB). El script aborta si encuentra uno así y lista los culpables.

.EXAMPLE
  pwsh -File deploy/migracion-exportar.ps1 -SoloDiagnostico
  Medir sin descargar nada (útil para comprobar SSH y tamaños antes de migrar).

.EXAMPLE
  pwsh -File deploy/migracion-exportar.ps1 -Commit
  Exportar todo y publicarlo en la rama actual del repositorio.

.EXAMPLE
  pwsh -File deploy/migracion-exportar.ps1 -SinTiles -Etiqueta 2026-11-20
#>
param(
  [string]$Servidor = 'ec2-user@18.119.155.81',
  [string]$Llave = "$env:USERPROFILE\.ssh\gramalote-key.pem",
  [string]$AppDir = '/opt/gramalote',
  [string]$Etiqueta = (Get-Date -Format 'yyyy-MM-dd-HHmm'),
  [string]$Destino = (Join-Path $PSScriptRoot '..\migracion'),
  [switch]$SinTiles,
  [switch]$SoloDiagnostico,
  [switch]$Commit,
  [int]$Conservar = 2,
  [int]$LimiteMB = 95
)

# Los comandos nativos (ssh, scp, git) escriben avisos en stderr; no son fallos.
# Cada paso comprueba su propio código de salida.
$ErrorActionPreference = 'Continue'

# Algunos equipos tienen una función o alias `git` (posh-git) que se queda con
# los argumentos; hay que llamar al ejecutable.
$gitCmd = (Get-Command git -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1)
$git = if ($gitCmd) { $gitCmd.Source } else { 'git' }

$repo = (& $git -C (Join-Path $PSScriptRoot '..') rev-parse --show-toplevel).Trim()
$carpeta = Join-Path $Destino $Etiqueta
$sshArgs = @('-i', $Llave, '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15')

function MB([long]$bytes) { [math]::Round($bytes / 1MB, 1) }

# ssh/scp de OpenSSH avisa del intercambio post-cuántico en stderr: no es un
# error y ensuciaría la salida del guion remoto.
function Limpiar([object[]]$lineas) {
  return @($lineas | Where-Object { "$_" -notmatch '^\*\* (WARNING|This session|The server)' })
}

# El guion remoto viaja en base64: así no hay que escapar comillas, $ ni
# tuberías a través de PowerShell → ssh → bash.
function Invoke-Remoto([string]$Guion) {
  $b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes(($Guion -replace "`r", '')))
  $salida = Limpiar @(& ssh @sshArgs $Servidor "echo $b64 | base64 -d | bash" 2>&1)
  if ($LASTEXITCODE -ne 0) {
    throw "Falló en el servidor (código $LASTEXITCODE):`n$($salida -join "`n")"
  }
  return $salida
}

function Leer-Clave([object[]]$lineas, [string]$clave) {
  $linea = $lineas | Where-Object { "$_" -like "$clave=*" } | Select-Object -First 1
  if (-not $linea) { return '' }
  return ("$linea" -split '=', 2)[1]
}

function Copiar([string]$Origen, [string]$DestinoLocal, [switch]$Recursivo) {
  $extra = @()
  if ($Recursivo) { $extra = @('-r') }
  $salida = Limpiar @(& scp @sshArgs @extra $Origen $DestinoLocal 2>&1)
  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo copiar $Origen`n$($salida -join "`n")"
  }
}

# --------------------------------------------------------------- Guion remoto
$remoto = @'
set -euo pipefail
APP="__APP__"
DB="gramalote-db"
OUT="$HOME/gramalote-migracion"
rm -rf "$OUT"; mkdir -p "$OUT"

echo "SERVICIOS=$(docker ps --format '{{.Names}} {{.Status}}' | grep '^gramalote-' | paste -sd ',' - | sed 's/,/ ; /g')"
DBNAME="$(docker exec "$DB" printenv MYSQL_DATABASE)"

# mysql dentro del contenedor: la clave de root sale de su propio entorno y no
# se escribe en disco ni viaja en la línea de comandos del host.
sql() { docker exec "$DB" sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -N -B "$@"' sh "$@"; }

TABLAS="$(sql "$DBNAME" -e 'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()')"
echo "DBNAME=$DBNAME"
echo "TABLAS=$TABLAS"

echo "== Volcado completo (esquema + datos)"
docker exec "$DB" sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --quick --routines --triggers --no-tablespaces --default-character-set=utf8mb4 --hex-blob "$MYSQL_DATABASE"' > "$OUT/gramalote.sql"
gzip -9 -c "$OUT/gramalote.sql" > "$OUT/gramalote.sql.gz"
rm -f "$OUT/gramalote.sql"
# Además del código de salida, el volcado debe terminar con su marca de cierre.
gzip -dc "$OUT/gramalote.sql.gz" | tail -n 1 | grep -q 'Dump completed'

echo "== Esquema legible (sin datos)"
docker exec "$DB" sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --no-data --skip-comments --no-tablespaces --default-character-set=utf8mb4 "$MYSQL_DATABASE"' > "$OUT/esquema.sql"

echo "== Filas por tabla"
: > "$OUT/conteos.tsv"
for t in $(sql "$DBNAME" -e 'SHOW TABLES'); do
  n="$(sql "$DBNAME" -e "SELECT COUNT(*) FROM \`$t\`")"
  printf '%s\t%s\n' "$t" "$n" >> "$OUT/conteos.tsv"
done

echo "== Media"
MEDIA="$APP/media"
if [ -d "$MEDIA" ]; then
  find "$MEDIA" -type f -printf '%s\t%P\n' | sort -k2 > "$OUT/archivos-media.tsv"
  echo "MEDIA_FILES=$(wc -l < "$OUT/archivos-media.tsv")"
  # Solo archivos: du -sb suma también los directorios y descuadra la verificación.
  echo "MEDIA_BYTES=$(find "$MEDIA" -type f -printf '%s\n' | awk '{s+=$1} END {print s+0}')"
else
  echo "MEDIA_FILES=0"; echo "MEDIA_BYTES=0"
fi

echo "== Teselas del mapa"
TILES="$APP/tiles"
if [ -d "$TILES" ] && [ "$(find "$TILES" -type f | wc -l)" -gt 0 ]; then
  echo "TILES_FILES=$(find "$TILES" -type f | wc -l)"
  echo "TILES_BYTES=$(find "$TILES" -type f -printf '%s\n' | awk '{s+=$1} END {print s+0}')"
else
  echo "TILES_FILES=0"; echo "TILES_BYTES=0"
fi

echo "== Archivos que GitHub rechazaría (más de __LIMITE__ MB)"
GRANDES="$(find "$MEDIA" "$TILES" -type f -size +__LIMITE__M -printf '%s\t%p\n' 2>/dev/null | sort -rn || true)"
if [ -n "$GRANDES" ]; then echo "GRANDES<<FIN"; echo "$GRANDES"; echo "FIN"; else echo "GRANDES="; fi

echo "DUMP_BYTES=$(stat -c %s "$OUT/gramalote.sql.gz")"
echo "DUMP_SHA=$(sha256sum "$OUT/gramalote.sql.gz" | cut -d' ' -f1)"
echo "ESQUEMA_BYTES=$(stat -c %s "$OUT/esquema.sql")"
echo "FIN_OK"
'@

$remoto = $remoto.Replace('__APP__', $AppDir).Replace('__LIMITE__', $LimiteMB)

Write-Host "Conectando a $Servidor..." -ForegroundColor Cyan
$info = Invoke-Remoto $remoto

if ($info -notcontains 'FIN_OK') { throw "El guion remoto no terminó bien:`n$($info -join "`n")" }

$totales = @{}
foreach ($clave in 'DBNAME', 'TABLAS', 'MEDIA_FILES', 'MEDIA_BYTES', 'TILES_FILES', 'TILES_BYTES', 'DUMP_BYTES', 'DUMP_SHA', 'ESQUEMA_BYTES', 'SERVICIOS') {
  $totales[$clave] = Leer-Clave $info $clave
}

$grandes = @()
$capturar = $false
foreach ($linea in $info) {
  if ("$linea" -eq 'GRANDES<<FIN') { $capturar = $true; continue }
  if ("$linea" -eq 'FIN') { $capturar = $false; continue }
  if ($capturar) { $grandes += "$linea" }
}

Write-Host ''
Write-Host "Servidor      : $Servidor"
Write-Host "Servicios     : $($totales.SERVICIOS)"
Write-Host "Base de datos : $($totales.DBNAME) — $($totales.TABLAS) tablas"
Write-Host "Volcado       : $(MB ([long]$totales.DUMP_BYTES)) MB (sha256 $($totales.DUMP_SHA.Substring(0, 12))…)"
Write-Host "Esquema       : $(MB ([long]$totales.ESQUEMA_BYTES)) MB"
Write-Host "Media         : $($totales.MEDIA_FILES) archivos — $(MB ([long]$totales.MEDIA_BYTES)) MB"
Write-Host "Teselas       : $($totales.TILES_FILES) archivos — $(MB ([long]$totales.TILES_BYTES)) MB"

if ($grandes.Count -gt 0) {
  Write-Host ''
  Write-Host "ATENCIÓN: estos archivos pasan de $LimiteMB MB y GitHub los rechaza (límite 100 MB):" -ForegroundColor Yellow
  $grandes | ForEach-Object { Write-Host "  $_" }
  Write-Host 'Sácalos del snapshot (-SinTiles) o guárdalos fuera de Git.' -ForegroundColor Yellow
}

if ($SoloDiagnostico) {
  Write-Host ''
  Write-Host 'Diagnóstico terminado; no se descargó nada.' -ForegroundColor Green
  return
}

if ($grandes.Count -gt 0) { throw 'Hay archivos por encima del límite de GitHub; no se descarga nada.' }

New-Item -ItemType Directory -Force -Path $carpeta | Out-Null

Write-Host ''
Write-Host 'Descargando volcado y esquema...' -ForegroundColor Cyan
Copiar "${Servidor}:gramalote-migracion/gramalote.sql.gz" (Join-Path $carpeta "gramalote-$Etiqueta.sql.gz")
Copiar "${Servidor}:gramalote-migracion/esquema.sql" (Join-Path $carpeta "esquema-$Etiqueta.sql")
Copiar "${Servidor}:gramalote-migracion/conteos.tsv" (Join-Path $carpeta 'conteos.tsv')
Copiar "${Servidor}:gramalote-migracion/archivos-media.tsv" (Join-Path $carpeta 'archivos-media.tsv')

Write-Host "Descargando fotos ($($totales.MEDIA_FILES) archivos, $(MB ([long]$totales.MEDIA_BYTES)) MB)..." -ForegroundColor Cyan
Copiar "${Servidor}:$AppDir/media" $carpeta -Recursivo

if (-not $SinTiles -and [int]$totales.TILES_FILES -gt 0) {
  Write-Host "Descargando teselas del mapa ($(MB ([long]$totales.TILES_BYTES)) MB)..." -ForegroundColor Cyan
  Copiar "${Servidor}:$AppDir/tiles" $carpeta -Recursivo
}

# El directorio temporal del servidor ya cumplió su función.
Invoke-Remoto @'
set -euo pipefail
rm -rf "$HOME/gramalote-migracion"
'@ | Out-Null

# ------------------------------------------------------------------ Verificar
$localDump = Join-Path $carpeta "gramalote-$Etiqueta.sql.gz"
$shaLocal = (Get-FileHash -Algorithm SHA256 $localDump).Hash.ToLower()
if ($shaLocal -ne $totales.DUMP_SHA.ToLower()) {
  throw "El volcado llegó distinto (sha256 local $shaLocal, remoto $($totales.DUMP_SHA))."
}

$mediaLocal = Join-Path $carpeta 'media'
$archivosLocal = @(Get-ChildItem -LiteralPath $mediaLocal -Recurse -File -ErrorAction SilentlyContinue)
$bytesLocal = ($archivosLocal | Measure-Object -Property Length -Sum).Sum
if ($archivosLocal.Count -ne [int]$totales.MEDIA_FILES) {
  throw "Llegaron $($archivosLocal.Count) fotos de $($totales.MEDIA_FILES). Vuelve a ejecutar el script."
}
if ([long]$bytesLocal -ne [long]$totales.MEDIA_BYTES) {
  throw "Las fotos pesan $bytesLocal bytes y en el servidor $($totales.MEDIA_BYTES)."
}

# ----------------------------------------------------------------- Manifiesto
# Ojo: no se puede llamar $commit — PowerShell no distingue mayúsculas y choca
# con el parámetro [switch]$Commit (el manifiesto acababa diciendo «False»).
$commitSha = (& $git -C $repo rev-parse --short HEAD).Trim()
$ramaLibre = (& $git -C $repo rev-parse --abbrev-ref HEAD).Trim()
$tilesLinea = if ($SinTiles -or [int]$totales.TILES_FILES -eq 0) {
  'no incluido (el mapa se ve vacío hasta generarlo con deploy/tiles/build-tiles.sh)'
} else {
  "$($totales.TILES_FILES) archivo(s) — $(MB ([long]$totales.TILES_BYTES)) MB"
}

# Sin acentos graves: dentro de una cadena con comillas dobles son escapes.
$manifiesto = @"
# Snapshot de producción para la migración

| | |
|---|---|
| Fecha | $Etiqueta |
| Servidor | $Servidor ($AppDir) |
| Commit del repositorio al exportar | $commitSha (rama $ramaLibre) |
| Servicios | $($totales.SERVICIOS) |

## Base de datos

- Volcado completo (esquema + datos): gramalote-$Etiqueta.sql.gz — $(MB ([long]$totales.DUMP_BYTES)) MB.
  - sha256: $($totales.DUMP_SHA)
  - Verificado: el volcado cierra con «Dump completed».
- Solo estructura: esquema-$Etiqueta.sql — $(MB ([long]$totales.ESQUEMA_BYTES)) MB.
- conteos.tsv — filas por tabla ($($totales.TABLAS) tablas), para comprobar la importación.

## Archivos

- media/ — $($totales.MEDIA_FILES) archivos, $(MB ([long]$totales.MEDIA_BYTES)) MB. Fotos y variantes subidas desde el panel.
- tiles/ — $tilesLinea.

## Cómo se restaura

Ver docs/MIGRACION-DEBIAN.md. Resumen: crear el .env, levantar solo la base,
importar el volcado, copiar media/ a /srv/gramalote/media, los .pmtiles a
/srv/gramalote/tiles y levantar el resto del stack.
"@

Set-Content -LiteralPath (Join-Path $carpeta 'MANIFIESTO.md') -Value $manifiesto -Encoding utf8

# --------------------------------------------------------------- Tamaño en Git
$pesoSnapshot = (Get-ChildItem -LiteralPath $carpeta -Recurse -File | Measure-Object -Property Length -Sum).Sum
$migracionCompleta = (Get-ChildItem -LiteralPath $Destino -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
Write-Host ''
Write-Host "Snapshot: $(MB $pesoSnapshot) MB · migracion/ completa: $(MB $migracionCompleta) MB" -ForegroundColor Green
if ($migracionCompleta -gt 900MB) {
  Write-Host 'Aviso: conviene no pasar de ~1 GB en el repositorio; baja -Conservar.' -ForegroundColor Yellow
}

# --------------------------------------------------------- Git: comprobaciones
# Un archivo ignorado no llega a GitHub y el snapshot quedaría incompleto sin
# que nadie se entere: se comprueba archivo por archivo.
$relativo = "migracion/$Etiqueta"
$estado = @(& $git -C $repo status --porcelain --ignored=matching --untracked-files=all -- $relativo 2>&1)
$ignorados = @($estado | Where-Object { "$_" -like '!!*' } | ForEach-Object { "$_" -replace '^!! ', '' })
if ($ignorados.Count -gt 0) {
  Write-Host "Git ignoraría $($ignorados.Count) archivo(s) del snapshot y no llegarían a GitHub:" -ForegroundColor Yellow
  $ignorados | Select-Object -First 10 | ForEach-Object { Write-Host "  $_" }
  throw 'Revisa los .gitignore: falta re-incluir esos archivos (migracion/.gitignore).'
}
if (-not ($estado | Where-Object { "$_" -like '??*' })) {
  Write-Host "Aviso: git no ve cambios en $relativo." -ForegroundColor Yellow
}

if ($Commit) {
  Write-Host ''
  Write-Host 'Publicando en GitHub...' -ForegroundColor Cyan
  & $git -C $repo add -- $relativo
  if ($LASTEXITCODE -ne 0) { throw 'git add falló' }

  $mensaje = "Snapshot de producción para la migración ($Etiqueta)`n`nVolcado MySQL, esquema, fotos de /media y teselas del mapa exportados desde la EC2 para poder reconstruir el sitio solo con el repositorio."
  & $git -C $repo commit -m $mensaje
  if ($LASTEXITCODE -ne 0) { throw 'git commit falló (¿sin cambios?).' }

  & $git -C $repo push
  if ($LASTEXITCODE -ne 0) { throw 'git push falló. Revisa la rama y el remoto.' }
  Write-Host 'Publicado.' -ForegroundColor Green
} else {
  Write-Host ''
  Write-Host "Todo listo en $carpeta." -ForegroundColor Green
  Write-Host 'Para publicarlo:'
  Write-Host "  git add `"$relativo`""
  Write-Host "  git commit -m `"Snapshot de producción para la migración ($Etiqueta)`""
  Write-Host '  git push'
}

# Rotación: los snapshots más viejos de la carpeta de trabajo. Ojo: en el
# historial de Git siguen estando.
$anteriores = @(Get-ChildItem -LiteralPath $Destino -Directory | Sort-Object Name -Descending | Select-Object -Skip $Conservar)
if ($anteriores.Count -gt 0) {
  Write-Host ''
  Write-Host "Quedan $($anteriores.Count) snapshots anteriores en $Destino (no se borran solos):" -ForegroundColor Yellow
  $anteriores | ForEach-Object { Write-Host "  $($_.Name)" }
  Write-Host 'Bórralos a mano si no los necesitas.'
}
