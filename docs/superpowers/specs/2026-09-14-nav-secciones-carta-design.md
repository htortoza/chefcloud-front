# Nav lateral de Secciones — Tab Estructura (Carta)

## Contexto

En `CartaDetailEstructura` (`chefcloud-front/src/app/components/cartas/carta-detail-estructura/`), las secciones de una carta se muestran apiladas verticalmente, cada una con un botón de colapsar/expandir individual (campo `Seccion.colapsada`). Con cartas de muchas secciones esto obliga a scrollear mucho para llegar a una sección puntual.

## Objetivo

Agregar un nav lateral izquierdo (sticky) con la lista de secciones de la carta, que permita saltar directamente a una sección o volver a ver todas. Reemplaza el colapsar/expandir individual por sección.

## Layout

Dos columnas dentro del tab Estructura:

- **Nav lateral izquierdo** (sticky, ancho fijo ~220px):
  - Ítem fijo **"Todas"** arriba de la lista.
  - Debajo, un ítem por sección, en el orden actual (`seccion.orden`), mostrando:
    - Nombre de la sección
    - Badge de franja horaria (mismo dato que hoy se ve en el `p-select` de franja del header de sección)
    - Punto/indicador rojo si algún producto de esa sección tiene estado `error` en algún canal (usar `cartaService.estadoCanal(...)`, mismo chequeo que ya existe en `estadoGlobalCanales` pero por sección en vez de por carta completa)
  - Ítem activo (sea "Todas" o una sección) resaltado visualmente.
  - Al fondo del nav: botón "+ Nueva sección" (se mueve desde el fondo del listado actual).

- **Panel derecho**: contenido según selección del nav.
  - **"Todas" (default al entrar al tab)**: se ve el listado completo de secciones, cada una expandida — el comportamiento visual es el que existe hoy con todas las secciones sin colapsar. El botón individual de colapsar/expandir por sección **desaparece** (el nav es ahora el único mecanismo de mostrar/ocultar).
  - **Una sección específica**: el panel muestra solo el header + productos de esa sección. El resto no se renderiza.

## Estado y datos

- Nueva señal local en `CartaDetailEstructura`: `seccionActivaId = signal<string | 'todas'>('todas')`. No se persiste — al volver a entrar al tab siempre arranca en "Todas".
- **`Seccion.colapsada` se elimina** del modelo (`cartas.model.ts`) y de todo lo que lo setea/lee (`carta.service.ts`: valores por defecto al crear secciones + `actualizarSeccion`; `carta-detail-estructura.ts`/`.html`: botón chevron, método `toggleColapsarSeccion`, campo `[!seccion.colapsada]` en template).
- `secciones()` sigue siendo la fuente de verdad del orden; el nav se deriva de ella con un `computed` que agrega el estado de error por sección.
- Nueva función/computed: `seccionesConIndicador()` — por cada sección, deriva `{ seccion, tieneError: boolean }` chequeando estado de canal de sus productos (reutiliza la misma lógica de `estadoGlobalCanales` pero acotada a `seccion.items` en vez de a todos los productos de la carta).

## Interacciones

- Click en ítem de sección → `seccionActivaId.set(seccion.id)`.
- Click en "Todas" → `seccionActivaId.set('todas')`.
- **Nueva sección**: se crea (`agregarSeccionNueva`), se selecciona automáticamente en el nav (`seccionActivaId.set(nuevoId)`) y entra en modo renombre — mismo flujo que hoy, solo que además cambia la selección del nav.
- **Eliminar sección activa**: si la sección eliminada era la activa, pasar la selección a la sección vecina (la de orden inmediatamente anterior, o la primera restante si se eliminó la primera; si no quedan secciones, volver a "Todas").
- **Bulk-select** (`seleccionados`, checkbox "seleccionar todos", barra de acción masiva):
  - En "Todas": abarca todos los productos de la carta (comportamiento actual, sin cambios).
  - En una sección específica: abarca solo los productos de esa sección. `todosLosProductosIds()` y `todosSeleccionados()` deben derivarse de la sección activa cuando no es "Todas".

## Casos borde

- **Carta sin secciones**: nav muestra solo "Todas" + botón "+ Nueva sección"; panel derecho muestra el mensaje vacío actual ("Esta carta todavía no tiene secciones...").
- **Sección activa eliminada externamente** (no debería pasar en este flujo ya que el único punto de eliminación es el propio botón de eliminar en el header de esa sección, pero por robustez): si `seccionActivaId()` ya no existe en `secciones()`, el `computed` de panel derecho debe caer a comportamiento seguro (tratar como "Todas" o sección vacía) — se resuelve naturalmente si el cálculo de "sección activa" usa `secciones().find(...)` y chequea `undefined`.

## Fuera de alcance

- No se persiste la sección activa entre sesiones ni se refleja en la URL/query params.
- No se agrega drag-and-drop de secciones en el nav — el reordenar sigue siendo con las flechas arriba/abajo que ya existen en el header de cada sección (visibles cuando esa sección es la activa, o en cada sección cuando está "Todas", igual que hoy).
- No se toca la lógica de productos, canales, precios ni diagnósticos de error — solo el mecanismo de visibilidad de secciones y el scope del bulk-select.

## Testing

- `carta-detail-estructura.spec.ts` ya existe pero no cubre `colapsada`/`toggleColapsarSeccion` hoy — agregar tests nuevos para `seccionActivaId` (default "todas", click selecciona sección, "Todas" vuelve a mostrar todo, sección activa eliminada cae a vecina o a "todas", scope de bulk-select por sección vs. "todas").
- Verificación manual en browser: cargar una carta con 3+ secciones, confirmar "Todas" por default, click en una sección oculta las demás, "Todas" las vuelve a mostrar, indicador de error aparece cuando corresponde, bulk-select respeta el scope.
