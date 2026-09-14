import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Checkbox } from 'primeng/checkbox';
import { Router } from '@angular/router';
import { CartaService } from '../../../services/carta.service';
import { ProductoService } from '../../../services/producto.service';
import { SesionService } from '../../../services/sesion.service';
import { FranjaHorariaService } from '../../../services/franja-horaria.service';
import { Carta, Canal, DiagnosticoError, EstadoCanalProducto, Seccion } from '../../../data/cartas.model';
import { puedeEditarOperacion } from '../../../data/roles.model';
import { ProductoSelectorDialog } from '../producto-selector-dialog/producto-selector-dialog';

type SeveridadGlobal = 'activo' | 'pausado' | 'error';

interface EstadoGlobalCanal {
  canal: Canal;
  texto: string;
  severidad: SeveridadGlobal;
}

@Component({
  selector: 'app-carta-detail-estructura',
  imports: [FormsModule, DecimalPipe, Button, Select, InputNumber, InputText, Checkbox, ProductoSelectorDialog],
  templateUrl: './carta-detail-estructura.html',
  styleUrl: './carta-detail-estructura.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartaDetailEstructura {
  private readonly cartaService = inject(CartaService);
  private readonly productoService = inject(ProductoService);
  private readonly sesionService = inject(SesionService);
  private readonly router = inject(Router);
  private readonly franjaHorariaService = inject(FranjaHorariaService);

  readonly carta = input.required<Carta>();
  readonly canales = this.cartaService.canales;
  readonly franjas = this.franjaHorariaService.franjas;

  /** Precio y estado por canal son dominio de Operaciones — brief v3 sección 3. */
  readonly puedeEditar = computed(() => puedeEditarOperacion(this.sesionService.rol()));

  readonly expandidos = signal<Set<string>>(new Set());
  readonly seleccionados = signal<Set<string>>(new Set());
  readonly canalBulkSeleccionado = signal(this.canales()[0]?.id ?? '');
  readonly seccionEnRenombre = signal<string | null>(null);
  readonly nombreEnEdicion = signal('');
  readonly seccionParaAgregarId = signal<string | null>(null);

  readonly secciones = computed(() => this.carta().secciones);

  readonly todosLosProductosIds = computed(() => this.secciones().flatMap((s) => s.items.map((i) => i.productoId)));
  readonly idsProductosEnCarta = computed(() => new Set(this.todosLosProductosIds()));

  readonly todosSeleccionados = computed(() => {
    const ids = this.todosLosProductosIds();
    return ids.length > 0 && ids.every((id) => this.seleccionados().has(id));
  });

  readonly estadoGlobalCanales = computed<EstadoGlobalCanal[]>(() => {
    const cartaId = this.carta().id;
    const ids = this.todosLosProductosIds();
    return this.canales().map((canal) => {
      const estados = ids.map((pid) => this.cartaService.estadoCanal(cartaId, canal.id, pid)?.estado ?? 'activo');
      const conError = estados.filter((e) => e === 'error').length;
      if (conError > 0) return { canal, texto: `${conError} con error`, severidad: 'error' as const };
      if (estados.length > 0 && estados.every((e) => e === 'pausado')) return { canal, texto: 'Pausado', severidad: 'pausado' as const };
      return { canal, texto: 'Publicado', severidad: 'activo' as const };
    });
  });

  productosDe(seccion: Seccion) {
    return seccion.items.map((item) => this.productoService.obtenerPorId(item.productoId)).filter((p) => p !== undefined);
  }

  estadoDe(productoId: string, canalId: string): EstadoCanalProducto {
    return this.cartaService.estadoCanal(this.carta().id, canalId, productoId)?.estado ?? 'activo';
  }

  precioMostrado(productoId: string, canalId: string): number {
    const producto = this.productoService.obtenerPorId(productoId);
    const override = this.cartaService.estadoCanal(this.carta().id, canalId, productoId);
    return override?.precio ?? producto?.precioVenta ?? 0;
  }

  tieneOverridePrecio(productoId: string, canalId: string): boolean {
    return this.cartaService.estadoCanal(this.carta().id, canalId, productoId)?.precio !== undefined;
  }

  diagnosticoDe(productoId: string, canalId: string): DiagnosticoError | undefined {
    return this.cartaService.estadoCanal(this.carta().id, canalId, productoId)?.diagnostico;
  }

  estaExpandido(productoId: string): boolean {
    return this.expandidos().has(productoId);
  }

  private expandir(productoId: string): void {
    this.expandidos.update((set) => new Set(set).add(productoId));
  }

  toggleExpandirProducto(productoId: string): void {
    this.expandidos.update((set) => {
      const copia = new Set(set);
      if (copia.has(productoId)) copia.delete(productoId);
      else copia.add(productoId);
      return copia;
    });
  }

  clickPastilla(productoId: string, canalId: string): void {
    const estado = this.estadoDe(productoId, canalId);
    if (estado === 'error') {
      this.expandir(productoId); // ver diagnóstico es una acción de lectura, disponible para cualquier rol
      return;
    }
    if (!this.puedeEditar()) return;
    const nuevo = estado === 'activo' ? 'pausado' : 'activo';
    this.cartaService.setEstadoOperativo(this.carta().id, canalId, productoId, nuevo);
  }

  actualizarPrecio(productoId: string, canalId: string, valor: number): void {
    if (!this.puedeEditar()) return;
    const producto = this.productoService.obtenerPorId(productoId);
    const nuevoPrecio = producto && valor === producto.precioVenta ? undefined : valor;
    this.cartaService.setPrecioCanal(this.carta().id, canalId, productoId, nuevoPrecio);
  }

  usarPrecioBase(productoId: string, canalId: string): void {
    if (!this.puedeEditar()) return;
    this.cartaService.setPrecioCanal(this.carta().id, canalId, productoId, undefined);
  }

  reintentar(productoId: string, canalId: string): void {
    if (!this.puedeEditar()) return;
    this.cartaService.reintentar(this.carta().id, canalId, productoId);
  }

  /** Demo/dev only — no hay backend real que falle solo; esto existe para poder probar diagnóstico + reintento. */
  simularError(productoId: string, canalId: string): void {
    this.cartaService.simularErrorCanal(this.carta().id, canalId, productoId, 'Actualizar disponibilidad', 'El canal devolvió error 500 (simulado)');
    this.expandir(productoId);
  }

  toggleSeleccionProducto(productoId: string): void {
    this.seleccionados.update((set) => {
      const copia = new Set(set);
      if (copia.has(productoId)) copia.delete(productoId);
      else copia.add(productoId);
      return copia;
    });
  }

  toggleSeleccionarTodos(): void {
    this.seleccionados.set(this.todosSeleccionados() ? new Set() : new Set(this.todosLosProductosIds()));
  }

  aplicarAccionMasiva(estado: Extract<EstadoCanalProducto, 'activo' | 'pausado'>): void {
    if (!this.puedeEditar()) return;
    const cartaId = this.carta().id;
    const canalId = this.canalBulkSeleccionado();
    this.seleccionados().forEach((productoId) => this.cartaService.setEstadoOperativo(cartaId, canalId, productoId, estado));
  }

  quitarProductoDeSeccion(seccionId: string, productoId: string): void {
    this.cartaService.quitarItem(this.carta().id, seccionId, productoId);
  }

  abrirSelectorProductos(seccionId: string): void {
    this.seccionParaAgregarId.set(seccionId);
  }

  cerrarSelectorProductos(): void {
    this.seccionParaAgregarId.set(null);
  }

  agregarProductosSeleccionados(seccionId: string, productoIds: string[]): void {
    const cartaId = this.carta().id;
    productoIds.forEach((productoId) => this.cartaService.agregarItem(cartaId, seccionId, productoId));
    this.seccionParaAgregarId.set(null);
  }

  franjaDe(seccion: Seccion) {
    return this.franjaHorariaService.obtenerPorId(seccion.franjaId);
  }

  actualizarFranjaSeccion(seccionId: string, franjaId: string): void {
    this.cartaService.actualizarSeccion(this.carta().id, seccionId, { franjaId });
  }

  iniciarRenombre(seccionId: string, nombreActual: string): void {
    this.nombreEnEdicion.set(nombreActual);
    this.seccionEnRenombre.set(seccionId);
  }

  confirmarRenombre(seccionId: string): void {
    const valor = this.nombreEnEdicion().trim();
    if (valor) {
      this.cartaService.actualizarSeccion(this.carta().id, seccionId, { nombre: valor });
    }
    this.seccionEnRenombre.set(null);
  }

  moverSeccion(seccionId: string, direccion: 'arriba' | 'abajo'): void {
    this.cartaService.moverSeccion(this.carta().id, seccionId, direccion);
  }

  eliminarSeccion(seccion: Pick<Seccion, 'id' | 'items'>): void {
    if (seccion.items.length > 0) {
      const confirmado = window.confirm(
        `La sección tiene ${seccion.items.length} producto(s). ¿Eliminarla de todas formas? Los productos se quitan de la carta.`,
      );
      if (!confirmado) return;
    }
    this.cartaService.eliminarSeccion(this.carta().id, seccion.id);
  }

  agregarSeccionNueva(): void {
    const id = this.cartaService.agregarSeccion(this.carta().id, 'Nueva sección');
    this.nombreEnEdicion.set('Nueva sección');
    this.seccionEnRenombre.set(id);
  }

  /** Nunca busca el mismo producto dos veces — lleva al producto específico en Catálogo, con retorno a esta carta. Brief v3 sección 4. */
  editarEnCatalogo(productoId: string): void {
    this.router.navigate(['/productos'], { queryParams: { productoId, cartaId: this.carta().id } });
  }
}
