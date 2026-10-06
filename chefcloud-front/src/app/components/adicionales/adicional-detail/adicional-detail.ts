import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { Button } from 'primeng/button';
import { AdicionalService } from '../../../services/adicional.service';
import { EstadoCanalProducto, DiagnosticoError } from '../../../data/cartas.model';
import { EditableTextField } from '../../shared/editable-text-field/editable-text-field';
import { ProductoSelectorDialog } from '../../cartas/producto-selector-dialog/producto-selector-dialog';

@Component({
  selector: 'app-adicional-detail',
  imports: [FormsModule, DecimalPipe, InputText, InputNumber, Button, EditableTextField, ProductoSelectorDialog],
  templateUrl: './adicional-detail.html',
  styleUrl: './adicional-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdicionalDetail {
  private readonly adicionalService = inject(AdicionalService);

  readonly id = input.required<string>();
  readonly grupo = computed(() => this.adicionalService.obtenerPorId(this.id()));
  readonly canales = this.adicionalService.canales;
  /** "Elegir del catálogo" reusa ProductoSelectorDialog — acá no existe el concepto "ya en este grupo". */
  readonly conjuntoVacio = new Set<string>();

  readonly terminoOpcion = signal('');
  readonly expandidos = signal<Set<string>>(new Set());
  readonly modoAgregar = signal<'nuevo' | 'catalogo' | null>(null);

  readonly formOpcion = {
    sku: signal(''),
    nombre: signal(''),
    precioBase: signal(0),
    limiteMinimo: signal(0),
    limiteMaximo: signal(1),
  };

  readonly opcionesFiltradas = computed(() => {
    const termino = this.terminoOpcion().trim().toLowerCase();
    const opciones = this.grupo()?.opciones ?? [];
    return termino ? opciones.filter((o) => o.nombre.toLowerCase().includes(termino)) : opciones;
  });

  guardarNombre(valor: string): void {
    this.adicionalService.actualizar(this.id(), { nombre: valor });
  }

  guardarTitulo(valor: string): void {
    this.adicionalService.actualizar(this.id(), { titulo: valor });
  }

  guardarDescripcion(valor: string): void {
    this.adicionalService.actualizar(this.id(), { descripcion: valor });
  }

  actualizarLimiteMinimo(valor: number): void {
    this.adicionalService.actualizar(this.id(), { limiteMinimo: valor });
  }

  actualizarLimiteMaximo(valor: number): void {
    this.adicionalService.actualizar(this.id(), { limiteMaximo: valor });
  }

  toggleActivo(): void {
    const activo = this.grupo()?.activo ?? true;
    this.adicionalService.actualizar(this.id(), { activo: !activo });
  }

  estaExpandido(opcionId: string): boolean {
    return this.expandidos().has(opcionId);
  }

  toggleExpandir(opcionId: string): void {
    this.expandidos.update((set) => {
      const copia = new Set(set);
      if (copia.has(opcionId)) copia.delete(opcionId);
      else copia.add(opcionId);
      return copia;
    });
  }

  private expandir(opcionId: string): void {
    this.expandidos.update((set) => new Set(set).add(opcionId));
  }

  actualizarNombreOpcion(opcionId: string, valor: string): void {
    this.adicionalService.actualizarOpcion(this.id(), opcionId, { nombre: valor });
  }

  actualizarDescripcionOpcion(opcionId: string, valor: string): void {
    this.adicionalService.actualizarOpcion(this.id(), opcionId, { descripcion: valor });
  }

  actualizarLimiteMinimoOpcion(opcionId: string, valor: number): void {
    this.adicionalService.actualizarOpcion(this.id(), opcionId, { limiteMinimo: valor });
  }

  actualizarLimiteMaximoOpcion(opcionId: string, valor: number): void {
    this.adicionalService.actualizarOpcion(this.id(), opcionId, { limiteMaximo: valor });
  }

  eliminarOpcion(opcionId: string): void {
    this.adicionalService.eliminarOpcion(this.id(), opcionId);
  }

  estadoDe(opcionId: string, canalId: string): EstadoCanalProducto {
    return this.adicionalService.estadoCanalOpcion(this.id(), opcionId, canalId)?.estado ?? 'activo';
  }

  precioMostrado(opcionId: string, canalId: string): number {
    const opcion = this.grupo()?.opciones.find((o) => o.id === opcionId);
    const override = this.adicionalService.estadoCanalOpcion(this.id(), opcionId, canalId);
    return override?.precio ?? opcion?.precioBase ?? 0;
  }

  tieneOverridePrecio(opcionId: string, canalId: string): boolean {
    return this.adicionalService.estadoCanalOpcion(this.id(), opcionId, canalId)?.precio !== undefined;
  }

  diagnosticoDe(opcionId: string, canalId: string): DiagnosticoError | undefined {
    return this.adicionalService.estadoCanalOpcion(this.id(), opcionId, canalId)?.diagnostico;
  }

  clickPastilla(opcionId: string, canalId: string): void {
    const estado = this.estadoDe(opcionId, canalId);
    if (estado === 'error') {
      this.expandir(opcionId);
      return;
    }
    const nuevo = estado === 'activo' ? 'pausado' : 'activo';
    this.adicionalService.setEstadoOperativoOpcion(this.id(), opcionId, canalId, nuevo);
  }

  actualizarPrecio(opcionId: string, canalId: string, valor: number): void {
    const opcion = this.grupo()?.opciones.find((o) => o.id === opcionId);
    const nuevoPrecio = opcion && valor === opcion.precioBase ? undefined : valor;
    this.adicionalService.setPrecioCanalOpcion(this.id(), opcionId, canalId, nuevoPrecio);
  }

  usarPrecioBase(opcionId: string, canalId: string): void {
    this.adicionalService.setPrecioCanalOpcion(this.id(), opcionId, canalId, undefined);
  }

  reintentar(opcionId: string, canalId: string): void {
    this.adicionalService.reintentarCanalOpcion(this.id(), opcionId, canalId);
  }

  /** Demo/dev only — no hay backend real que falle solo; existe para poder probar diagnóstico + reintento. */
  simularError(opcionId: string, canalId: string): void {
    this.adicionalService.simularErrorCanalOpcion(this.id(), opcionId, canalId, 'Actualizar precio', 'El canal devolvió error 500 (simulado)');
    this.expandir(opcionId);
  }

  abrirCrearOpcion(): void {
    this.formOpcion.sku.set('');
    this.formOpcion.nombre.set('');
    this.formOpcion.precioBase.set(0);
    this.formOpcion.limiteMinimo.set(0);
    this.formOpcion.limiteMaximo.set(1);
    this.modoAgregar.set('nuevo');
  }

  abrirElegirDelCatalogo(): void {
    this.modoAgregar.set('catalogo');
  }

  cancelarAgregar(): void {
    this.modoAgregar.set(null);
  }

  confirmarOpcionNueva(): void {
    const sku = this.formOpcion.sku().trim();
    const nombre = this.formOpcion.nombre().trim();
    if (!sku || !nombre) return;
    this.adicionalService.agregarOpcionNueva(this.id(), {
      sku,
      nombre,
      precioBase: this.formOpcion.precioBase(),
      limiteMinimo: this.formOpcion.limiteMinimo(),
      limiteMaximo: this.formOpcion.limiteMaximo(),
    });
    this.modoAgregar.set(null);
  }

  opcionesDelCatalogoElegidas(productoIds: string[]): void {
    this.adicionalService.agregarOpcionesDelCatalogo(this.id(), productoIds);
    this.modoAgregar.set(null);
  }
}
