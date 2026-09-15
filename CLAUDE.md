# INSTRUCCIONES DE TRABAJO — Frontend Angular + PrimeNG

## ROL Y MANDATO DE ARQUITECTURA

Eres un Arquitecto Frontend experto construyendo aplicaciones Angular 21 (Zoneless, basado en Signals) usando **PrimeNG 21 como Design System exclusivo**.

---

## ESTADO ACTUAL DEL PROYECTO (leer primero, orienta rápido)

**Construido y funcionando** (sobre datos simulados en memoria, sin backend real todavía):
- **Productos** — CRUD de productos de marca (precio venta/oferta/costo, SKU, familia, etiquetas, grupos de modificadores con mínimo/máximo).
- **Cartas** — secciones con vigencia horaria interna (resuelve almuerzo/cena sin clonar la carta), nav lateral compacto para saltar entre secciones o ver todas, asignación muchos-a-muchos a tiendas, overrides por canal (precio/nombre/disponibilidad), experiencias (banners). Nombre/descripción/vigencia se editan inline en un header siempre visible arriba de las tabs — no hay tab "General".
- **Login + shell** — 5 roles (Administrador, Marketing, Operaciones, Cocina/POS, Consultor), selector de sesión de demo, sidebar con Productos/Cartas activos y Tiendas/Canales/Pedidos/Usuarios marcados "Próximamente".
- **Transiciones de vista animadas** entre pantallas (login ↔ shell) con Angular View Transitions.

**Explícitamente simulado a propósito** (no es un bug si aparece "no funciona de verdad"):
- Login no valida credenciales — cualquier click en "Ingresar" entra con el rol elegido en el selector del sidebar.
- Todo el estado vive en memoria del navegador — recargar la página vuelve todo a los datos mock iniciales.
- Una sola marca mock activa (`MarcaContextService`) — no existe todavía Organización Comercial (Empresas/Marcas/Locales reales).
- Canales externos (Uber/Rappi/etc.) son simulados — el modelo `Canal`/`OverrideCanal` existe, publicar no llama a ninguna API real.

**No construido todavía:** Organización Comercial (pantalla "Mis Marcas"), Tiendas real, Canales reales (intérpretes), Pedidos/Operación, historial de auditoría por entidad, carga masiva de catálogo.

Contexto de producto completo (por qué existe ChefCloud, qué NO es, casos de uso): ver la carpeta `Modulos/` en la carpeta padre del repo (fuera de este repo — insumo de diseño, no código). Fuente vigente: `ChefCloud_Modulo_00_Fundamentos.md` + los módulos 1-9 que se van agregando ahí (reemplaza `ChefCloud_Brief_Seccion_Cartas.md`, histórico). **Progreso de construcción por módulo** — revisar `Modulos/` al empezar cada sesión, puede haber módulos nuevos sin trabajar:

