# Auditoría de consistencia UI — Panel de administración

Fecha: 2026-11-20. Solo lectura; no se modificó código fuente.

## 1. Resumen ejecutivo

- Stack confirmado: React 19 + Vite + react-router, JSX, CSS plano, sin librería de UI. Sin contradicciones.
- Alcance: `pages/Admin*.jsx` (11), `components/admin/*`, `lib/dialog.jsx`, `lib/useModalFocus.js`, `admin*.css`, `dialog.css`, `tokens.css`. Fuera: páginas públicas, backend, mapa, `src/data/`.
- Pistas verificadas: (a) `components/ui/Button.jsx` NO se importa en ningún archivo del panel (confirmado); (b) NO hay `confirm()` nativo: todas las acciones destructivas usan `useDialog().confirm` (la pista es falsa); (c) `AdminToast` se usa en todas las páginas, pero con 3 patrones de estado distintos; (d) `admin-dark.css` es en realidad la hoja base del panel, no solo el tema oscuro.
- Hallazgos: **3 altos, 5 medios, 4 bajos** (12 en total). Los de la sección 2 marcados "verificado" se comprobaron en la línea citada; los marcados "sospecha" no.
- El tema claro/oscuro se respeta en general: el panel usa variables `--a-*`; las diferencias solo de tema no se reportan.

## 2. Hallazgos

