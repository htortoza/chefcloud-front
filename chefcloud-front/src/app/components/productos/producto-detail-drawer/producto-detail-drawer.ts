import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Drawer } from 'primeng/drawer';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { Button } from 'primeng/button';
import { Fluid } from 'primeng/fluid';
import { ProductoService } from '../../../services/producto.service';
import { CartaService } from '../../../services/carta.service';
import { SesionService } from '../../../services/sesion.service';
import { Producto } from '../../../data/catalogo.model';
import { EstadoCanalProducto } from '../../../data/cartas.model';
import { puedeEditarMarketing, puedeEditarOperacion } from '../../../data/roles.model';

interface FormularioGrupoModificador {
  nombre: ReturnType<typeof signal<string>>;
  minimo: ReturnType<typeof signal<number>>;
  maximo: ReturnType<typeof signal<number>>;
}

@Component({
  selector: 'app-producto-detail-drawer',
  imports: [FormsModule, DecimalPipe, Drawer, InputText, InputNumber, Select, Button, Fluid],
  templateUrl: './producto-detail-drawer.html',
  styleUrl: './producto-detail-drawer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoDetailDrawer {
  private readonly productoService = inject(ProductoService);
  private readonly cartaService = inject(CartaService);
  private readonly sesionService = inject(SesionService);
  private readonly router = inject(Router);

  readonly producto = input<Producto | null>(null);
  /** Presente solo cuando se llega vía "Editar en catálogo" desde una Carta — habilita la sección "Por canal" y "Volver a la carta". */
  readonly cartaId = input<string | null>(null);
  readonly cerrar = output<void>();

  readonly categorias = this.productoService.categorias;
  readonly canales = this.cartaService.canales;
  readonly visible = signal(true);
  readonly grupos = signal<FormularioGrupoModificador[]>([]);

  /** Marketing es dueño del contenido base (nombre/descripción/foto) y por canal — Módulo 0 sección 4, Módulo 1 sección 3. */
  readonly puedeEditar = computed(() => puedeEditarMarketing(this.sesionService.rol()));
  /** Precio base también es de Operaciones (Módulo 1 sección 4, punto 2) — solo aplica editando un producto existente; crear uno nuevo no está en el alcance de este permiso. */
  readonly puedeEditarPrecioBase = computed(() => puedeEditarOperacion(this.sesionService.rol()));
  readonly editandoExistente = computed(() => this.producto() !== null);

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
      this.grupos.set(
        (actual?.gruposModificadores ?? []).map((g) => ({
          nombre: signal(g.nombre),
          minimo: signal(g.minimo),
          maximo: signal(g.maximo),
        })),
      );
    });
  }

  agregarGrupoModificador(): void {
    this.grupos.update((lista) => [...lista, { nombre: signal(''), minimo: signal(0), maximo: signal(1) }]);
  }

  eliminarGrupoModificador(indice: number): void {
    this.grupos.update((lista) => lista.filter((_, i) => i !== indice));
  }

  guardar(): void {
    const actual = this.producto();
    const gruposModificadores = this.grupos().map((g) => ({
      id: crypto.randomUUID(),
      nombre: g.nombre(),
      minimo: g.minimo(),
      maximo: g.maximo(),
      opciones: [],
    }));
    const valores = {
      nombre: this.form.nombre(),
      descripcion: this.form.descripcion(),
      foto: this.form.foto() || undefined,
      precioVenta: this.form.precioVenta(),
      precioOferta: this.form.precioOferta(),
      precioCosto: this.form.precioCosto(),
      sku: this.form.sku(),
      categoriaId: this.form.categoriaId(),
      gruposModificadores,
    };

    if (actual) {
      this.productoService.actualizar(actual.id, valores);
    } else {
      this.productoService.crear({ ...valores, etiquetas: [] });
    }

    this.cerrarDrawer();
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

  volverALaCarta(): void {
    const carta = this.cartaId();
    if (!carta) return;
    this.router.navigate(['/cartas', carta]);
  }
}