| # | Módulo | Estado de construcción |
|---|---|---|
| 0 | Fundamentos | Leído — define modelo/roles/navegación/anti-patrones para todos |
| 1 | Catálogo → Producto (vista Marketing) | Construido: foto (placeholder "Subir foto", sin backend real — ver nota abajo), nombre/descripción/precio base gateados por rol |
| 2 | Cartas — listado | Construido: buscador en vivo, columna Vigencia real (`Carta.franjaId`), sin acción "Clonar" |
| 3+ | (sin doc todavía en `Modulos/`) | Estructura (4): construida, con nav lateral de secciones (decisión #17, falta buscador de productos). General/Experiencias (5): General se eliminó como tab — su contenido (nombre/descripción/vigencia) vive ahora en un header editable inline (decisión #11 actualizada); Experiencias sigue como tab, sin cambios |

Nota: el catálogo de Franjas horarias (`FranjaHorariaService`) y el selector por Sección en Estructura se construyeron *antes* de que existiera un Módulo 3 dedicado (basado en la sección 3 del Módulo 0) — si aparece `ChefCloud_Modulo_03_Franjas_Horarias.md`, releerlo igual por si agrega algo no cubierto (administración de franjas, herencia completa, override por canal — ver gap list abajo).

---

## RESTRICCIONES ABSOLUTAS

- **NUNCA** uses Tailwind CSS, PrimeFlex, Bootstrap, ni ninguna librería de utilidades externa.
- **NUNCA** escribas clases CSS utilitarias personalizadas (ej: no inventes `.flex-row`, `.mt-2`, `.p-4`, `.text-primary`).
- **NUNCA** uses estilos inline (`style="..."`), excepto cuando el valor proviene de datos dinámicos (ej: `[style.background]="color"`).
- **NUNCA** uses `ngOnInit` ni `ngOnDestroy` para lógica que puede expresarse con Signals o `computed`.
- **NUNCA** uses `ngZone.run()` ni `ChangeDetectorRef` — la app es Zoneless.

---

## STACK TECNOLÓGICO

| Capa | Tecnología |
|------|------------|
| Framework | Angular 21 (Zoneless + Signals) |
| Design System | PrimeNG 21 |
| Estilos | CSS global (`styles.css`) + CSS encapsulado semántico por componente |
| Estado global | Angular Signals (`signal`, `computed`, `effect`) |
| Routing | Angular Router 21 (`withComponentInputBinding`) |
| Formularios | Reactive Forms o Template-driven + `FormsModule` según complejidad |
| HTTP | `HttpClient` con `provideHttpClient(withFetch())` |
| Drag & Drop | Angular CDK (`@angular/cdk/drag-drop`) |
| Build | Angular CLI 21 |

---

## ANGULAR 21 — PATRONES OBLIGATORIOS

### Componentes
- Todos los componentes son **standalone** (`standalone: true`).
- Usar `inject()` en lugar de constructor para inyección de dependencias cuando sea posible.
- Inputs tipados con `input()` signal cuando aplique; `@Input()` para interop simple.
- Outputs con `output()` o `@Output() EventEmitter`.

### Signals
```typescript
// ✅ Correcto
count = signal(0);
doubled = computed(() => this.count() * 2);

// ❌ Incorrecto — no uses Subject/BehaviorSubject para estado local
count$ = new BehaviorSubject(0);
```

### Zoneless (obligatorio)
```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideZonelessChangeDetection(),
  ],
};
```

### Componentes sin Zone
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush, // siempre en componentes nuevos
  ...
})
```

### Control Flow moderno (obligatorio)
```html
<!-- ✅ Correcto -->
@if (isLoading()) { <p-progressSpinner /> }
@for (item of items(); track item.id) { ... }
@switch (status()) { @case ('active') { ... } }

<!-- ❌ Incorrecto -->
<div *ngIf="isLoading">
<div *ngFor="let item of items">
```

### Imports en componentes standalone
Solo importar lo que se usa. Sin `CommonModule` ni `BrowserModule`.

```typescript
imports: [RouterLink, Button, InputText, FormsModule]
```

---

## PRIMENG 21 — REGLAS DE USO

### MCP Server (obligatorio antes de implementar)
Tienes acceso al **PrimeNG MCP Server** (`@primeng/mcp`). **Antes de generar cualquier componente, formulario, layout o HTML estructural, DEBES consultar las herramientas MCP** (`get_component`, `search_components`, `get_usage_example`).

No confíes en memoria estática de PrimeNG — la versión 21 introdujo cambios estructurales importantes.

### Componentes de layout disponibles
- `<p-card>` — contenedores de contenido
- `<p-fluid>` — inputs a ancho completo (reemplaza clases de ancho)
- `<p-splitter>` — layouts divididos
- `<p-toolbar>` — barras de herramientas
- `<p-panel>` — secciones colapsables
- `<p-fieldset>` — grupos de campos

### Formularios
```html
<!-- ✅ Input a ancho completo con PrimeNG 21 -->
<p-fluid>
  <input pInputText type="text" [(ngModel)]="value" />
</p-fluid>

<!-- ❌ No usar clases de ancho custom -->
<input pInputText class="w-full" />
```

### Design Tokens — mapeo de colores
Siempre usar `var(--p-...)` de PrimeNG 21. Tokens de referencia:

```css
/* Colores */
var(--p-primary-color)
var(--p-primary-hover-color)
var(--p-text-color)
var(--p-text-muted-color)
var(--p-surface-0)       /* blanco / fondo de tarjeta */
var(--p-surface-50)      /* fondo de página */
var(--p-surface-100)
var(--p-content-border-color)

