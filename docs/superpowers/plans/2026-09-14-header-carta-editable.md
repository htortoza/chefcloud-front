# Header editable de Carta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar el tab General de `CartaDetail`. Nombre, descripción interna y vigencia (tipo + fecha + franja) pasan a un header propio, siempre visible arriba de las 3 tabs restantes, editables inline campo por campo (sin botón "Guardar" batch).

**Architecture:** Dos componentes nuevos. `EditableTextField` (compartido, `components/shared/`) es el primitivo de "texto + lápiz → input + check, Enter/blur guarda" — se usa para nombre y descripción. `CartaDetailHeader` (`components/cartas/`) compone dos `EditableTextField` más un bloque de edición propio para vigencia (varios campos a la vez), y reemplaza el `<app-page-header>` actual en `CartaDetail`. `CartaDetailGeneral` se borra entero.

**Tech Stack:** Angular 21 (Zoneless, Signals), PrimeNG 21 (Button, InputText, Select), Vitest.

## Global Constraints

- PrimeNG 21 exclusivo. Nada de Tailwind/PrimeFlex/clases utilitarias/`style="..."` inline salvo dato dinámico.
- Zoneless: sin `ngOnInit`/`ngOnDestroy`/`effect()` donde un signal/computed alcance. Ninguno de los componentes de este plan necesita `effect()` — los borradores se inicializan al entrar en modo edición, no de forma continua.
- Standalone, `ChangeDetectionStrategy.OnPush`, `@if`/`@for`, solo importar lo que se usa.
- `var(--p-...)` únicamente para colores/tokens.
- Testing: Vitest. Comando de verificación para cada paso: `npx ng test` desde `chefcloud-front/` — suite completa.
- Cada task termina con su propio commit; no `git push` sin pedido explícito del usuario.
- Cambio visible en UI (Task 3) termina con verificación manual en navegador.
- Spec completo: `docs/superpowers/specs/2026-09-14-header-carta-editable.md`.

---

## Task 1: `EditableTextField` (campo de texto compartido, editable inline)

**Files:**
- Create: `chefcloud-front/src/app/components/shared/editable-text-field/editable-text-field.ts`
- Create: `chefcloud-front/src/app/components/shared/editable-text-field/editable-text-field.html`
- Create: `chefcloud-front/src/app/components/shared/editable-text-field/editable-text-field.css`
- Create: `chefcloud-front/src/app/components/shared/editable-text-field/editable-text-field.spec.ts`

**Interfaces:**
- Produces (para Task 2): componente standalone `EditableTextField`, selector `app-editable-text-field`.
  - Input `valor: string` (requerido).
  - Input `requerido: boolean` (default `false`) — si `true`, un valor vacío tras `trim()` no dispara `guardar` y el campo vuelve a modo lectura sin cambios.
  - Output `guardar: string` — emite el valor final (recortado) al confirmar.
  - Métodos públicos usados directamente en tests: `iniciarEdicion()`, `confirmar()`, signals `editando: Signal<boolean>`, `borrador: WritableSignal<string>`.

- [ ] **Step 1: Escribir el spec completo (falla porque el componente no existe todavía)**

