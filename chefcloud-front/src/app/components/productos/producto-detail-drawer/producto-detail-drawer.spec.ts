import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ProductoDetailDrawer } from './producto-detail-drawer';
import { ProductoService } from '../../../services/producto.service';
import { CartaService } from '../../../services/carta.service';
import { SesionService } from '../../../services/sesion.service';

describe('ProductoDetailDrawer', () => {
  let fixture: ComponentFixture<ProductoDetailDrawer>;
  let productoService: ProductoService;
  let cartaService: CartaService;
  let sesionService: SesionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductoDetailDrawer],
      providers: [provideRouter([{ path: 'cartas/:id', children: [] }])],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductoDetailDrawer);
    productoService = TestBed.inject(ProductoService);
    cartaService = TestBed.inject(CartaService);
    sesionService = TestBed.inject(SesionService);
  });

  it('en modo creación, guardar agrega un producto nuevo', () => {
    fixture.componentRef.setInput('producto', null);
    fixture.detectChanges();
    const antes = productoService.todos().length;

    const instancia = fixture.componentInstance;
    instancia.form.nombre.set('Papas fritas');
    instancia.form.descripcion.set('Porción individual');
    instancia.form.precioVenta.set(3000);
    instancia.form.precioCosto.set(900);
    instancia.form.sku.set('PAP-001');
    instancia.form.categoriaId.set(productoService.categorias()[0].id);
    instancia.guardar();

    expect(productoService.todos().length).toBe(antes + 1);
  });

  it('en modo edición, guardar actualiza el producto existente', () => {
    const existente = productoService.todos()[0];
    fixture.componentRef.setInput('producto', existente);
    fixture.detectChanges();

    fixture.componentInstance.form.nombre.set('Nombre editado');
    fixture.componentInstance.guardar();

    expect(productoService.obtenerPorId(existente.id)?.nombre).toBe('Nombre editado');
  });

  it('agregar un grupo de modificadores lo persiste al guardar', () => {
    fixture.componentRef.setInput('producto', null);
    fixture.detectChanges();
    const instancia = fixture.componentInstance;
    instancia.form.nombre.set('Papas fritas');
    instancia.form.descripcion.set('Porción individual');
    instancia.form.precioVenta.set(3000);
    instancia.form.precioCosto.set(900);
    instancia.form.sku.set('PAP-001');
    instancia.form.categoriaId.set(productoService.categorias()[0].id);
    instancia.agregarGrupoModificador();
    instancia.grupos()[0].nombre.set('Salsas');
    instancia.grupos()[0].maximo.set(2);
    instancia.guardar();

    const creado = productoService.todos().at(-1)!;
    expect(creado.gruposModificadores[0].nombre).toBe('Salsas');
    expect(creado.gruposModificadores[0].maximo).toBe(2);
  });

  it('rol marketing puede setear override de nombre/descripción por canal, independiente entre sí', () => {
    const producto = productoService.todos()[0];
    const cartaId = cartaService.crear('Carta de prueba');
    const [canal] = cartaService.canales();
    sesionService.entrarComo('marketing', 'Marketing Demo');
    fixture.componentRef.setInput('producto', producto);
    fixture.componentRef.setInput('cartaId', cartaId);
    fixture.detectChanges();

    fixture.componentInstance.actualizarNombreCanal(canal.id, 'Nombre corto para Uber');

    expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.nombre).toBe('Nombre corto para Uber');
    expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.descripcion).toBeUndefined();
  });

  it('rol operaciones no puede editar nombre/descripción por canal — el permiso bloquea el campo', () => {
    const producto = productoService.todos()[0];
    const cartaId = cartaService.crear('Carta de prueba');
    const [canal] = cartaService.canales();
    sesionService.entrarComo('operaciones', 'Operaciones Demo');
    fixture.componentRef.setInput('producto', producto);
    fixture.componentRef.setInput('cartaId', cartaId);
    fixture.detectChanges();

    fixture.componentInstance.actualizarNombreCanal(canal.id, 'Intento de Operaciones');

    expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.nombre).toBeUndefined();
  });

  it('escribir el mismo valor que el nombre base limpia el override (vuelve a heredar)', () => {
    const producto = productoService.todos()[0];
    const cartaId = cartaService.crear('Carta de prueba');
    const [canal] = cartaService.canales();
    sesionService.entrarComo('marketing', 'Marketing Demo');
    fixture.componentRef.setInput('producto', producto);
    fixture.componentRef.setInput('cartaId', cartaId);
    fixture.detectChanges();

    fixture.componentInstance.actualizarNombreCanal(canal.id, 'Nombre distinto');
    expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.nombre).toBe('Nombre distinto');

    fixture.componentInstance.actualizarNombreCanal(canal.id, producto.nombre);
    expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.nombre).toBeUndefined();
  });

  it('rol marketing puede editar nombre y descripción base de un producto existente', () => {
    const producto = productoService.todos()[0];
    sesionService.entrarComo('marketing', 'Marketing Demo');
    fixture.componentRef.setInput('producto', producto);
    fixture.detectChanges();

    fixture.componentInstance.actualizarNombreBase('Nombre nuevo');
    fixture.componentInstance.actualizarDescripcionBase('Descripción nueva');

    expect(fixture.componentInstance.form.nombre()).toBe('Nombre nuevo');
    expect(fixture.componentInstance.form.descripcion()).toBe('Descripción nueva');
  });

  it('rol operaciones no puede editar nombre/descripción base — el permiso bloquea el campo', () => {
    const producto = productoService.todos()[0];
    sesionService.entrarComo('operaciones', 'Operaciones Demo');
    fixture.componentRef.setInput('producto', producto);
    fixture.detectChanges();

    fixture.componentInstance.actualizarNombreBase('Intento de Operaciones');

    expect(fixture.componentInstance.form.nombre()).toBe(producto.nombre);
  });

  it('rol operaciones puede editar el precio de venta base de un producto existente', () => {
    const producto = productoService.todos()[0];
    sesionService.entrarComo('operaciones', 'Operaciones Demo');
    fixture.componentRef.setInput('producto', producto);
    fixture.detectChanges();

    fixture.componentInstance.actualizarPrecioVentaBase(12345);

    expect(fixture.componentInstance.form.precioVenta()).toBe(12345);
  });

  it('rol marketing no puede editar el precio de venta base — el permiso bloquea el campo', () => {
    const producto = productoService.todos()[0];
    sesionService.entrarComo('marketing', 'Marketing Demo');
    fixture.componentRef.setInput('producto', producto);
    fixture.detectChanges();

    fixture.componentInstance.actualizarPrecioVentaBase(12345);

    expect(fixture.componentInstance.form.precioVenta()).toBe(producto.precioVenta);
  });

  it('creando un producto nuevo, cualquier rol puede editar nombre y precio base (fuera del alcance de este permiso)', () => {
    sesionService.entrarComo('marketing', 'Marketing Demo');
    fixture.componentRef.setInput('producto', null);
    fixture.detectChanges();

    fixture.componentInstance.actualizarNombreBase('Producto nuevo');
    fixture.componentInstance.actualizarPrecioVentaBase(5000);

    expect(fixture.componentInstance.form.nombre()).toBe('Producto nuevo');
    expect(fixture.componentInstance.form.precioVenta()).toBe(5000);
  });

  it('volverALaCarta navega a /cartas/:id', () => {
    const cartaId = cartaService.crear('Carta de prueba');
    fixture.componentRef.setInput('producto', productoService.todos()[0]);
    fixture.componentRef.setInput('cartaId', cartaId);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    fixture.componentInstance.volverALaCarta();

    expect(navigateSpy).toHaveBeenCalledWith(['/cartas', cartaId]);
  });
});
