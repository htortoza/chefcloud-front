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

const TODAS_LAS_CATEGORIAS = 'todas';

@Component({
  selector: 'app-producto-selector-dialog',
  imports: [CurrencyPipe, FormsModule, Dialog, TableModule, InputText, Select, Button, Tag, PrimeTemplate],
  templateUrl: './producto-selector-dialog.html',
  styleUrl: './producto-selector-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoSelectorDialog {
  private readonly productoService = inject(ProductoService);

  readonly productosYaEnCarta = input.required<Set<string>>();
  readonly agregar = output<string[]>();
  readonly cerrar = output<void>();

  readonly visible = signal(true);
  readonly textoBusqueda = signal('');
  readonly categoriaSeleccionada = signal(TODAS_LAS_CATEGORIAS);
  readonly seleccionados = signal<Producto[]>([]);

  readonly categorias = this.productoService.categorias;
  readonly opcionesCategoria = computed(() => [{ id: TODAS_LAS_CATEGORIAS, nombre: 'Todas las categorías' }, ...this.categorias()]);

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

  confirmarSeleccion(): void {
    this.agregar.emit(this.seleccionados().map((p) => p.id));
    this.seleccionados.set([]);
  }

  cerrarDialog(): void {
    this.visible.set(false);
    this.cerrar.emit();
  }
}