Crear `editable-text-field.spec.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditableTextField } from './editable-text-field';

describe('EditableTextField', () => {
  let fixture: ComponentFixture<EditableTextField>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EditableTextField] }).compileComponents();
    fixture = TestBed.createComponent(EditableTextField);
    fixture.componentRef.setInput('valor', 'Menú Regular');
    fixture.detectChanges();
  });

  it('modo lectura muestra el valor actual', () => {
    expect(fixture.nativeElement.textContent).toContain('Menú Regular');
  });

  it('clic en el texto entra en modo edición', () => {
    fixture.componentInstance.iniciarEdicion();
    fixture.detectChanges();

    expect(fixture.componentInstance.editando()).toBe(true);
    expect(fixture.nativeElement.querySelector('input')).toBeTruthy();
  });

  it('confirmar emite el valor recortado y sale de modo edición', () => {
    let emitido: string | undefined;
    fixture.componentInstance.guardar.subscribe((valor: string) => (emitido = valor));

    fixture.componentInstance.iniciarEdicion();
    fixture.componentInstance.borrador.set('  Nuevo nombre  ');
    fixture.componentInstance.confirmar();

    expect(emitido).toBe('Nuevo nombre');
    expect(fixture.componentInstance.editando()).toBe(false);
  });

  it('confirmar no se dispara dos veces seguidas (blur + click del mismo guardado)', () => {
    let veces = 0;
    fixture.componentInstance.guardar.subscribe(() => veces++);

    fixture.componentInstance.iniciarEdicion();
    fixture.componentInstance.borrador.set('Valor');
    fixture.componentInstance.confirmar();
    fixture.componentInstance.confirmar();

    expect(veces).toBe(1);
  });

  it('con requerido=true, un valor vacío no se guarda y vuelve a modo lectura', () => {
    fixture.componentRef.setInput('requerido', true);
    let emitido = false;
    fixture.componentInstance.guardar.subscribe(() => (emitido = true));

    fixture.componentInstance.iniciarEdicion();
    fixture.componentInstance.borrador.set('   ');
    fixture.componentInstance.confirmar();

    expect(emitido).toBe(false);
    expect(fixture.componentInstance.editando()).toBe(false);
  });

  it('sin requerido, un valor vacío sí se guarda', () => {
    let emitido: string | undefined;
    fixture.componentInstance.guardar.subscribe((valor: string) => (emitido = valor));

    fixture.componentInstance.iniciarEdicion();
    fixture.componentInstance.borrador.set('   ');
    fixture.componentInstance.confirmar();

    expect(emitido).toBe('');
  });
});
```

- [ ] **Step 2: Correr la suite y confirmar que falla por el módulo inexistente**

Run: `cd "chefcloud-front" && npx ng test`
Expected: FAIL — no se puede resolver `./editable-text-field` (el archivo `.ts` todavía no existe).

- [ ] **Step 3: Implementar el componente**

Crear `editable-text-field.ts`:

```typescript
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-editable-text-field',
  imports: [FormsModule, InputText, Button],
  templateUrl: './editable-text-field.html',
  styleUrl: './editable-text-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditableTextField {
  readonly valor = input.required<string>();
  readonly requerido = input(false);
  readonly guardar = output<string>();

  readonly editando = signal(false);
  readonly borrador = signal('');

  iniciarEdicion(): void {
    this.borrador.set(this.valor());
    this.editando.set(true);
  }

  confirmar(): void {
    if (!this.editando()) return;
    const valor = this.borrador().trim();
    if (this.requerido() && !valor) {
      this.editando.set(false);
      return;
    }
    this.guardar.emit(valor);
    this.editando.set(false);
  }
}
```

Crear `editable-text-field.html`:

```html
@if (editando()) {
  <div class="editable-text-field editable-text-field--editando">
    <input
      pInputText
      type="text"
      class="editable-text-field__input"
      autofocus
      [ngModel]="borrador()"
      (ngModelChange)="borrador.set($event)"
      (keydown.enter)="confirmar()"
      (blur)="confirmar()"
    />
    <p-button icon="pi pi-check" [text]="true" size="small" aria-label="Guardar" (onClick)="confirmar()" />
  </div>
} @else {
  <div class="editable-text-field" (click)="iniciarEdicion()">
    <span class="editable-text-field__valor">{{ valor() }}</span>
    <p-button icon="pi pi-pencil" [text]="true" size="small" aria-label="Editar" (onClick)="iniciarEdicion()" />
  </div>
}
```

Crear `editable-text-field.css`:

```css
.editable-text-field {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
  min-width: 0;
}

.editable-text-field__valor {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editable-text-field--editando {
  cursor: default;
}

.editable-text-field__input {
  flex: 1;
  min-width: 0;
}
```

- [ ] **Step 4: Correr la suite completa y confirmar que todo pasa**