/* Semánticos */
var(--p-green-500)   var(--p-green-100)   var(--p-green-700)
var(--p-red-400)     var(--p-red-100)     var(--p-red-600)
var(--p-orange-500)  var(--p-orange-100)
var(--p-teal-500)    var(--p-teal-100)
```

### PrimeTemplate en standalone components
Siempre importar `PrimeTemplate` de `primeng/api` cuando uses `pTemplate="header"`, `pTemplate="footer"`, etc.:
```typescript
import { PrimeTemplate } from 'primeng/api';
// Agregar al array imports[] del componente
```

### Gotchas confirmados en este proyecto (no volver a redescubrirlos)

**`<p-drawer>` NO se auto-porta a `body` — `<p-dialog>` sí.**
Un `<p-drawer>` sin `appendTo="body"` queda anidado en el árbol del componente, en un stacking context local. Si su hermano `.p-drawer-mask` sí llega a `body` (comportamiento por defecto), el mask le gana visualmente y por click aunque el drawer tenga `z-index` numéricamente mayor — el z-index solo importa dentro del mismo stacking context. Síntoma: drawer se ve "detrás" del fondo oscuro, o sus botones no reciben click. Fix de una línea: `<p-drawer appendTo="body" ...>`. `<p-dialog>` no necesita esto, ya se porta solo.

**`<p-dialog>` es arrastrable por defecto.**
`[draggable]` default es `true`. Si no se quiere que el modal se pueda mover, hay que poner `[draggable]="false"` explícito en cada `<p-dialog>`.

**Nunca envolver dos elementos interactivos distintos dentro del mismo `<label>`.**
Ej: `<label><span><button>...</button></span><p-select>...</p-select></label>`. El navegador reenvía cualquier click dentro de un `<label>` a su primer descendiente "labelable" (el `<button>`, por ser el primero en el DOM) — así que clickear el `<p-select>` también dispara el `<button>` como efecto colateral, sin que exista ningún bug de lógica en el componente. Si un campo tiene más de un control interactivo, usar `<div class="form-campo">` en vez de `<label>` para ese campo puntual (los campos de un solo input sí pueden seguir usando `<label>` sin problema).

**`display: flex` en un `<td>` rompe la alineación de la fila.**
Al aplicar `display: flex` directo sobre un `<td>`, ese elemento deja de participar como `table-cell` en el cálculo de alto de la fila — queda más bajo que sus hermanos y la fila se ve "desnivelada" (bordes/íconos no alineados). Fix: nunca flexear el `<td>` directamente — envolver el contenido en un `<div>` interno con el flex, dejando el `<td>` intacto como `table-cell`.

---

## ESTRATEGIA DE CSS

### Regla principal
**CSS global primero, CSS encapsulado solo cuando sea estrictamente necesario.**

### `styles.css` (global) — úsalo para:
- Reset / base (`html`, `body`)
- Variables globales de tema (si no están en el preset de PrimeNG)
- Clases de layout de página reutilizables (ej: `.page-body`, `.page-header`)
- Overrides de PrimeNG que deben aplicarse a elementos que PrimeNG renderiza fuera del componente (popovers, tooltips, dialogs — PrimeNG los hace `append` al `body`)
- `@keyframes` de animaciones globales

### CSS encapsulado (`.component.css`) — úsalo para:
- Clases **semánticas** propias del componente que no tienen equivalente en PrimeNG
- Posicionamiento específico de elementos dentro del componente
- Modificaciones de apariencia que no aplican globalmente

```css
/* ✅ Correcto — clase semántica con token PrimeNG */
.metric-card {
  background: var(--p-surface-0);
  border: 1px solid var(--p-content-border-color);
  border-radius: var(--p-border-radius-md);
  padding: 1.25rem;
}