| ID | Tipo | Descripción | Evidencia | Sev. | Causa raíz | Estado |
|---|---|---|---|---|---|---|
| H1 | Confirmación de borrado | Quitar una foto de la ficha pide confirmación en Lugares/Patrimonio pero no en Establecimientos ni Experiencias (se quita al instante). | Con confirmación: `AdminLugarFicha.jsx:478-483`. Sin confirmación: `AdminEstablecimiento.jsx:458-466` (llamado desde `:910`), `AdminExperiencias.jsx:792` (`imageAction(image,'DELETE')` directo) | Alta | Copia-pega entre páginas; sin componente común de galería | Verificado |
| H2 | Aviso de cambios sin guardar | Solo `AdminPaginas` avisa al salir con cambios (`beforeunload` + punto en pestañas). Las fichas (Establecimiento, Experiencia, Lugar) calculan `dirty` pero no avisan al salir ni al navegar: pérdida de datos. | Con aviso: `AdminPaginas.jsx:1395-1404, 1537`. Sin aviso: `AdminEstablecimiento.jsx:137`, `AdminExperiencias.jsx:390`, `AdminLugarFicha.jsx:403` (no hay `beforeunload`/`useBlocker` en ninguno) | Alta | Cada página implementa su propio `dirty`; no hay hook compartido | Verificado |
| H3 | Detección de conflictos | Solo `AdminEstablecimiento` envía `updatedAt` en el guardado (control de concurrencia); Experiencias, Lugar y Páginas guardan sin él, así que dos admins se pisan. | `AdminEstablecimiento.jsx:293`; `AdminLugarFicha.jsx:407` (`pickFields` sin `updatedAt`), `AdminPaginas.jsx:1474` (`{ value }`). Que el backend realmente lo valide no se comprobó (fuera de alcance) | Alta | Funcionalidad añadida a una sola página | Verificado (cliente) / sospecha (servidor) |
| H4 | Botón Guardar | Etiquetas distintas para la misma acción: "Guardar cambios" (3 fichas, con "Sin cambios" deshabilitado), "Guardar" (Extras, Patrimonio, Correo, Usuarios), "Guardar {página}" (Páginas), "Guardar foto", "Guardar nombre/correo/contraseña". Además, Extras/Patrimonio/Correo/Usuarios no se deshabilitan sin cambios; las fichas y Páginas sí. | `AdminEstablecimiento.jsx:514`, `AdminLugarFicha.jsx:600`, `AdminExtras.jsx:283`, `AdminCorreo.jsx:274`, `AdminPaginas.jsx:1644` | Media | Botón escrito a mano en cada página | Verificado |
| H5 | Botón Guardar (ubicación) | Guardar está en la cabecera (`admin-head2__actions`) en las fichas, al pie del panel en Páginas (`admin-panel__footer`), dentro del formulario en Extras/Patrimonio (`admin-extras__actions`) y en `admin-mail__actions` en Correo. | `AdminExperiencias.jsx:595`, `AdminPaginas.jsx:1636-1645`, `AdminExtras.jsx:281-283`, `AdminCorreo.jsx:272-274` | Media | Layout por página | Verificado; **requiere decisión** (puede ser intencional: formulario vs. ficha) |
| H6 | Botón destructivo | Eliminar usa `--danger-outline` en todas las fichas, pero `--danger` (relleno) en Usuarios; textos: "Borrar" (mayoría), "Eliminar" (Usuarios), "Quitar" (fotos/listas). Los diálogos de confirmación mezclan "Borrar/Eliminar" (`¿Borrar «x»?` vs `¿Eliminar la cuenta…?`) y la etiqueta de confirmar varía: "Borrar", "Borrar ficha", "Borrar extra", "Borrar sugerencia". | Outline: `AdminEstablecimiento.jsx:1227`, `AdminPatrimonio.jsx:311`, `AdminSugerencias.jsx:269`. Relleno: `AdminUsuarios.jsx:383`. Confirmaciones: `AdminExtras.jsx:158-160`, `AdminUsuarios.jsx:155-157` | Media | Sin guía de estilo de acciones destructivas | Verificado; Usuarios puede ser intencional (borra cuentas) → **requiere decisión** |
| H7 | Botones sin sistema | Botones sin clase `admin-btn`: ~11 variantes ad hoc (`admin-tool-btn`, `admin-results__clear`, `admin-imgfield__*`, botón "Quitar" y ✕ sin clase en listas). Hay botones sin ninguna clase (p. ej. "Quitar" de consejos, ✕ de imagen). | `AdminExperiencias.jsx:620,626,792,826-832`, `AdminEstablecimiento.jsx:1120`, `AdminPaginas.jsx:103,106,132`, `OpeningHoursEditor` y `ScheduleEditor` (0 usos de `admin-btn`) | Media | Estilos locales por componente; sin `AdminButton` | Verificado |
| H8 | Feedback tras guardar/error | Tres mecanismos: (a) toast con `notify()` y título propio (Extras, Patrimonio, Sugerencias, Lugar, Páginas, Correo, Experiencias); (b) estados `error`/`notice` convertidos a toast con la lógica de título dentro de JSX (Establecimiento, Usuarios); (c) además `<p className="auth-error">` inline para errores en 6 páginas. `notify` está copiado 7 veces con firmas distintas (con/sin `close`, `useCallback`, etc.). Los textos de éxito difieren: "La ficha quedó actualizada." sin título (Establecimiento, convertido a "Cambios guardados" por comparación de cadena) vs "Cambios guardados" + mensaje; Páginas usa solo mensaje. | `AdminEstablecimiento.jsx:521-532`; `AdminUsuarios.jsx:230-245`; `AdminPatrimonio.jsx:69`; `AdminLugarFicha.jsx:371`; `AdminPaginas.jsx:1365`; `AdminCorreo.jsx:70`; inline: `AdminExtras.jsx:202`, `AdminPatrimonio.jsx:211` | Media | Sin hook `useAdminToast` | Verificado |
| H9 | Dos sistemas de diálogo | `AdminDialog` (aviso con "Entendido") solo se usa en Experiencias para validaciones; el resto usa `useDialog().confirm` y toast para los mismos casos. Los errores de validación se muestran de tres formas distintas. | `AdminExperiencias.jsx:198, 474, 544, 373, 923` vs `AdminLugarFicha.jsx:~432` (error → toast) | Media | `AdminDialog` creado antes de `lib/dialog.jsx` | Verificado el uso; **requiere decisión** sobre cuál es canónico |
| H10 | CSS: hoja base mal nombrada y repetida | `admin-dark.css` (4.606 líneas) es la hoja base del panel y contiene el tema oscuro por defecto; `admin.css` (1.914) comparte ~44 selectores de nivel superior con ella (p. ej. `.admin-tool-btn` en `admin.css:861` y `admin-dark.css:999`). `.admin-btn` y sus variantes no existen en `admin.css`, solo en `admin-dark.css:269-1629`. Variantes `--accent*` y `--danger*` definidas ~900 líneas lejos de `--primary`. Orden de carga en `main.jsx:20-22`. | `admin-dark.css:269,297,1162,1186,1624`; `admin.css:861` | Media | Evolución por fases; "oscuro" pasó a ser base | Verificado |
| H11 | Colores fijos | `admin-dark.css` tiene 139 colores hex/rgba frente a 391 usos de `var(--a-*)`; `admin-light.css` tiene 69 hex y 43 reglas que reponen colores fijos del oscuro. `admin.css` usa 24 colores fijos y solo 1 `var(--a-*)`. Cada color fijo requiere un parche en el tema claro. | recuento por grep en `admin-dark.css`, `admin-light.css`, `admin.css` | Baja | Colores literales en vez de tokens | Verificado el recuento; **sospecha** de cuáles rompen el tema claro |
| H12 | Accesibilidad / menores | (a) Clases usadas en JSX sin regla CSS: `admin-category`, `admin-experience`, `admin-menu`, `admin-ratings`, `admin-search__group`, `admin-subpage`, `admin-tabs--tipos`, `admin-tipo`, `admin-upload`, `admin-urows`, `admin-hours__add--wide` (pueden ser ganchos). (b) Estilos inline `gridColumn` repetidos. (c) Botones ✕/"Quitar" con `aria-label` solo a veces. (d) `AdminSugerencias` tiene 0 `label`/`htmlFor` (revisar controles). | `AdminLugarFicha.jsx:312,646,666`; `AdminExperiencias.jsx:792`; `AdminSugerencias.jsx` | Baja | Sin revisión sistemática | Sospecha (no se abrió cada una) |