Run: `cd "chefcloud-front" && npx ng test`
Expected: PASS — los 6 tests nuevos y el resto de la suite (96 tests previos + 6 = 102 en total).

- [ ] **Step 5: Commit**

```bash
git add chefcloud-front/src/app/components/shared/editable-text-field/
git commit -m "feat(shared): agrega EditableTextField — texto editable inline

Componente compartido: texto + lápiz -> input + check, Enter o blur
confirma. Soporta 'requerido' para bloquear guardar un valor vacío.
Primer uso: header editable de carta (próxima tarea)."
```

---

## Task 2: `CartaDetailHeader` (nombre, descripción y vigencia editables + Publicar)

**Files:**
- Create: `chefcloud-front/src/app/components/cartas/carta-detail-header/carta-detail-header.ts`
- Create: `chefcloud-front/src/app/components/cartas/carta-detail-header/carta-detail-header.html`
- Create: `chefcloud-front/src/app/components/cartas/carta-detail-header/carta-detail-header.css`
- Create: `chefcloud-front/src/app/components/cartas/carta-detail-header/carta-detail-header.spec.ts`

**Interfaces:**
- Consumes: `EditableTextField` (Task 1), `CartaService.actualizarGeneral(cartaId, cambios)`, `CartaService.publicar(cartaId)` (ya existentes, sin cambios), `Carta`/`TipoVigenciaCarta`/`FranjaEspecial` de `cartas.model.ts`.
- Produces (para Task 3): componente standalone `CartaDetailHeader`, selector `app-carta-detail-header`, input `carta: Carta` (requerido).

- [ ] **Step 1: Escribir el spec completo (falla porque el componente no existe todavía)**

Crear `carta-detail-header.spec.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CartaDetailHeader } from './carta-detail-header';
import { CartaService } from '../../../services/carta.service';
import { EditableTextField } from '../../shared/editable-text-field/editable-text-field';

describe('CartaDetailHeader', () => {
  let fixture: ComponentFixture<CartaDetailHeader>;
  let cartaService: CartaService;
  let cartaId: string;

  function refrescarInput() {
    fixture.componentRef.setInput('carta', cartaService.cartas().find((c) => c.id === cartaId));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CartaDetailHeader] }).compileComponents();
    cartaService = TestBed.inject(CartaService);
    cartaId = cartaService.crear('Carta de prueba');
    fixture = TestBed.createComponent(CartaDetailHeader);
    refrescarInput();
  });

  it('guardarNombre persiste el nombre en CartaService', () => {
    fixture.componentInstance.guardarNombre('Menú Renombrado');
    expect(cartaService.cartas().find((c) => c.id === cartaId)?.nombre).toBe('Menú Renombrado');
  });

  it('guardarDescripcion persiste la descripción en CartaService', () => {
    fixture.componentInstance.guardarDescripcion('Nueva descripción');
    expect(cartaService.cartas().find((c) => c.id === cartaId)?.descripcionInterna).toBe('Nueva descripción');
  });

  it('el campo de nombre exige valor no vacío (requerido), el de descripción no', () => {
    const [campoNombre, campoDescripcion] = fixture.debugElement.queryAll(By.directive(EditableTextField));
    expect(campoNombre.componentInstance.requerido()).toBe(true);
    expect(campoDescripcion.componentInstance.requerido()).toBe(false);
  });

  it('resumenVigencia muestra "Regular" por defecto', () => {
    expect(fixture.componentInstance.resumenVigencia()).toBe('Regular');
  });

  it('confirmarVigencia con tipo fecha-especial guarda tipoVigencia, rangoFechas y franjaEspecial juntos', () => {
    fixture.componentInstance.iniciarEdicionVigencia();
    fixture.componentInstance.tipoVigenciaBorrador.set('fecha-especial');
    fixture.componentInstance.rangoDesdeBorrador.set('2026-09-18');
    fixture.componentInstance.rangoHastaBorrador.set('2026-09-19');
    fixture.componentInstance.franjaEspecialBorrador.set('almuerzo');
    fixture.componentInstance.confirmarVigencia();

    const carta = cartaService.cartas().find((c) => c.id === cartaId)!;
    expect(carta.tipoVigencia).toBe('fecha-especial');
    expect(carta.rangoFechas).toEqual({ desde: '2026-09-18', hasta: '2026-09-19' });
    expect(carta.franjaEspecial).toBe('almuerzo');
    expect(fixture.componentInstance.editandoVigencia()).toBe(false);
  });

  it('volver a "regular" y confirmar limpia rangoFechas y franjaEspecial', () => {
    fixture.componentInstance.iniciarEdicionVigencia();
    fixture.componentInstance.tipoVigenciaBorrador.set('fecha-especial');
    fixture.componentInstance.rangoDesdeBorrador.set('2026-09-18');
    fixture.componentInstance.rangoHastaBorrador.set('2026-09-19');
    fixture.componentInstance.confirmarVigencia();
    refrescarInput();

    fixture.componentInstance.iniciarEdicionVigencia();
    fixture.componentInstance.tipoVigenciaBorrador.set('regular');
    fixture.componentInstance.confirmarVigencia();

    const carta = cartaService.cartas().find((c) => c.id === cartaId)!;
    expect(carta.tipoVigencia).toBe('regular');
    expect(carta.rangoFechas).toBeUndefined();
    expect(carta.franjaEspecial).toBeUndefined();
  });

  it('publicar llama a CartaService.publicar', () => {
    fixture.componentInstance.publicar();
    expect(cartaService.cartas().find((c) => c.id === cartaId)?.estado).toBe('publicada');
  });
});
```

