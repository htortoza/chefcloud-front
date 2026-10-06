import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { InputText } from 'primeng/inputtext';
import { Checkbox } from 'primeng/checkbox';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { ConfirmationService, PrimeTemplate } from 'primeng/api';
import { Router, RouterLink } from '@angular/router';
import { CartaService } from '../../../services/carta.service';
import { ProductoService } from '../../../services/producto.service';
import { SesionService } from '../../../services/sesion.service';
import { FranjaHorariaService } from '../../../services/franja-horaria.service';
import { AdicionalService } from '../../../services/adicional.service';
import { Carta, EstadoCanalProducto, Seccion } from '../../../data/cartas.model';
import { puedeEditarOperacion } from '../../../data/roles.model';
import { ProductoSelectorDialog } from '../producto-selector-dialog/producto-selector-dialog';
import { AdicionalSelectorDialog } from '../adicional-selector-dialog/adicional-selector-dialog';
import { CanalTarjeta } from '../canal-tarjeta/canal-tarjeta';
import { FranjaManagerDialog } from '../franja-manager-dialog/franja-manager-dialog';

@Component({
  selector: 'app-carta-detail-estructura',
  imports: [
    FormsModule,
    DecimalPipe,
    Button,
    Select,
    InputText,
    Checkbox,
    ToggleSwitch,
    PrimeTemplate,
    RouterLink,
    ProductoSelectorDialog,
    AdicionalSelectorDialog,
    CanalTarjeta,
    FranjaManagerDialog,
  ],
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
  private readonly adicionalService = inject(AdicionalService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly carta = input.required<Carta>();
  readonly canales = this.cartaService.canales;
  readonly franjas = this.franjaHorariaService.franjas;
  readonly tiendas = this.cartaService.tiendas;
  /** Si la carta actual es una copia exclusiva de una tienda, el selector la muestra seleccionada
   *  — la carta compartida (sin dueño único) deja el selector en el placeholder "Tienda". */
  readonly tiendaActual = computed(() => this.carta().tiendaExclusivaId ?? null);

  /** Precio y estado por canal son dominio de Operaciones — brief v3 sección 3. */
  readonly puedeEditar = computed(() => puedeEditarOperacion(this.sesionService.rol()));

  readonly expandidos = signal<Set<string>>(new Set());
  readonly seleccionados = signal<Set<string>>(new Set());
  readonly canalBulkSeleccionado = signal(this.canales()[0]?.id ?? '');
  readonly seccionEnRenombre = signal<string | null>(null);
  readonly nombreEnEdicion = signal('');
  readonly seccionParaAgregarId = signal<string | null>(null);
  /** Qué producto tiene abierto el selector de adicionales (dialog), desde su fila expandida. */
  readonly productoParaAsociarAdicionalId = signal<string | null>(null);
  /** Keyed por grupoId (no por producto) — es la misma entidad en cualquier fila donde aparezca. */
  readonly adicionalesExpandidos = signal<Set<string>>(new Set());
  readonly mostrandoHorarios = signal(false);

  readonly secciones = computed(() => this.carta().secciones);

  readonly seccionActivaId = signal<string>('todas');
  /** Buscador de productos (decisión #17) — activo, ignora la sección elegida en el nav y busca en toda la carta. */
  readonly filtroProducto = signal('');
  private readonly terminoBusqueda = computed(() => this.filtroProducto().trim().toLowerCase());

  readonly seccionesVisibles = computed(() => {
    const termino = this.terminoBusqueda();
    if (termino) {
      return this.secciones().filter((s) => this.productosDe(s).some((p) => p.nombre.toLowerCase().includes(termino)));
    }
    const activa = this.seccionActivaId();
    return activa === 'todas' ? this.secciones() : this.secciones().filter((s) => s.id === activa);
  });

  readonly itemsNav = computed(() => {
    const cartaId = this.carta().id;
    const canales = this.canales();
    return this.secciones().map((seccion) => ({
      seccion,
      tieneError: seccion.items.some((item) =>
        canales.some((canal) => this.cartaService.estadoCanal(cartaId, canal.id, item.productoId)?.estado === 'error'),
      ),
    }));
  });

  readonly todosLosProductosIdsCarta = computed(() => this.secciones().flatMap((s) => s.items.map((i) => i.productoId)));
  readonly idsProductosEnCarta = computed(() => new Set(this.todosLosProductosIdsCarta()));

  /** Acotado a lo que está visible ahora (nav o búsqueda) — determina el scope de la selección masiva. */
  readonly todosLosProductosIds = computed(() => this.seccionesVisibles().flatMap((s) => this.productosDe(s).map((p) => p.id)));

  readonly todosSeleccionados = computed(() => {
    const ids = this.todosLosProductosIds();
    return ids.length > 0 && ids.every((id) => this.seleccionados().has(id));
  });

  productosDe(seccion: Seccion) {
    const productos = seccion.items.map((item) => this.productoService.obtenerPorId(item.productoId)).filter((p) => p !== undefined);
    const termino = this.terminoBusqueda();
    return termino ? productos.filter((p) => p.nombre.toLowerCase().includes(termino)) : productos;
  }

  seleccionarSeccion(id: string): void {
    this.filtroProducto.set('');
    this.seccionActivaId.set(id);
  }

  indiceDe(seccion: Seccion): number {
    return this.secciones().findIndex((s) => s.id === seccion.id);
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

  /** Muchos-a-muchos a nivel Marca — el producto lleva los mismos adicionales en cualquier carta donde aparezca. */
  gruposDeProducto(productoId: string) {
    return this.adicionalService.gruposDeProducto(productoId);
  }

  idsAdicionalesDe(productoId: string): Set<string> {
    return new Set(this.gruposDeProducto(productoId).map((g) => g.id));
  }

  abrirAsociarAdicional(productoId: string): void {
    if (!this.puedeEditar()) return;
    this.productoParaAsociarAdicionalId.set(productoId);
  }

  cerrarAsociarAdicional(): void {
    this.productoParaAsociarAdicionalId.set(null);
  }

  agregarAdicionales(productoId: string, grupoIds: string[]): void {
    if (!this.puedeEditar()) return;
    grupoIds.forEach((grupoId) => this.adicionalService.asociarProducto(grupoId, productoId));
    this.cerrarAsociarAdicional();
  }

  desasociarAdicional(productoId: string, grupoId: string): void {
    if (!this.puedeEditar()) return;
    this.adicionalService.desasociarProducto(grupoId, productoId);
  }

  estaAdicionalExpandido(grupoId: string): boolean {
    return this.adicionalesExpandidos().has(grupoId);
  }

  toggleAdicional(grupoId: string): void {
    this.adicionalesExpandidos.update((set) => {
      const copia = new Set(set);
      if (copia.has(grupoId)) copia.delete(grupoId);
      else copia.add(grupoId);
      return copia;
    });
  }

  toggleActivoAdicional(grupoId: string): void {
    if (!this.puedeEditar()) return;
    const grupo = this.adicionalService.obtenerPorId(grupoId);
    if (!grupo) return;
    this.adicionalService.actualizar(grupoId, { activo: !grupo.activo });
  }

  eliminarOpcionAdicional(grupoId: string, opcionId: string): void {
    if (!this.puedeEditar()) return;
    this.adicionalService.eliminarOpcion(grupoId, opcionId);
  }

  toggleDisponibleOpcion(grupoId: string, opcionId: string): void {
    if (!this.puedeEditar()) return;
    this.adicionalService.toggleDisponibleOpcion(grupoId, opcionId);
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
    const eraActiva = this.seccionActivaId() === seccion.id;
    const siguienteActiva = eraActiva ? this.calcularVecina(seccion.id) : this.seccionActivaId();
    this.cartaService.eliminarSeccion(this.carta().id, seccion.id);
    this.seccionActivaId.set(siguienteActiva);
  }

  /** Vecina anterior si existe; si se eliminó la primera, la que queda primera; si no queda ninguna, "todas". */
  private calcularVecina(seccionId: string): string {
    const secciones = this.secciones();
    const indice = secciones.findIndex((s) => s.id === seccionId);
    if (indice === -1) return 'todas';
    const vecina = secciones[indice - 1] ?? secciones[indice + 1];
    return vecina?.id ?? 'todas';
  }

  agregarSeccionNueva(): void {
    const id = this.cartaService.agregarSeccion(this.carta().id, 'Nueva sección');
    this.seccionActivaId.set(id);
    this.nombreEnEdicion.set('Nueva sección');
    this.seccionEnRenombre.set(id);
  }

  /** "Una carta puede ser asignada a todas las tiendas, o duplicarse para asignarla a otra tienda
   *  con cambios" (pedido explícito del usuario). Elegir una tienda ya servida por ESTA carta no
   *  hace nada (es el estado actual); elegir una servida por otra copia de la familia navega ahí;
   *  elegir una sin copia propia ofrece duplicar. */
  seleccionarTienda(tiendaId: string): void {
    const cartaActual = this.carta();
    const cartaQueSirve = this.cartaService.cartaQueSirveATienda(cartaActual.id, tiendaId);
    if (cartaQueSirve === cartaActual.id) return;
    if (cartaQueSirve) {
      this.router.navigate(['/cartas', cartaQueSirve]);
      return;
    }

    const tienda = this.tiendas().find((t) => t.id === tiendaId);
    if (!tienda) return;

    this.confirmationService.confirm({
      header: 'Duplicar carta para esta tienda',
      message: `"${cartaActual.nombre}" es compartida por todas las tiendas asignadas. ¿Creamos una copia exclusiva para ${tienda.nombre} que se pueda editar con cambios independientes, sin afectar al resto?`,
      icon: 'pi pi-copy',
      acceptLabel: 'Duplicar',
      rejectLabel: 'Cancelar',
      accept: () => {
        const nuevaId = this.cartaService.duplicarParaTienda(cartaActual.id, tiendaId);
        this.router.navigate(['/cartas', nuevaId]);
      },
    });
  }

  abrirHorarios(): void {
    this.mostrandoHorarios.set(true);
  }

  cerrarHorarios(): void {
    this.mostrandoHorarios.set(false);
  }

  /** Nunca busca el mismo producto dos veces — lleva al producto específico en Catálogo, con retorno a esta carta. Brief v3 sección 4. */
  editarEnCatalogo(productoId: string): void {
    this.router.navigate(['/productos'], { queryParams: { productoId, cartaId: this.carta().id } });
  }
}
