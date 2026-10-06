import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { PrimeTemplate } from 'primeng/api';
import { ProductoService } from '../../../services/producto.service';
import { Producto } from '../../../data/catalogo.model';
import { ProductoDetailDrawer } from '../../productos/producto-detail-drawer/producto-detail-drawer';

const TODAS_LAS_CATEGORIAS = 'todas';

@Component({
  selector: 'app-producto-selector-dialog',
  imports: [CurrencyPipe, FormsModule, Dialog, TableModule, InputText, Select, Button, Tag, PrimeTemplate, ProductoDetailDrawer],
  templateUrl: './producto-selector-dialog.html',
  styleUrl: './producto-selector-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoSelectorDialog {
  private readonly productoService = inject(ProductoService);

  readonly productosYaEnCarta = input.required<Set<string>>();
  /** Reusado también desde Adicionales ("Elegir del catálogo") — el título cambia según de dónde se abre. */
  readonly titulo = input('Agregar productos a la sección');
  readonly agregar = output<string[]>();
  readonly cerrar = output<void>();

  readonly visible = signal(true);
  readonly textoBusqueda = signal('');
  readonly categoriaSeleccionada = signal(TODAS_LAS_CATEGORIAS);
  readonly seleccionados = signal<Producto[]>([]);
  /** Creación rápida sin salir del selector — ver decisión "quick-create desde Estructura". */
  readonly crearAbierto = signal(false);

  readonly categorias = this.productoService.categorias;
  readonly opcionesCategoria = computed(() => [{ id: TODAS_LAS_CATEGORIAS, nombre: 'Todas las categorías' }, ...this.categorias()]);
  readonly catalogoVacio = computed(() => this.productoService.productos().length === 0);

  readonly productosFiltrados = computed(() => {
    const busqueda = this.textoBusqueda().trim().toLowerCase();
    const categoriaId = this.categoriaSeleccionada();
    return this.productoService.productos().filter((p) => {
      if (categoriaId !== TODAS_LAS_CATEGORIAS && p.categoriaId !== categoriaId) return false;
      if (!busqueda) return true;
      return p.nombre.toLowerCase().includes(busqueda) || p.sku.toLowerCase().includes(busqueda);
    });
  });

  nombreCategoria(categoriaId: string): string {
    return this.categorias().find((f) => f.id === categoriaId)?.nombre ?? '—';
  }

  estaYaEnCarta(producto: Producto): boolean {
    return this.productosYaEnCarta().has(producto.id);
  }

  /** Excluye del "seleccionar todos" del header los productos ya en la carta — su checkbox de fila está deshabilitado. */
  readonly filaSeleccionable = (fila: { data: Producto }): boolean => !this.estaYaEnCarta(fila.data);

  confirmarSeleccion(): void {
    this.agregar.emit(this.seleccionados().map((p) => p.id));
    this.seleccionados.set([]);
  }

  cerrarDialog(): void {
    this.visible.set(false);
    this.cerrar.emit();
  }

  abrirCrearProducto(): void {
    this.crearAbierto.set(true);
  }

  cerrarCrearProducto(): void {
    this.crearAbierto.set(false);
  }

  /** El producto recién creado se agrega directo (junto con lo ya tildado) — no hace falta volver a buscarlo en la tabla. */
  productoCreado(id: string): void {
    this.crearAbierto.set(false);
    this.agregar.emit([...this.seleccionados().map((p) => p.id), id]);
    this.seleccionados.set([]);
  }
}