- [ ] **Step 2: Correr la suite y confirmar que falla por el módulo inexistente**

Run: `cd "chefcloud-front" && npx ng test`
Expected: FAIL — no se puede resolver `./carta-detail-header`.

- [ ] **Step 3: Implementar el componente**

Crear `carta-detail-header.ts`:

```typescript
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { CartaService } from '../../../services/carta.service';
import { Carta, FranjaEspecial, TipoVigenciaCarta } from '../../../data/cartas.model';
import { EditableTextField } from '../../shared/editable-text-field/editable-text-field';

const OPCIONES_TIPO_VIGENCIA: { label: string; value: TipoVigenciaCarta }[] = [
  { label: 'Regular', value: 'regular' },
  { label: 'Fecha especial', value: 'fecha-especial' },
];

const OPCIONES_FRANJA_ESPECIAL: { label: string; value: FranjaEspecial }[] = [
  { label: 'Todo el día', value: 'todo-dia' },
  { label: 'Desayuno', value: 'desayuno' },
  { label: 'Brunch', value: 'brunch' },
  { label: 'Almuerzo', value: 'almuerzo' },
  { label: 'Cena', value: 'cena' },
];

@Component({
  selector: 'app-carta-detail-header',
  imports: [FormsModule, Select, Button, InputText, EditableTextField],
  templateUrl: './carta-detail-header.html',
  styleUrl: './carta-detail-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartaDetailHeader {
  private readonly cartaService = inject(CartaService);

  readonly carta = input.required<Carta>();
  readonly opcionesTipoVigencia = OPCIONES_TIPO_VIGENCIA;
  readonly opcionesFranjaEspecial = OPCIONES_FRANJA_ESPECIAL;

  readonly editandoVigencia = signal(false);
  readonly tipoVigenciaBorrador = signal<TipoVigenciaCarta>('regular');
  readonly rangoDesdeBorrador = signal('');
  readonly rangoHastaBorrador = signal('');
  readonly franjaEspecialBorrador = signal<FranjaEspecial>('todo-dia');

  readonly resumenVigencia = computed(() => {
    const c = this.carta();
    if (c.tipoVigencia === 'regular') return 'Regular';
    const franja = this.opcionesFranjaEspecial.find((f) => f.value === c.franjaEspecial)?.label ?? '';
    return `Fecha especial · ${c.rangoFechas?.desde ?? ''} – ${c.rangoFechas?.hasta ?? ''} · ${franja}`;
  });

  guardarNombre(valor: string): void {
    this.cartaService.actualizarGeneral(this.carta().id, { nombre: valor });
  }

  guardarDescripcion(valor: string): void {
    this.cartaService.actualizarGeneral(this.carta().id, { descripcionInterna: valor });
  }

  iniciarEdicionVigencia(): void {
    const c = this.carta();
    this.tipoVigenciaBorrador.set(c.tipoVigencia);
    this.rangoDesdeBorrador.set(c.rangoFechas?.desde ?? '');
    this.rangoHastaBorrador.set(c.rangoFechas?.hasta ?? '');
    this.franjaEspecialBorrador.set(c.franjaEspecial ?? 'todo-dia');
    this.editandoVigencia.set(true);
  }

  confirmarVigencia(): void {
    if (!this.editandoVigencia()) return;
    const esFechaEspecial = this.tipoVigenciaBorrador() === 'fecha-especial';
    this.cartaService.actualizarGeneral(this.carta().id, {
      tipoVigencia: this.tipoVigenciaBorrador(),
      rangoFechas: esFechaEspecial ? { desde: this.rangoDesdeBorrador(), hasta: this.rangoHastaBorrador() } : undefined,
      franjaEspecial: esFechaEspecial ? this.franjaEspecialBorrador() : undefined,
    });
    this.editandoVigencia.set(false);
  }

  publicar(): void {
    this.cartaService.publicar(this.carta().id);
  }
}
```

