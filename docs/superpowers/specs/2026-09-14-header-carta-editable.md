# Header editable de Carta — reemplaza el tab General

## Contexto

`CartaDetail` (`chefcloud-front/src/app/components/cartas/carta-detail/`) muestra 4 tabs: Estructura, Asignación, Experiencias, General. El tab General (`CartaDetailGeneral`) es un formulario batch (nombre, descripción interna, tipo de vigencia + fecha/franja si aplica) con botón "Guardar" único y botón "Publicar". El título de la carta hoy se muestra estático (no editable) arriba de las tabs vía el componente genérico `PageHeader` (compartido también por `CartaList` y `ProductoList`).

## Objetivo

Eliminar el tab General. Su contenido pasa a un header propio de `CartaDetail`, visible arriba de las 3 tabs restantes (Estructura, Asignación, Experiencias) en todo momento, con edición inline campo por campo en vez de un formulario batch.

## Layout

Dos filas, en un nuevo componente `CartaDetailHeader` (`components/cartas/carta-detail-header/`) que reemplaza el `<app-page-header [titulo]="cartaActiva.nombre" />` actual en `carta-detail.html`. `PageHeader` (genérico) no se toca — sigue usándose sin cambios en `CartaList` y `ProductoList`.

- **Fila 1**: nombre de la carta (editable inline) a la izquierda, botón "Publicar" a la derecha.
- **Fila 2**: descripción interna (editable inline), ocupando 50% del ancho disponible, a la izquierda. Vigencia (editable inline) ocupando el resto del ancho, a la derecha.

## Edición inline

### Campo simple reutilizable — `EditableTextField`

Nuevo componente compartido (`components/shared/editable-text-field/`), usado dos veces (nombre, descripción):

- **Modo lectura**: texto + ícono lápiz a la derecha. Clic en el texto O en el lápiz entra en modo edición.
- **Modo edición**: `input` con el valor actual (foco automático) + ícono de guardar (check) a la derecha, reemplazando al lápiz. `Enter` o `blur` confirma y vuelve a modo lectura (mismo patrón que ya usa el renombre de sección en Estructura — blur también guarda, no cancela).
- Input: `valor: string` (input signal, requerido). Output: `guardar: string` (emite el valor final al confirmar).
- Input opcional `requerido: boolean` (default `false`): si es `true`, un valor vacío (tras `trim()`) no se guarda — el campo simplemente vuelve a modo lectura con el valor anterior. Se usa en nombre (`requerido: true`); descripción permite vacío (`requerido: false`, default).
- El valor se recorta (`trim()`) siempre antes de guardar, en ambos casos.

### Vigencia — bloque propio, no el campo genérico

Vive directo en `CartaDetailHeader` porque agrupa 2 a 4 controles a la vez (no es un solo texto):

- **Modo lectura**: resumen + lápiz. `tipoVigencia === 'regular'` → "Regular". `tipoVigencia === 'fecha-especial'` → `"Fecha especial · {desde} – {hasta} · {etiqueta de franjaEspecial}"`.
- **Modo edición**: `p-select` de tipo de vigencia; si el valor elegido es "Fecha especial", aparecen además `desde`/`hasta` (inputs de fecha) y `p-select` de franja que reemplaza — mismas opciones y labels que ya existían en `CartaDetailGeneral` (`OPCIONES_TIPO_VIGENCIA`, `OPCIONES_FRANJA_ESPECIAL`).
- Un solo ícono de guardar (check) confirma **todos** los campos de vigencia juntos en una sola llamada a `CartaService.actualizarGeneral` — misma agrupación que tenía el botón "Guardar" del tab General viejo para estos 3 campos. `Enter` en cualquiera de los inputs de fecha también confirma.
- Al entrar en modo edición, los signals de borrador (`tipoVigenciaBorrador`, `rangoDesdeBorrador`, `rangoHastaBorrador`, `franjaEspecialBorrador`) se inicializan desde `carta()` en ese momento (no un `effect()` continuo como tenía `CartaDetailGeneral` — más simple, sin riesgo de que un re-render externo pise una edición en curso).

### Publicar

Botón `p-button` "Publicar" (severity success, outlined — mismo estilo que tenía en General), fila 1 del header, llama a `CartaService.publicar(carta().id)`. Sin confirmación (mismo comportamiento que tenía antes).

## Cambios de archivos

- **Crear** `components/shared/editable-text-field/` (`.ts`, `.html`, `.css`, `.spec.ts`).
- **Crear** `components/cartas/carta-detail-header/` (`.ts`, `.html`, `.css`, `.spec.ts`).
- **Modificar** `components/cartas/carta-detail/carta-detail.ts`: quita import de `CartaDetailGeneral`, agrega import de `CartaDetailHeader`.
- **Modificar** `components/cartas/carta-detail/carta-detail.html`: reemplaza `<app-page-header [titulo]="cartaActiva.nombre" />` por `<app-carta-detail-header [carta]="cartaActiva" />`; quita `<p-tab value="general">` y su `<p-tabpanel>`.
- **Modificar** `components/cartas/carta-detail/carta-detail.spec.ts`: agrega test de que el tab General ya no existe.
- **Eliminar** `components/cartas/carta-detail-general/` completo (componente, spec, css, html) — nada más lo referencia (verificado por grep).
- `CartaService.actualizarGeneral` y `CartaService.publicar` no cambian — solo cambia quién los llama.

## Fuera de alcance

- No se agrega badge de estado (borrador/publicada/con-cambios) al nuevo header — no estaba en el tab General viejo tampoco.
- No se agrega confirmación al publicar, ni Escape-para-cancelar en la edición inline — ninguno de los dos existía antes.
- No se toca el permiso de edición — `CartaDetailGeneral` no tenía gating por rol, el nuevo header tampoco lo agrega.
- `PageHeader` genérico no se modifica.

## Testing

- `editable-text-field.spec.ts`: modo lectura muestra el valor; clic entra en edición; Enter guarda y emite el valor con trim; blur guarda igual que Enter; con `requerido=true` un valor vacío no emite `guardar` y vuelve a modo lectura.
- `carta-detail-header.spec.ts`: guardar nombre/descripción llama a `actualizarGeneral` con el campo correcto; nombre vacío no se guarda; editar vigencia a "Fecha especial" y confirmar guarda tipoVigencia+rangoFechas+franjaEspecial juntos; volver a "Regular" y confirmar limpia rangoFechas/franjaEspecial (`undefined`); botón Publicar llama a `CartaService.publicar`.
- `carta-detail.spec.ts`: agregar assertion de que no existe ningún `p-tab` con `value="general"` en el DOM.
- Verificación manual en browser: abrir una carta, editar nombre (Enter guarda), editar descripción (blur guarda), cambiar vigencia a fecha especial y volver a regular, publicar.
