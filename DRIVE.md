# Carpeta de Google Drive del proyecto

- **Nombre:** Gramalote Interactivo — Entregas UX/UI a Sistemas
- **Link:** https://drive.google.com/drive/u/0/folders/18L14YaknB5cDndgg4ASD2_8vfc1BcZgR
- **Folder ID:** 18L14YaknB5cDndgg4ASD2_8vfc1BcZgR

## Acceso desde el MCP gdrive

Servidor: `@piotr-agier/google-drive-mcp` (stdio), con scope `drive.readonly`.

- `listFolder` con `folderId` para listar subcarpetas y archivos.
- `search` con `rawQuery: true` y `'<folder-id>' in parents` para filtrar por carpeta.
- `readGoogleDoc` para Docs, `getGoogleSheetContent` para Sheets, `readTextFile` para texto.
- `downloadFile` para bajar cualquier binario (`.zip`, imágenes, PDF).

## ⚠️ Los assets están en .zip — hay que descargarlos y descomprimirlos

Los **SVG de Figma y las imágenes en alta resolución no se obtienen leyendo el
Drive**: están dentro de archivos `.zip` en cada entrega. Por eso, al revisar el
Drive hay que:

```powershell
# 1. localizar los .zip de la entrega (listFolder / search / REST)
# 2. descargarlos (tool google-drive_downloadFile, o REST:)
#    GET https://www.googleapis.com/drive/v3/files/<id>?alt=media   (Bearer token)
# 3. descomprimir
Expand-Archive -LiteralPath .\entrega.zip -DestinationPath 'referencia\entregas-drive\' -Force
```

Destino local acordado: **`referencia/entregas-drive/<entrega> - <fecha>/`**.
No integrar nada en `frontend/public/` hasta tener el `.zip` descomprimido.

## Listado rápido (usar esto, no carpeta por carpeta)

Recorrer todo el árbol en UNA pasada con la API REST y el `accessToken` configurado
en el MCP, en vez de llamar `listFolder` N veces:

```powershell
$token = $env:GOOGLE_DRIVE_ACCESS_TOKEN
$h = @{ Authorization = "Bearer $token" }
# GET https://www.googleapis.com/drive/v3/files?q='<id>'+in+parents+and+trashed=false&pageSize=200
# recursivo sobre mimeType application/vnd.google-apps.folder
```

- El `accessToken` dura ~1 h; si da 401, refrescar abriendo cualquier tool del MCP.
- La Docs API está **deshabilitada** en el proyecto de Google Cloud: `readGoogleDoc` falla.
  Para leer Docs usar export: `GET /files/<id>/export?mimeType=text/plain`.
- 2026-10-20: árbol completo (todas las carpetas + links de Figma en briefs) en ~5 s con este método.

## Raíz (verificada 2026-10-20)

- 01. ENTREGA [INICIO] — `10eEsOzj6rDHzEmle7mF-5KGO5hm8O_aS`
- 02. ENTREGA [DONDE IR] — `1bRJxQPzo6GONSZy4j7Jc0aTtgfBCJjv3`
- 03. ENTREGA [QUE HACER-INFORMACIÓN PRÁCTICA] — `1wVZBCMjOtpmpj9uPWt-RyG6tmOojuXAS`
- 04. ENTREGA [CURIOSIDADES] — `17g3i_ArIANUQW94F6x6jQCdYw_mYc5tB`
- 05. ENTREGA [HISTORIA] — `1uzLMZJRIr5XPn80oAD27wWBAqOSC5qxG`
- 06. ENTREGA [FUNCIONALIDADES COMPLEMENTARIAS Y ADMINISTRACIÓN] — `1rJiEKscnCo8ekBrKsfz2qK54u4Z9v5Fd`
- Documentación de Diseño UX/UI — Gramalote Interactivo — `1Foqv7PxrdsMRAdOTQBtHlXXnG36dAZ2-VU74vvX3Vj0`
- Matriz_establecimientos — `1Kicm-mYg0ghVRST-mtFgmOj2OODll4Cn5qF9tE9EeUQ`
