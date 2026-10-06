import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ProductoService } from './producto.service';

describe('ProductoService', () => {
  let productoService: ProductoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    productoService = TestBed.inject(ProductoService);
  });

  it('arranca con productos mock activos', () => {
    expect(productoService.productos().length).toBeGreaterThan(0);
    expect(productoService.productos().every((p) => p.activo)).toBe(true);
  });

  it('crear agrega un producto nuevo activo y devuelve su id', () => {
    const antes = productoService.productos().length;
    const id = productoService.crear({
      nombre: 'Ceviche mixto',
      descripcion: 'Pescado y mariscos en leche de tigre',
      precioVenta: 9500,
      precioCosto: 4000,
      sku: 'CEV-001',
      categoriaId: productoService.categorias()[0].id,
      etiquetas: [],
    });
    expect(productoService.productos().length).toBe(antes + 1);
    expect(productoService.obtenerPorId(id)?.nombre).toBe('Ceviche mixto');
  });

  it('archivar pone activo en false sin borrar el producto', () => {
    const [primero] = productoService.productos();
    productoService.archivar(primero.id);
    expect(productoService.obtenerPorId(primero.id)?.activo).toBe(false);
    expect(productoService.productos().some((p) => p.id === primero.id)).toBe(false);
  });
});
