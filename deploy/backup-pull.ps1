<#
.SYNOPSIS
  Copia al PC del administrador el respaldo más reciente de Gramalote
  (MySQL + fotos de /media) que deja cada noche deploy/backup.sh en el servidor.

.DESCRIPTION
  Es la copia "fuera del servidor": si la máquina se pierde, aquí queda lo último.
  Solo usa SSH/SCP, así que sirve igual con la EC2 y con el servidor físico
  (cambia -Servidor y -Llave). Conserva los últimos -Conservar respaldos locales.

.EXAMPLE
  pwsh -File deploy/backup-pull.ps1
.EXAMPLE
  pwsh -File deploy/backup-pull.ps1 -Servidor admin@192.168.1.20 -Llave C:\llaves\servidor.pem
#>
param(
  [string]$Servidor = 'ec2-user@18.119.155.81',
  [string]$Llave = "$env:USERPROFILE\.ssh\gramalote-key.pem",
  [string]$Remoto = '/opt/gramalote/backups',
  [string]$Destino = "$env:USERPROFILE\Gramalote\respaldos",
  [int]$Conservar = 30
)

$ErrorActionPreference = 'Stop'
$ssh = @('-i', $Llave, '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15')

function Invoke-Remoto([string]$Comando) {
  # Si git dejó este archivo con CRLF, bash no debe recibir los \r.
  $salida = & ssh @ssh $Servidor ($Comando -replace "`r", '')
  if ($LASTEXITCODE -ne 0) { throw "Falló en el servidor: $Comando" }
  return $salida
}

New-Item -ItemType Directory -Force -Path $Destino | Out-Null

# Los respaldos son de root (600): se copian a una carpeta temporal del usuario
# SSH, se bajan con scp y se borran de ahí.
$ultimos = Invoke-Remoto @"
set -e
db=`$(sudo sh -c "ls -1t $Remoto/gramalote-*.sql.gz" | head -n 1)
media=`$(sudo sh -c "ls -1t $Remoto/media-*.tar.gz" | head -n 1)
tmp=`$HOME/gramalote-respaldo
rm -rf "`$tmp" && mkdir -p "`$tmp"
sudo cp "`$db" "`$media" "`$tmp/"
sudo chown -R "`$(id -u):`$(id -g)" "`$tmp"
for f in "`$tmp"/*; do echo "`$(basename "`$f") `$(stat -c %s "`$f")"; done
"@

try {
  foreach ($linea in $ultimos) {
    $nombre, $bytes = $linea -split ' '
    $local = Join-Path $Destino $nombre
    if ((Test-Path $local) -and (Get-Item $local).Length -eq [long]$bytes) {
      Write-Host "= $nombre ya estaba copiado"
      continue
    }
    & scp @ssh "${Servidor}:gramalote-respaldo/$nombre" $local
    if ($LASTEXITCODE -ne 0) { throw "No se pudo copiar $nombre" }
    if ((Get-Item $local).Length -ne [long]$bytes) {
      Remove-Item $local
      throw "$nombre llegó incompleto"
    }
    Write-Host "+ $nombre ($([math]::Round($bytes / 1MB, 1)) MB)"
  }
}
finally {
  Invoke-Remoto 'rm -rf "$HOME/gramalote-respaldo"' | Out-Null
}

# Rotación local: los $Conservar más recientes de cada tipo.
foreach ($patron in 'gramalote-*.sql.gz', 'media-*.tar.gz') {
  Get-ChildItem -Path $Destino -Filter $patron |
    Sort-Object LastWriteTime -Descending |
    Select-Object -Skip $Conservar |
    Remove-Item
}

Write-Host "Respaldos en $Destino"
