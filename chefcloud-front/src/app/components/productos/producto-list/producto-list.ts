import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Button } from 'primeng/button';
import { PrimeTemplate } from 'primeng/api';
import { PageHeader } from '../../shared/page-header/page-header';
import { ProductoDetailDrawer } from '../producto-detail-drawer/producto-detail-drawer';
import { ProductoService } from '../../../services/producto.service';
import { CartaService } from '../../../services/carta.service';
import { Producto } from '../../../data/catalogo.model';

interface FilaProducto extends Producto {
  categoriaNombre: string;
  cartasQueLoUsan: number;
}

@Component({
  selector: 'app-producto-list',
  imports: [CurrencyPipe, TableModule, Tag, Button, PrimeTemplate, PageHeader, ProductoDetailDrawer],
  templateUrl: './producto-list.html',
  styleUrl: './producto-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoList {
  private readonly productoService = inject(ProductoService);
  private readonly cartaService = inject(CartaService);

  /** Llegan como query params desde "Editar en catálogo" (Estructura de una Carta) — ver brief v3 sección 4. */
  readonly productoId = input<string | null>(null);
  readonly cartaId = input<string | null>(null);

  readonly filaSeleccionada = signal<string | null>(null);
  readonly productoEnEdicion = signal<Producto | null | undefined>(undefined); // undefined = drawer cerrado
  readonly cartaIdEnEdicion = signal<string | null>(null);

  constructor() {
    effect(() => {
      const id = this.productoId();
      if (!id) return;
      const producto = this.productoService.obtenerPorId(id);
      if (!producto) return;
      this.cartaIdEnEdicion.set(this.cartaId());
      this.productoEnEdicion.set(producto);
    });
  }

  abrirCreacion(): void {
    this.cartaIdEnEdicion.set(null);
    this.productoEnEdicion.set(null);
  }

  abrirEdicion(producto: Producto): void {
    this.cartaIdEnEdicion.set(null);
    this.productoEnEdicion.set(producto);
  }

  cerrarDrawer(): void {
    this.productoEnEdicion.set(undefined);
    this.cartaIdEnEdicion.set(null);
  }

  readonly filas = computed<FilaProducto[]>(() => {
    const categorias = this.productoService.categorias();
    return this.productoService.todos().map((producto) => ({
      ...producto,
      categoriaNombre: categorias.find((f) => f.id === producto.categoriaId)?.nombre ?? '—',
      cartasQueLoUsan: this.cartaService.cartasQueUsanProducto(producto.id),
    }));
  });

  toggleActivo(producto: Producto): void {
    if (producto.activo) {
      this.productoService.archivar(producto.id);
    } else {
      this.productoService.activar(producto.id);
    }
  }
}