Fuera de alcance / sin hallazgo: `confirm()` nativo (no existe); trampa de foco del modal (`useModalFocus.js` implementa Tab, Escape y retorno de foco; `AdminDialog` y `lib/dialog.jsx` lo usan); `Button.jsx` público no se audita.

## 3. Componentes candidatos a unificar

| Tipo | Variante canónica propuesta | Motivo |
|---|---|---|
| Botón | Nuevo `AdminButton` sobre `.admin-btn` (variantes primary, secondary, danger-outline, danger, accent, icon, ghost) | Es lo que ya usan ~100 botones; `ui/Button.jsx` usa clases `btn--*` del sitio público |
| Guardar | "Guardar cambios", deshabilitado sin cambios, "Guardando…" al enviar | Es el patrón de 3 fichas; **requiere decisión** para Páginas y formularios pequeños |
| Borrado | `danger-outline` + `useDialog().confirm` con título "¿Borrar «x»?" y etiqueta "Borrar" | Mayoría de páginas; Usuarios **requiere decisión** |
| Feedback | Hook `useAdminToast()` (devuelve `notify` y `toastElement`) | Elimina 7 copias; el toast ya es común |
| Cambios sin guardar | Hook `useUnsavedChanges(dirty)` basado en el de `AdminPaginas` | Ya existe y funciona |
| Foto quitar | Función común con confirmación | Evita H1 |
| Diálogo de aviso | **Requiere decisión** entre `AdminDialog` y toast | H9 |

## 4. Plan de refactor (impacto/esfuerzo)

1. `useUnsavedChanges` + aplicarlo en Establecimiento, Experiencias y Lugar (`AdminEstablecimiento.jsx`, `AdminExperiencias.jsx`, `AdminLugarFicha.jsx`). Riesgo bajo. Resuelve H2.
2. Confirmación al quitar foto en Establecimiento y Experiencias (H1). Riesgo bajo.
3. `useAdminToast` y migrar las 7 páginas (H8). Riesgo medio (muchos puntos de llamada).
4. Enviar `updatedAt` en Experiencias, Lugar y Páginas, y verificar el backend (H3). Riesgo medio; toca backend (previa aprobación).
5. Crear `AdminButton` y migrar página a página, empezando por Extras/Patrimonio/Correo (H4, H6, H7). Riesgo medio.
6. Normalizar textos de Guardar/Borrar/Quitar (H4, H6). Riesgo bajo.
7. Mover `.admin-btn*` y reglas compartidas de `admin-dark.css` a `admin.css` con variables; renombrar la hoja base (H10, H11). Riesgo alto (4.600 líneas); hacerlo al final y con revisión visual en ambos temas.
8. Limpieza de clases huérfanas y estilos inline (H12). Riesgo bajo.

## 5. Preguntas abiertas

1. ¿Guardar debe vivir siempre en la cabecera o es válido al pie/en el formulario (H5)?
2. ¿Usuarios mantiene botón `--danger` relleno y "Eliminar" (H6)?
3. ¿`AdminDialog` o toast como canal canónico para validaciones (H9)?
4. ¿El backend valida `updatedAt` para conflictos (H3)? Necesito permiso para revisarlo (está fuera de alcance).
5. ¿Autorizas renombrar `admin-dark.css` y mover estilos base a `admin.css` (H10)?