Crear `carta-detail-header.html`:

```html
<div class="carta-detail-header">
  <div class="carta-detail-header__fila">
    <app-editable-text-field class="carta-detail-header__nombre" [valor]="carta().nombre" [requerido]="true" (guardar)="guardarNombre($event)" />
    <p-button label="Publicar" severity="success" [outlined]="true" (onClick)="publicar()" />
  </div>

  <div class="carta-detail-header__fila carta-detail-header__fila--secundaria">
    <app-editable-text-field class="carta-detail-header__descripcion" [valor]="carta().descripcionInterna" (guardar)="guardarDescripcion($event)" />

    <div class="carta-detail-header__vigencia">
      @if (editandoVigencia()) {
        <div class="vigencia-edicion">
          <p-select
            [options]="opcionesTipoVigencia"
            optionLabel="label"
            optionValue="value"
            [ngModel]="tipoVigenciaBorrador()"
            (ngModelChange)="tipoVigenciaBorrador.set($event)"
          />
          @if (tipoVigenciaBorrador() === 'fecha-especial') {
            <input pInputText type="date" [ngModel]="rangoDesdeBorrador()" (ngModelChange)="rangoDesdeBorrador.set($event)" (keydown.enter)="confirmarVigencia()" />
            <input pInputText type="date" [ngModel]="rangoHastaBorrador()" (ngModelChange)="rangoHastaBorrador.set($event)" (keydown.enter)="confirmarVigencia()" />
            <p-select
              [options]="opcionesFranjaEspecial"
              optionLabel="label"
              optionValue="value"
              [ngModel]="franjaEspecialBorrador()"
              (ngModelChange)="franjaEspecialBorrador.set($event)"
            />
          }
          <p-button icon="pi pi-check" [text]="true" size="small" aria-label="Guardar vigencia" (onClick)="confirmarVigencia()" />
        </div>
      } @else {
        <div class="vigencia-resumen" (click)="iniciarEdicionVigencia()">
          <span>{{ resumenVigencia() }}</span>
          <p-button icon="pi pi-pencil" [text]="true" size="small" aria-label="Editar vigencia" (onClick)="iniciarEdicionVigencia()" />
        </div>
      }
    </div>
  </div>
</div>
```

Crear `carta-detail-header.css`:

