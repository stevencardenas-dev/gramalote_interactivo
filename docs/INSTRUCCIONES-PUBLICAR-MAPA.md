# Instrucciones para publicar las teselas del mapa

El mapa usa un archivo PMTiles que no se incluye en Git ni en la imagen Docker.
Para que aparezcan las calles y el fondo del mapa, el archivo debe estar en el
servidor en:

```text
/opt/gramalote/tiles/norte-de-santander.pmtiles
```

El archivo de origen se llama `norte-de-santander.pmtiles` y pesa unos 52 MB.
Debe entregarlo el desarrollador por un medio de transferencia autorizado; no
se necesitan contraseñas ni llaves para compartir el archivo.

## 1. Copiar el archivo al servidor

Una vez que el archivo esté transferido al servidor, sustituir
`/ruta/donde/se/recibio/norte-de-santander.pmtiles` por su ubicación real y
ejecutar:

```bash
sudo install -d -m 755 /opt/gramalote/tiles
sudo install -m 644 \
  /ruta/donde/se/recibio/norte-de-santander.pmtiles \
  /opt/gramalote/tiles/norte-de-santander.pmtiles
```

El permiso `644` permite que nginx lea el archivo. No hace falta reconstruir ni
reiniciar los contenedores: Docker Compose ya monta `/opt/gramalote/tiles` en
`/srv/tiles` dentro del contenedor web.

## 2. Verificar el archivo en el servidor

Ejecutar en el servidor:

```bash
ls -lh /opt/gramalote/tiles/norte-de-santander.pmtiles
curl -sS -o /dev/null -w "%{http_code}\n" \
  -H "Range: bytes=0-63" \
  http://127.0.0.1/tiles/norte-de-santander.pmtiles
```

El primer comando debe mostrar el archivo con un tamaño cercano a 52 MB. El
segundo debe devolver `206`, que indica que nginx atendió correctamente la
petición parcial usada por PMTiles.

Si devuelve `404`, confirmar que el archivo esté escrito exactamente con ese
nombre y que `/opt/gramalote/tiles` sea la carpeta montada por el servicio web.
Si devuelve `403`, revisar los permisos de lectura del archivo y de acceso a
las carpetas.

## 3. Verificar desde Internet

Abrir esta URL:

```text
https://d2nm90ise1l8de.cloudfront.net/tiles/norte-de-santander.pmtiles
```

La URL puede mostrar o descargar el archivo; lo importante es que ya no dé
`404`. Si la prueba local devuelve `206` pero CloudFront continúa mostrando
`404`, invalidar en CloudFront esta ruta:

```text
/tiles/norte-de-santander.pmtiles
```

Después, recargar la página del mapa.
