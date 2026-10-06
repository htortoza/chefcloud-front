import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Button } from 'primeng/button';
import { CartaService } from '../../../services/carta.service';
import { SesionService } from '../../../services/sesion.service';
import { Canal, DiagnosticoError, EstadoCanalProducto } from '../../../data/cartas.model';
import { Producto } from '../../../data/catalogo.model';
import { puedeEditarOperacion } from '../../../data/roles.model';
import { EditableTextField } from '../../shared/editable-text-field/editable-text-field';

/**
 * Tarjeta de un canal dentro de la fila expandida de un producto en Estructura — precio, título y
 * descripción con override por canal, editables inline. Extraído de `CartaDetailEstructura` en
 * sesión (ver CLAUDE.md, sección de presupuesto de `anyComponentStyle`) para que este CSS tenga su
 * propio presupuesto en vez de seguir empujando el de la pantalla completa.
 */
@Component({
  selector: 'app-canal-tarjeta',
  imports: [Button, DecimalPipe, EditableTextField],
  templateUrl: './canal-tarjeta.html',
  styleUrl: './canal-tarjeta.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanalTarjeta {
  private readonly cartaService = inject(CartaService);
  private readonly sesionService = inject(SesionService);

  readonly producto = input.required<Producto>();
  readonly canal = input.required<Canal>();
  readonly cartaId = input.required<string>();

  /** Precio/título/descripción por canal son dominio de Operaciones — mismo gate que el resto de Estructura. */
  readonly puedeEditar = computed(() => puedeEditarOperacion(this.sesionService.rol()));

  private estadoCanal() {
    return this.cartaService.estadoCanal(this.cartaId(), this.canal().id, this.producto().id);
  }

  estadoDe(): EstadoCanalProducto {
    return this.estadoCanal()?.estado ?? 'activo';
  }

  diagnosticoDe(): DiagnosticoError | undefined {
    return this.estadoCanal()?.diagnostico;
  }

  precioMostrado(): number {
    return this.estadoCanal()?.precio ?? this.producto().precioVenta;
  }

  tieneOverridePrecio(): boolean {
    return this.estadoCanal()?.precio !== undefined;
  }

  actualizarPrecio(valor: number): void {
    if (!this.puedeEditar()) return;
    const nuevoPrecio = valor === this.producto().precioVenta ? undefined : valor;
    this.cartaService.setPrecioCanal(this.cartaId(), this.canal().id, this.producto().id, nuevoPrecio);
  }

  usarPrecioBase(): void {
    if (!this.puedeEditar()) return;
    this.cartaService.setPrecioCanal(this.cartaId(), this.canal().id, this.producto().id, undefined);
  }

  tituloMostrado(): string {
    return this.estadoCanal()?.nombre ?? this.producto().nombre;
  }

  tieneOverrideTitulo(): boolean {
    return this.estadoCanal()?.nombre !== undefined;
  }

  actualizarTituloCanal(valor: string): void {
    if (!this.puedeEditar()) return;
    const limpio = valor.trim();
    const nuevo = limpio === '' || limpio === this.producto().nombre ? undefined : limpio;
    this.cartaService.setNombreCanal(this.cartaId(), this.canal().id, this.producto().id, nuevo);
  }

  usarTituloBaseCanal(): void {
    if (!this.puedeEditar()) return;
    this.cartaService.setNombreCanal(this.cartaId(), this.canal().id, this.producto().id, undefined);
  }

  descripcionMostrada(): string {
    return this.estadoCanal()?.descripcion ?? this.producto().descripcion;
  }

  tieneOverrideDescripcion(): boolean {
    return this.estadoCanal()?.descripcion !== undefined;
  }

  actualizarDescripcionCanal(valor: string): void {
    if (!this.puedeEditar()) return;
    const limpio = valor.trim();
    const nuevo = limpio === '' || limpio === this.producto().descripcion ? undefined : limpio;
    this.cartaService.setDescripcionCanal(this.cartaId(), this.canal().id, this.producto().id, nuevo);
  }

  usarDescripcionBaseCanal(): void {
    if (!this.puedeEditar()) return;
    this.cartaService.setDescripcionCanal(this.cartaId(), this.canal().id, this.producto().id, undefined);
  }

  reintentar(): void {
    if (!this.puedeEditar()) return;
    this.cartaService.reintentar(this.cartaId(), this.canal().id, this.producto().id);
  }
}