```css
.carta-detail-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.carta-detail-header__fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.carta-detail-header__nombre {
  font-size: 1.1rem;
  font-weight: 500;
  flex: 1;
  min-width: 0;
}

.carta-detail-header__fila--secundaria {
  align-items: flex-start;
  font-size: 0.875rem;
  color: var(--p-text-muted-color);
}

.carta-detail-header__descripcion {
  width: 50%;
  min-width: 0;
}

.carta-detail-header__vigencia {
  flex: 1;
  min-width: 0;
  display: flex;
  justify-content: flex-end;
}

.vigencia-resumen {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
}

.vigencia-edicion {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}
```

- [ ] **Step 4: Correr la suite completa y confirmar que todo pasa**

Run: `cd "chefcloud-front" && npx ng test`
Expected: PASS — los 7 tests nuevos de este componente más los 102 previos (109 en total).

- [ ] **Step 5: Commit**

```bash
git add chefcloud-front/src/app/components/cartas/carta-detail-header/
git commit -m "feat(cartas): agrega CartaDetailHeader — nombre/descripción/vigencia editables

Nombre y descripción usan EditableTextField; vigencia es un bloque
propio (tipo + fecha + franja se guardan juntos, como antes hacía el
botón Guardar del tab General). Todavía no está conectado a
CartaDetail (próxima tarea)."
```

---

## Task 3: Reemplazar el tab General por el header en `CartaDetail`

**Files:**
- Modify: `chefcloud-front/src/app/components/cartas/carta-detail/carta-detail.ts`
- Modify: `chefcloud-front/src/app/components/cartas/carta-detail/carta-detail.html`
- Modify: `chefcloud-front/src/app/components/cartas/carta-detail/carta-detail.spec.ts`
- Delete: `chefcloud-front/src/app/components/cartas/carta-detail-general/` (carpeta completa: `.ts`, `.html`, `.css`, `.spec.ts`)

**Interfaces:**
- Consumes: `CartaDetailHeader` (Task 2), selector `app-carta-detail-header`, input `carta`.

- [ ] **Step 1: Agregar el test de que General ya no existe (falla porque el tab todavía está)**

En `carta-detail.spec.ts`, agregar al final del `describe`, antes del `});`:

```typescript
  it('no muestra el tab General — su contenido vive en el header editable', () => {
    const valores = Array.from(fixture.nativeElement.querySelectorAll('p-tab')).map((el: any) => el.getAttribute('value'));
    expect(valores).not.toContain('general');
  });
```

- [ ] **Step 2: Correr la suite y confirmar que ese test falla**

Run: `cd "chefcloud-front" && npx ng test`
Expected: FAIL solo ese test nuevo (`valores` todavía incluye `'general'`); el resto de la suite (109 tests) sigue pasando.

- [ ] **Step 3: Actualizar `carta-detail.ts`**

```typescript
// Antes:
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { PageHeader } from '../../shared/page-header/page-header';
import { CartaService } from '../../../services/carta.service';
import { CartaDetailGeneral } from '../carta-detail-general/carta-detail-general';
import { CartaDetailEstructura } from '../carta-detail-estructura/carta-detail-estructura';
import { CartaDetailAsignacion } from '../carta-detail-asignacion/carta-detail-asignacion';
import { CartaDetailExperiencias } from '../carta-detail-experiencias/carta-detail-experiencias';

@Component({
  selector: 'app-carta-detail',
  imports: [
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    PageHeader,
    CartaDetailGeneral,
    CartaDetailEstructura,
    CartaDetailAsignacion,
    CartaDetailExperiencias,
  ],
  templateUrl: './carta-detail.html',
  styleUrl: './carta-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartaDetail {

// Después:
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { CartaService } from '../../../services/carta.service';
import { CartaDetailHeader } from '../carta-detail-header/carta-detail-header';
import { CartaDetailEstructura } from '../carta-detail-estructura/carta-detail-estructura';
import { CartaDetailAsignacion } from '../carta-detail-asignacion/carta-detail-asignacion';
import { CartaDetailExperiencias } from '../carta-detail-experiencias/carta-detail-experiencias';

@Component({
  selector: 'app-carta-detail',
  imports: [
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    CartaDetailHeader,
    CartaDetailEstructura,
    CartaDetailAsignacion,
    CartaDetailExperiencias,
  ],
  templateUrl: './carta-detail.html',
  styleUrl: './carta-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartaDetail {
```