/* ❌ Incorrecto — clase utilitaria inventada */
.flex-row { display: flex; flex-direction: row; }
.mt-4 { margin-top: 1rem; }
```

### Cuándo NO crear CSS encapsulado
- Si PrimeNG ya tiene el componente visual → usarlo directamente.
- Si la clase solo tiene 1-2 propiedades y se usa en un único lugar → considera si es realmente necesaria o si puede resolverse con un componente PrimeNG.

---

## ESTRUCTURA DE ARCHIVOS RECOMENDADA

```
src/
├── app/
│   ├── app.component.ts
│   ├── app.component.html
│   ├── app.config.ts           ← providers globales
│   ├── app.routes.ts           ← rutas lazy
│   ├── components/
│   │   ├── shared/             ← componentes reutilizables
│   │   └── [feature]/          ← un folder por página/feature
│   ├── services/               ← servicios inyectables
│   ├── data/                   ← datos mock / interfaces / tipos
│   └── guards/                 ← route guards
├── styles.css                  ← CSS global
└── index.html
```

---

## MÓDULO CATÁLOGO Y CARTAS — REGLAS DE NEGOCIO

**Documento de producto vigente:** carpeta `Modulos/` en la carpeta padre del repo (`ChefCloud_Modulo_00_Fundamentos.md`, y los módulos 1-9 que se van agregando ahí). Reemplaza el brief v3 monolítico (`ChefCloud_Brief_Seccion_Cartas.md`, histórico). Módulo 0 define modelo de datos, roles, navegación y anti-patrones transversales — los módulos 1-9 los citan, no los repiten. Mapa de módulos (Módulo 0, sección 9) trackea qué está "listo para desarrollar" vs "requiere diseño de detalle": Asignación (7) y Canales torre de control (8) siguen bloqueados por eso.

### Reglas ya implementadas y verificadas

- **Nunca clonar una Carta para variarla.** Ninguna pantalla puede ofrecer "duplicar carta para otra tienda/canal/horario". Toda variación se resuelve con `Asignacion` (tienda), `Seccion.franjaId`/`Carta.franjaId` (rotación horaria dentro de la misma carta, ver Franjas horarias abajo) o `Carta.rangoFechas`/`franjaEspecial` (fecha especial), y `EstadoCanalCarta` (canal). `CartaService.clonar()` y el botón "Clonar" del listado se eliminaron por violar esto directamente (Módulo 0, anti-patrón #1) — no reintroducir sin que el módulo correspondiente lo pida explícitamente.
- **"Con cambios" es un estado derivado, nunca persistido.** `Carta.estado` solo tiene `'borrador' | 'publicada'`. El listado muestra "Con cambios" calculado comparando contra `snapshotUltimaPublicacion` — nunca un campo en `Carta`.
- **Ningún flujo fuera de Productos puede crear un Producto.** El botón "Nuevo producto" existe solo en Productos. El tab Estructura solo busca y selecciona productos ya existentes (`ProductoSelectorDialog`).
- **Canales — nunca logo oficial de terceros.** `Canal.colorMarca`/`Canal.inicial` (badge con color de marca) reemplazan el logo real de Uber Eats/Rappi/PedidosYa — trademark. Canal nuevo: mismo patrón (color + inicial), nunca un SVG/PNG de marca ajena.
- **Estado + precio por canal vive a nivel carta×canal×producto (`EstadoCanalCarta`).** Se hereda a TODAS las tiendas asignadas a esa carta, nunca por tienda individual. Vive en el tab **Estructura** — no hay tab "Canales" separado (se eliminó por duplicar esta misma edición y generar confusión sobre "dónde edito el precio"). Un futuro tab/pantalla "Canales" (torre de control, acuse por tienda×canal — Módulo 8, requiere diseño de detalle) es scope distinto, no construido.
- **El operador nunca pone un producto en estado "error".** `CartaService.setEstadoOperativo` acota su tipo a `'activo' | 'pausado'` — `'error'` lo pone el sistema. Sin backend real, `CartaService.simularErrorCanal` es acción de demo (link "Simular error (demo)" en la UI) para poder probar diagnóstico + reintento — nunca ocultarla sin dejar otra vía al estado en el demo. `reintentar()` en este demo siempre resuelve a `'activo'`.
- **Un producto pertenece a una sola sección a la vez.** `CartaService.agregarItem` es no-op silencioso si el producto ya está en otra sección de esa carta. `ProductoSelectorDialog` lo refleja con badge "Ya en esta carta" + checkbox deshabilitado, para que no sea un no-op sorpresivo.
- **Selector real de "Agregar producto"** — `ProductoSelectorDialog`, modal grande con filtro de texto + familia, selección múltiple, paginado.
- **Roles con permiso por campo (Módulo 0, sección 4).** `puedeEditarOperacion`/`puedeEditarMarketing` (`roles.model.ts`) — Operaciones edita precio+estado desde Estructura; Marketing edita nombre+descripción+foto desde Producto (Catálogo), viendo precio/estado con candado de solo lectura. El permiso bloquea el campo, no la pantalla. En Producto, "precio de venta base" es de Operaciones (Módulo 1, sección 3, punto 2) — distinto del precio *por canal*, que también es de Operaciones pero vive en `EstadoCanalCarta`.
- **Foto de producto — placeholder sin funcionalidad real todavía.** El usuario aclaró que las imágenes las almacena la propia plataforma (no URL externa) — mecanismo de guardado real (dónde/cómo se sube) sin definir aún. `ProductoDetailDrawer` muestra preview + botón "Subir foto" deshabilitado/sin acción (comentario `ponytail:` en el HTML). No implementar upload real (ni siquiera mock con data URI) sin antes preguntar cómo se va a resolver — ver memoria `feedback_ask_before_assuming_storage_mechanism`.
- **Override de nombre y descripción por canal (Módulo 0, sección 3 y decisión #14).** `EstadoCanalCarta` tiene `precio`/`estado`/`nombre`/`descripcion`, los 4 independientes entre sí. `ProductoDetailDrawer` muestra la sección "Por canal" cuando llega con `cartaId` de contexto.
- **Landing directo en Estructura de la carta, primera tab (Módulo 0, decisión #11, actualizada).** `<p-tabs value="estructura">` en `CartaDetail`, orden de tabs Estructura/Asignación/Experiencias — General **ya no es un tab**, se eliminó entero. Nombre, descripción interna y vigencia (tipo + fecha + franja) se editan inline desde `CartaDetailHeader`, siempre visible arriba de las tabs — cada campo es su propio "texto + lápiz → input + check, Enter/blur guarda" (`EditableTextField`, compartido en `components/shared/`). "Publicar" vive en ese mismo header. Pendiente todavía: saltar el listado de cartas y resolver "carta activa según vigencia horaria ahora mismo" (ver pendientes abajo) — eso es un salto más grande, no solo el tab.
- **Nav lateral de secciones en Estructura (Módulo 0, decisión #17, parcial).** Índice compacto a la izquierda (~90px, sin contador — respeta anti-patrón #11 de no competir visualmente con el contenido), ítem "Todas" + uno por sección con punto rojo si algún producto de esa sección tiene estado `error` en algún canal. Click en una sección oculta el resto; click en "Todas" restaura el listado completo. Reemplaza el colapsar/expandir individual que tenía cada sección — `Seccion.colapsada` se eliminó del modelo. **Falta todavía:** el buscador de productos que completa la decisión #17 (ver pendientes abajo).
- **Link "Editar en catálogo" desde la fila expandida (Módulo 0, sección 5 y decisión #12).** `CartaDetailEstructura.editarEnCatalogo()` navega a `/productos` con `productoId`+`cartaId` como query params; `ProductoDetailDrawer` muestra "Volver a la carta". Solo navegación — nunca fusión de datos.
- **Franjas horarias — catálogo reutilizable a nivel Marca (Módulo 0, sección 3 y decisión #15).** `FranjaHorariaService` (marca-scoped, mismo patrón que `ProductoService`) mantiene el catálogo (`FRANJA_GENERAL_ID` = "General", no eliminable, siempre primera, sin horas). `Seccion.franjaId` y `Carta.franjaId` referencian una franja por id — nunca horas sueltas escritas a mano (anti-patrón #12). Selector `p-select` en el header de cada sección en Estructura; `Carta.franjaId` hoy solo se lee (columna "Vigencia" del listado de Cartas) — todavía no tiene UI de edición propia (llegaría con Módulo 5, General/Experiencias). **Sin construir todavía:** administración de franjas fuera del selector rápido (Módulo 0, pendiente #1 — sin bloquear), herencia explícita Carta→Sección→Producto más allá de los niveles Carta y Sección, y override de horario por canal (`franjaId` dentro de `canalOverride`, pendiente #2).
- **Listado de Cartas (Módulo 2).** `CartaList` — pantalla de paso, no destino (Módulo 0, decisión #10/#11: el flujo normal aterriza directo en Estructura, este listado es solo para crear una carta o cambiar a otra). Buscador por nombre en vivo, columnas Nombre/Vigencia/Tiendas asignadas/Estado/Última publicación — sin columna "Destino" (anti-patrón #5) y sin fila duplicada por tienda (anti-patrón #2, una carta con 8 tiendas es una fila). **Sin construir todavía:** el salto automático a la carta activa sin pasar por este listado (ver pendiente de landing en la sección de abajo) — hoy sigue siendo necesario hacer clic acá para llegar a una carta.

### Pendientes del Módulo 0 sin implementar todavía (gap real, no asumir hecho)

- **Landing automático en la carta activa, saltando el listado (Módulo 0, sección 5, decisión #10).** Hoy se aterriza en `/cartas` (listado) y hay que hacer clic en una carta. Falta resolver "cuál carta está vigente ahora mismo" (según franja horaria) y saltar directo a su Estructura tras elegir marca — requisito de producto, no solo estilo.
- **Buscador de productos en Estructura (Módulo 0, decisión #17 — mitad pendiente).** El índice lateral de secciones **ya está construido** (ver regla arriba). Falta el buscador de productos en sí — hoy para encontrar un producto puntual hay que recorrer las secciones a mano o usar el nav para acotar a una sección.
- **Horario con herencia 3 niveles (Carta→Sección→Producto) y override por canal (Módulo 0, sección 3 y 8 pendiente #2).** Solo existe a nivel Sección hoy — falta el nivel Carta, el nivel Producto, y `franjaId` dentro de `canalOverride`. Mecánica exacta del override por canal queda pendiente de definir en el módulo 0 mismo.
- **Reordenar productos dentro de una sección** y **mover un producto de una sección a otra** (Módulo 0, sección 8, pendientes #4 y #6) — ninguno implementado; hoy solo se reordenan secciones completas.
- **Qué pasa al eliminar una sección con productos** (Módulo 0, sección 8, pendiente #3) — resuelto hoy con un `window.confirm` nativo como simplificación temporal, no la solución final (mover a "Sin categoría" u otra, a definir).
- **Pantalla Tienda con botón único "Desactivar todos los canales"** (Módulo 6, decisión #16) — no existe todavía (nav item "Próximamente").
- **Canales — torre de control, matriz Tienda×Canal** (Módulo 8) — requiere diseño de detalle antes de construir (pendiente #8), no existe todavía (nav item "Próximamente").
- **Asignación — diseño de detalle** (Módulo 7) — requiere diseño de detalle antes de construir (pendiente #7), pantalla actual es la del diseño original, sin cambios.
- **Auditoría** (Módulo 9) — sin cambios respecto al diseño original, no construida todavía.

---

## BUENAS PRÁCTICAS DE CÓDIGO

### Nombrado
- Componentes: `PascalCase` → `UserProfileComponent`
- Servicios: `PascalCase` + sufijo `Service` → `AuthService`
- Signals: `camelCase` sin prefijo `$` → `isLoading`, `userData`
- Archivos: `kebab-case` → `user-profile.component.ts`

### Comentarios
- **No comentar lo que el código ya dice.** Los nombres deben ser autoexplicativos.
- Comentar únicamente el **por qué**: restricciones ocultas, workarounds, invariantes no obvias.
- Sin bloques de comentarios multilínea innecesarios.

### Principios generales
- **DRY** — no duplicar lógica; extraer a servicio o función helper.
- **YAGNI** — no diseñar para requisitos hipotéticos futuros.
- **Single Responsibility** — cada componente y servicio hace una sola cosa.
- No agregar manejo de errores para escenarios imposibles.
- No agregar feature flags ni capas de compatibilidad innecesarias.
- Preferir editar archivos existentes a crear nuevos.

### Seguridad
- Nunca interpolar HTML sin sanitizar (`[innerHTML]` solo con `DomSanitizer`).
- Validar inputs en el borde del sistema (formularios, APIs externas).
- No almacenar información sensible en `localStorage` sin cifrado.

---

## HERRAMIENTAS DISPONIBLES

### MCP Servers activos
| Servidor | Uso |
|----------|-----|
| `@primeng/mcp` | API de componentes PrimeNG 21, design tokens, ejemplos de uso |
| `claude.ai Figma` | Leer diseños de Figma, implementar como código, sincronizar componentes |

### Skills instalados (invocar con `/skill-name`)
| Skill | Propósito |
|-------|-----------|
| `angular-zoneless-signals` | **Patrones Angular 21 Zoneless + Signals — leer antes de crear cualquier componente o servicio** |
| `web-design-guidelines` | Revisar archivos contra las Web Interface Guidelines |
| `uxui-principles` | Evaluar interfaces contra 168 principios UX/UI |
| `ux-persuasion-engineer` | Arquitectura de decisiones y reducción de fricción en flujos |
| `find-skills` | Buscar e instalar nuevos skills del ecosistema |

### Capacidades de Figma (MCP)
- **Leer diseños** → `get_design_context`, `get_screenshot`, `get_metadata`
- **Escribir en Figma** → `use_figma`, `create_new_file`, `upload_assets`
- **Code Connect** → mapear componentes Angular a componentes Figma
- **Diagramas** → `generate_diagram` en FigJam

---

## FLUJO DE TRABAJO ESTÁNDAR

1. **Consultar MCP** antes de implementar cualquier componente PrimeNG.
2. **Buscar en `styles.css`** si la clase/estilo ya existe antes de crear CSS nuevo.
3. **TDD** — spec primero cuando el cambio es de lógica/negocio (`*.spec.ts`, Vitest). Ver skill `angular-testing`.
4. **Implementar** usando componentes PrimeNG + CSS semántico con `var(--p-...)`.
5. **Verificar sin excepción, en este orden:**
   - `ng test` — toda la suite, no solo el spec tocado (regresión).
   - `ng build` — sin errores ni warnings nuevos de presupuesto CSS/JS.
   - **Verificación visual en navegador real** (Chrome MCP) para cualquier cambio de UI — type-check y tests no prueban que la pantalla se vea o se comporte bien. Ver sección siguiente.
6. Confirmar que no quedan clases utilitarias, inline styles estáticos ni tokens `var(--color-*)` custom.

---

## ENTORNO DE DESARROLLO Y VERIFICACIÓN EN NAVEGADOR

### El puerto 4200 puede estar ocupado por OTRO proyecto
Este equipo corre más de un `ng serve` en paralelo (ej. `mobile-one-frontend`). Cuando dos procesos escuchan en `4200` (uno en IPv4, otro en dual-stack IPv6), el navegador puede aterrizar en el proyecto equivocado sin ningún error visible. **Antes de asumir que `localhost:4200` es este proyecto:**
```bash
lsof -iTCP -sTCP:LISTEN -n -P | grep 4200   # confirmar qué proceso es
ps -p <PID> -o command=                      # debe decir "ng serve (motor-promociones-front)"
```
Si está ocupado por otro proyecto, levantar este en otro puerto y usar ESE puerto para toda la verificación de la tarea:
```bash
npx ng serve --port 4201
```

### Login de la demo no valida credenciales
Cualquier click en "Ingresar" entra — no hace falta escribir usuario/contraseña reales (ver sección de negocio más abajo). Para reproducir un bug de un rol específico, usar el selector de sesión del sidebar tras loguearse.

### Preferir DOM directo sobre coordenadas de pantalla
Las coordenadas de click de la herramienta `computer` (basada en screenshot) no siempre mapean 1:1 al viewport real de la página en este entorno — puede fallar al intentar clickear elementos angostos o muy próximos entre sí. Para reproducir bugs de click con precisión, preferir `javascript_tool` con selección directa del DOM y `.click()`, no coordenadas:
```js
Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Ingresar').click();
```
Evitar loops largos con múltiples `await` dentro de un solo `javascript_tool` — en este entorno han causado timeouts de 45s aun cuando la página seguía respondiendo normalmente (confirmado con una llamada simple `1+1` inmediatamente después). Preferir varias llamadas cortas y secuenciales en vez de un solo script con loop.

---

## REPOSITORIO Y CONTROL DE VERSIONES

- **Remoto:** `https://github.com/htortoza/chefcloud-front` (privado), rama `main`.
- **Convención de commits:** `feat(área): qué y por qué` en español (ej. `feat(gobernanza): ...`, `feat(login+ui): ...`) — revisar `git log --oneline` antes de escribir un mensaje nuevo para mantener el estilo.
- **Nunca commitear ni pushear sin pedido explícito del usuario en ese turno** — aunque el trabajo esté terminado y verificado, se queda en el working tree hasta que lo pidan.
- `ref-1.png` en la raíz del repo de `Motor-front-web` está deliberadamente sin trackear (no se sabe su propósito, no se usa en el código) — no agregarlo a menos que el usuario lo pida.

---

## CONFIGURACIÓN DE ANGULAR.JSON (referencia)

```json
"budgets": [
  { "type": "initial", "maximumWarning": "500kB", "maximumError": "1MB" },
  { "type": "anyComponentStyle", "maximumWarning": "24kB", "maximumError": "48kB" }
]
```

Si un componente supera el presupuesto, revisar si hay CSS redundante antes de aumentar el límite.
