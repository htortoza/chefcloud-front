import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { Button } from 'primeng/button';
import { ConfirmationService, PrimeTemplate } from 'primeng/api';
import { ProductoService } from '../../../services/producto.service';
import { CartaService } from '../../../services/carta.service';
import { AdicionalService } from '../../../services/adicional.service';
import { SesionService } from '../../../services/sesion.service';
import { Producto } from '../../../data/catalogo.model';
import { EstadoCanalProducto } from '../../../data/cartas.model';
import { puedeEditarMarketing, puedeEditarOperacion } from '../../../data/roles.model';
import { AdicionalSelectorDialog } from '../../cartas/adicional-selector-dialog/adicional-selector-dialog';

@Component({
  selector: 'app-producto-detail-drawer',
  imports: [FormsModule, DecimalPipe, Dialog, InputText, Textarea, InputNumber, Select, Button, PrimeTemplate, AdicionalSelectorDialog],
  templateUrl: './producto-detail-drawer.html',
  styleUrl: './producto-detail-drawer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoDetailDrawer {
  private readonly productoService = inject(ProductoService);
  private readonly cartaService = inject(CartaService);
  private readonly adicionalService = inject(AdicionalService);
  private readonly sesionService = inject(SesionService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);

  readonly producto = input<Producto | null>(null);
  /** Presente solo cuando se llega vía "Editar en catálogo" desde una Carta — habilita la sección "Por canal" y "Volver a la carta". */
  readonly cartaId = input<string | null>(null);
  readonly cerrar = output<void>();
  /** Emite el id del producto recién creado — solo en modo creación, para que quien abrió el drawer (ej. el selector de una sección) pueda usarlo sin tener que volver a buscarlo. */
  readonly creado = output<string>();

  readonly categorias = this.productoService.categorias;
  readonly canales = this.cartaService.canales;
  readonly visible = signal(true);
  readonly mostrandoSelectorAdicionales = signal(false);

  /** Marketing es dueño del contenido base (nombre/descripción/foto) y por canal — Módulo 0 sección 4, Módulo 1 sección 3. */
  readonly puedeEditar = computed(() => puedeEditarMarketing(this.sesionService.rol()));
  /** Operaciones: precio (base y por canal) y asociación de adicionales — mismo permiso que en Estructura, esta es una segunda superficie sobre los mismos métodos, no un gate nuevo. */
  readonly puedeEditarPrecioBase = computed(() => puedeEditarOperacion(this.sesionService.rol()));
  readonly editandoExistente = computed(() => this.producto() !== null);

  readonly gruposAsociados = computed(() => {
    const p = this.producto();
    return p ? this.adicionalService.gruposDeProducto(p.id) : [];
  });
  readonly idsAdicionalesAsociados = computed(() => new Set(this.gruposAsociados().map((g) => g.id)));

  readonly form = {
    nombre: signal(''),
    descripcion: signal(''),
    foto: signal(''),
    precioVenta: signal(0),
    precioOferta: signal<number | undefined>(undefined),
    precioCosto: signal(0),
    sku: signal(''),
    categoriaId: signal(''),
  };

  constructor() {
    effect(() => {
      const actual = this.producto();
      this.form.nombre.set(actual?.nombre ?? '');
      this.form.descripcion.set(actual?.descripcion ?? '');
      this.form.foto.set(actual?.foto ?? '');
      this.form.precioVenta.set(actual?.precioVenta ?? 0);
      this.form.precioOferta.set(actual?.precioOferta);
      this.form.precioCosto.set(actual?.precioCosto ?? 0);
      this.form.sku.set(actual?.sku ?? '');
      this.form.categoriaId.set(actual?.categoriaId ?? this.categorias()[0]?.id ?? '');
    });
  }

  abrirSelectorAdicionales(): void {
    if (!this.puedeEditarPrecioBase()) return;
    this.mostrandoSelectorAdicionales.set(true);
  }

  cerrarSelectorAdicionales(): void {
    this.mostrandoSelectorAdicionales.set(false);
  }

  agregarAdicionales(grupoIds: string[]): void {
    const producto = this.producto();
    if (!producto) return;
    grupoIds.forEach((grupoId) => this.adicionalService.asociarProducto(grupoId, producto.id));
    this.cerrarSelectorAdicionales();
  }

  quitarAdicional(grupoId: string): void {
    if (!this.puedeEditarPrecioBase()) return;
    const producto = this.producto();
    if (!producto) return;
    this.adicionalService.desasociarProducto(grupoId, producto.id);
  }

  guardar(): void {
    const actual = this.producto();
    const valores = {
      nombre: this.form.nombre(),
      descripcion: this.form.descripcion(),
      foto: this.form.foto() || undefined,
      precioVenta: this.form.precioVenta(),
      precioOferta: this.form.precioOferta(),
      precioCosto: this.form.precioCosto(),
      sku: this.form.sku(),
      categoriaId: this.form.categoriaId(),
    };

    if (!actual) {
      const nuevoId = this.productoService.crear({ ...valores, etiquetas: [] });
      this.creado.emit(nuevoId);
      this.cerrarDrawer();
      return;
    }

    const cambioNombre = valores.nombre !== actual.nombre;
    const cambioDescripcion = valores.descripcion !== actual.descripcion;
    const cambioPrecio = valores.precioVenta !== actual.precioVenta;
    const overridesAfectados =
      cambioNombre || cambioDescripcion || cambioPrecio
        ? this.cartaService
            .estadosCanalDeProducto(actual.id)
            .filter((e) => (cambioNombre && e.nombre !== undefined) || (cambioDescripcion && e.descripcion !== undefined) || (cambioPrecio && e.precio !== undefined))
        : [];

    this.productoService.actualizar(actual.id, valores);

    if (overridesAfectados.length === 0) {
      this.cerrarDrawer();
      return;
    }

    this.confirmationService.confirm({
      header: 'Actualizar también los canales',
      message: `Este producto tiene ${overridesAfectados.length} override${overridesAfectados.length === 1 ? '' : 's'} de nombre, descripción o precio en canales de distintas cartas. ¿Los actualizamos también a los nuevos valores base, o los dejamos como están?`,
      icon: 'pi pi-question-circle',
      acceptLabel: 'Actualizar también',
      rejectLabel: 'Dejar como están',
      acceptButtonProps: { severity: 'warn' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        overridesAfectados.forEach((o) => {
          if (cambioNombre && o.nombre !== undefined) this.cartaService.setNombreCanal(o.cartaId, o.canalId, actual.id, undefined);
          if (cambioDescripcion && o.descripcion !== undefined) this.cartaService.setDescripcionCanal(o.cartaId, o.canalId, actual.id, undefined);
          if (cambioPrecio && o.precio !== undefined) this.cartaService.setPrecioCanal(o.cartaId, o.canalId, actual.id, undefined);
        });
        this.cerrarDrawer();
      },
      reject: () => this.cerrarDrawer(),
    });
  }

  cerrarDrawer(): void {
    this.visible.set(false);
    this.cerrar.emit();
  }

  private estadoCanal(canalId: string) {
    const carta = this.cartaId();
    const producto = this.producto();
    if (!carta || !producto) return undefined;
    return this.cartaService.estadoCanal(carta, canalId, producto.id);
  }

  nombreCanal(canalId: string): string | undefined {
    return this.estadoCanal(canalId)?.nombre;
  }

  descripcionCanal(canalId: string): string | undefined {
    return this.estadoCanal(canalId)?.descripcion;
  }

  precioCanalMostrado(canalId: string): number {
    return this.estadoCanal(canalId)?.precio ?? this.producto()?.precioVenta ?? 0;
  }

  tieneOverridePrecioCanal(canalId: string): boolean {
    return this.estadoCanal(canalId)?.precio !== undefined;
  }

  estadoCanalMostrado(canalId: string): EstadoCanalProducto {
    return this.estadoCanal(canalId)?.estado ?? 'activo';
  }

  actualizarNombreBase(valor: string): void {
    if (this.editandoExistente() && !this.puedeEditar()) return;
    this.form.nombre.set(valor);
  }

  actualizarDescripcionBase(valor: string): void {
    if (this.editandoExistente() && !this.puedeEditar()) return;
    this.form.descripcion.set(valor);
  }

  actualizarPrecioVentaBase(valor: number): void {
    if (this.editandoExistente() && !this.puedeEditarPrecioBase()) return;
    this.form.precioVenta.set(valor);
  }

  actualizarNombreCanal(canalId: string, valor: string): void {
    if (!this.puedeEditar()) return;
    const carta = this.cartaId();
    const producto = this.producto();
    if (!carta || !producto) return;
    const limpio = valor.trim();
    this.cartaService.setNombreCanal(carta, canalId, producto.id, limpio === '' || limpio === producto.nombre ? undefined : limpio);
  }

  actualizarDescripcionCanal(canalId: string, valor: string): void {
    if (!this.puedeEditar()) return;
    const carta = this.cartaId();
    const producto = this.producto();
    if (!carta || !producto) return;
    const limpio = valor.trim();
    this.cartaService.setDescripcionCanal(carta, canalId, producto.id, limpio === '' || limpio === producto.descripcion ? undefined : limpio);
  }

  actualizarPrecioCanal(canalId: string, valor: number): void {
    if (!this.puedeEditarPrecioBase()) return;
    const carta = this.cartaId();
    const producto = this.producto();
    if (!carta || !producto) return;
    this.cartaService.setPrecioCanal(carta, canalId, producto.id, valor === producto.precioVenta ? undefined : valor);
  }

  usarNombreBaseCanal(canalId: string): void {
    if (!this.puedeEditar()) return;
    const carta = this.cartaId();
    const producto = this.producto();
    if (!carta || !producto) return;
    this.cartaService.setNombreCanal(carta, canalId, producto.id, undefined);
  }

  usarDescripcionBaseCanal(canalId: string): void {
    if (!this.puedeEditar()) return;
    const carta = this.cartaId();
    const producto = this.producto();
    if (!carta || !producto) return;
    this.cartaService.setDescripcionCanal(carta, canalId, producto.id, undefined);
  }

  usarPrecioBaseCanal(canalId: string): void {
    if (!this.puedeEditarPrecioBase()) return;
    const carta = this.cartaId();
    const producto = this.producto();
    if (!carta || !producto) return;
    this.cartaService.setPrecioCanal(carta, canalId, producto.id, undefined);
  }

  volverALaCarta(): void {
    const carta = this.cartaId();
    if (!carta) return;
    this.router.navigate(['/cartas', carta]);
  }
}
