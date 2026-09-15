import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductoSelectorDialog } from './producto-selector-dialog';
import { ProductoService } from '../../../services/producto.service';

describe('ProductoSelectorDialog', () => {
  let fixture: ComponentFixture<ProductoSelectorDialog>;
  let productoService: ProductoService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProductoSelectorDialog] }).compileComponents();
    productoService = TestBed.inject(ProductoService);
    fixture = TestBed.createComponent(ProductoSelectorDialog);
    fixture.componentRef.setInput('productosYaEnCarta', new Set<string>());
    fixture.detectChanges();
  });

  it('lista todos los productos activos por defecto', () => {
    expect(fixture.componentInstance.productosFiltrados().length).toBe(productoService.productos().length);
  });

  it('nunca lista productos archivados', () => {
    const [primero] = productoService.productos();
    productoService.archivar(primero.id);
    fixture.detectChanges();

    expect(fixture.componentInstance.productosFiltrados().some((p) => p.id === primero.id)).toBe(false);
  });

  it('el filtro de texto busca por nombre o SKU', () => {
    fixture.componentInstance.textoBusqueda.set('lomo');
    expect(fixture.componentInstance.productosFiltrados().every((p) => p.nombre.toLowerCase().includes('lomo'))).toBe(true);
    expect(fixture.componentInstance.productosFiltrados().length).toBeGreaterThan(0);

    fixture.componentInstance.textoBusqueda.set('LOM-001');
    expect(fixture.componentInstance.productosFiltrados().some((p) => p.sku === 'LOM-001')).toBe(true);
  });

  it('el filtro de categoria acota a esa categoria', () => {
    const categoriaBebidas = productoService.categorias().find((f) => f.nombre === 'Bebidas')!;
    fixture.componentInstance.categoriaSeleccionada.set(categoriaBebidas.id);

    expect(fixture.componentInstance.productosFiltrados().every((p) => p.categoriaId === categoriaBebidas.id)).toBe(true);
    expect(fixture.componentInstance.productosFiltrados().length).toBeGreaterThan(0);
  });

  it('confirmarSeleccion emite los ids seleccionados y los limpia', () => {
    const [productoA, productoB] = productoService.productos();
    let emitido: string[] | undefined;
    fixture.componentInstance.agregar.subscribe((ids: string[]) => (emitido = ids));

    fixture.componentInstance.seleccionados.set([productoA, productoB]);
    fixture.componentInstance.confirmarSeleccion();

    expect(emitido).toEqual([productoA.id, productoB.id]);
    expect(fixture.componentInstance.seleccionados()).toEqual([]);
  });

  it('estaYaEnCarta refleja el input productosYaEnCarta', () => {
    const [producto] = productoService.productos();
    fixture.componentRef.setInput('productosYaEnCarta', new Set([producto.id]));
    fixture.detectChanges();

    expect(fixture.componentInstance.estaYaEnCarta(producto)).toBe(true);
  });
});