(El resto del archivo — `private readonly cartaService`, `id`, `carta` — no cambia.)

- [ ] **Step 4: Actualizar `carta-detail.html`**

```html
@if (carta(); as cartaActiva) {
  <app-carta-detail-header [carta]="cartaActiva" />

  <p-tabs value="estructura">
    <p-tablist>
      <p-tab value="estructura">Estructura</p-tab>
      <p-tab value="asignacion">Asignación</p-tab>
      <p-tab value="experiencias">Experiencias</p-tab>
    </p-tablist>
    <p-tabpanels>
      <p-tabpanel value="estructura">
        <app-carta-detail-estructura [carta]="cartaActiva" />
      </p-tabpanel>
      <p-tabpanel value="asignacion">
        <app-carta-detail-asignacion [carta]="cartaActiva" />
      </p-tabpanel>
      <p-tabpanel value="experiencias">
        <app-carta-detail-experiencias [carta]="cartaActiva" />
      </p-tabpanel>
    </p-tabpanels>
  </p-tabs>
} @else {
  <p>Carta no encontrada.</p>
}
```

- [ ] **Step 5: Borrar `carta-detail-general/`**

```bash
git rm -r chefcloud-front/src/app/components/cartas/carta-detail-general/
```

- [ ] **Step 6: Correr la suite completa y confirmar que todo pasa**

Run: `cd "chefcloud-front" && npx ng test`
Expected: PASS — 108 tests: 109 previos + el test nuevo de este paso, menos los 2 de `carta-detail-general.spec.ts` que desaparecen junto con el archivo.

- [ ] **Step 7: Build sin errores**

Run: `cd "chefcloud-front" && npx ng build`
Expected: build exitoso. Puede seguir apareciendo el warning de bundle inicial (500kB) — es preexistente, no de este cambio (ver commit de Task 3 del plan anterior, `nav-secciones-carta`). No debería aparecer ningún warning nuevo de `anyComponentStyle` para `carta-detail-header.css` ni `editable-text-field.css` — son chicos.

- [ ] **Step 8: Verificación manual en navegador**

Con `npx ng serve` corriendo, entrar a una carta (ej. "Menú Regular") y confirmar:
- No hay tab "General" — quedan Estructura, Asignación, Experiencias.
- El nombre aparece arriba, editable: clic entra en edición, `Enter` guarda y confirma visualmente el nuevo nombre.
- La descripción aparece debajo del nombre, ocupando ~mitad del ancho; clic la hace editable; hacer blur (clic afuera) guarda.
- A la derecha de la descripción aparece "Regular" (o la fecha especial si la carta es "Fiestas Patrias"); clic la hace editable, cambiar a "Fecha especial" muestra los campos de fecha + franja, confirmar con el ✓ los guarda todos juntos.
- Intentar vaciar el nombre y confirmar — no debe guardarse vacío, el nombre anterior se mantiene.
- El botón "Publicar" sigue funcionando (carta pasa a estado publicada — verificable en el listado de Cartas).

- [ ] **Step 9: Commit**

```bash
git add chefcloud-front/src/app/components/cartas/carta-detail/carta-detail.ts chefcloud-front/src/app/components/cartas/carta-detail/carta-detail.html chefcloud-front/src/app/components/cartas/carta-detail/carta-detail.spec.ts
git commit -m "feat(cartas): elimina tab General — su contenido vive en el header editable

Nombre, descripción y vigencia se editan inline desde el header que
ahora está arriba de las 3 tabs restantes (Estructura, Asignación,
Experiencias). CartaDetailGeneral se borra entero — nada más lo
referenciaba."
```
