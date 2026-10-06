import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ProductoDetailDrawer } from './producto-detail-drawer';
import { ProductoService } from '../../../services/producto.service';
import { CartaService } from '../../../services/carta.service';
import { AdicionalService } from '../../../services/adicional.service';
import { SesionService } from '../../../services/sesion.service';

describe('ProductoDetailDrawer', () => {
  let fixture: ComponentFixture<ProductoDetailDrawer>;
  let productoService: ProductoService;
  let cartaService: CartaService;
  let adicionalService: AdicionalService;
  let sesionService: SesionService;
  let confirmationService: ConfirmationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductoDetailDrawer],
      providers: [provideRouter([{ path: 'cartas/:id', children: [] }]), ConfirmationService],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductoDetailDrawer);
    productoService = TestBed.inject(ProductoService);
    cartaService = TestBed.inject(CartaService);
    adicionalService = TestBed.inject(AdicionalService);
    sesionService = TestBed.inject(SesionService);
    confirmationService = TestBed.inject(ConfirmationService);
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

  it('en modo creación, guardar emite "creado" con el id del producto nuevo', () => {
    fixture.componentRef.setInput('producto', null);
    fixture.detectChanges();
    const instancia = fixture.componentInstance;
    instancia.form.nombre.set('Papas fritas');
    instancia.form.descripcion.set('Porción individual');
    instancia.form.precioVenta.set(3000);
    instancia.form.precioCosto.set(900);
    instancia.form.sku.set('PAP-001');
    instancia.form.categoriaId.set(productoService.categorias()[0].id);
    const emitido = vi.fn();
    instancia.creado.subscribe(emitido);

    instancia.guardar();

    const creado = productoService.todos().at(-1)!;
    expect(emitido).toHaveBeenCalledWith(creado.id);
  });

  it('en modo edición, guardar no emite "creado"', () => {
    const existente = productoService.todos()[0];
    fixture.componentRef.setInput('producto', existente);
    fixture.detectChanges();
    const emitido = vi.fn();
    fixture.componentInstance.creado.subscribe(emitido);

    fixture.componentInstance.guardar();

    expect(emitido).not.toHaveBeenCalled();
  });

  it('en modo edición, guardar actualiza el producto existente', () => {
    const existente = productoService.todos()[0];
    fixture.componentRef.setInput('producto', existente);
    fixture.detectChanges();

    fixture.componentInstance.form.nombre.set('Nombre editado');
    fixture.componentInstance.guardar();

    expect(productoService.obtenerPorId(existente.id)?.nombre).toBe('Nombre editado');
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

  describe('Adicionales asociados al producto', () => {
    it('abrirSelectorAdicionales/cerrarSelectorAdicionales alternan mostrandoSelectorAdicionales', () => {
      sesionService.entrarComo('operaciones', 'Operaciones Demo');
      fixture.componentRef.setInput('producto', productoService.todos()[0]);
      fixture.detectChanges();

      expect(fixture.componentInstance.mostrandoSelectorAdicionales()).toBe(false);
      fixture.componentInstance.abrirSelectorAdicionales();
      expect(fixture.componentInstance.mostrandoSelectorAdicionales()).toBe(true);
      fixture.componentInstance.cerrarSelectorAdicionales();
      expect(fixture.componentInstance.mostrandoSelectorAdicionales()).toBe(false);
    });

    it('rol marketing no puede abrir el selector de adicionales — el permiso bloquea la acción', () => {
      sesionService.entrarComo('marketing', 'Marketing Demo');
      fixture.componentRef.setInput('producto', productoService.todos()[0]);
      fixture.detectChanges();

      fixture.componentInstance.abrirSelectorAdicionales();

      expect(fixture.componentInstance.mostrandoSelectorAdicionales()).toBe(false);
    });

    it('agregarAdicionales asocia los grupos elegidos y cierra el selector', () => {
      const producto = productoService.todos()[0];
      const [grupoA, grupoB] = adicionalService.grupos();
      fixture.componentRef.setInput('producto', producto);
      fixture.detectChanges();
      fixture.componentInstance.abrirSelectorAdicionales();

      fixture.componentInstance.agregarAdicionales([grupoA.id, grupoB.id]);

      expect(fixture.componentInstance.gruposAsociados().map((g) => g.id)).toEqual([grupoA.id, grupoB.id]);
      expect(fixture.componentInstance.mostrandoSelectorAdicionales()).toBe(false);
    });

    it('quitarAdicional desasocia el grupo', () => {
      const producto = productoService.todos()[0];
      const [grupo] = adicionalService.grupos();
      adicionalService.asociarProducto(grupo.id, producto.id);
      sesionService.entrarComo('operaciones', 'Operaciones Demo');
      fixture.componentRef.setInput('producto', producto);
      fixture.detectChanges();

      fixture.componentInstance.quitarAdicional(grupo.id);

      expect(fixture.componentInstance.gruposAsociados().map((g) => g.id)).not.toContain(grupo.id);
    });

    it('rol marketing no puede quitar un adicional — el permiso bloquea la acción', () => {
      const producto = productoService.todos()[0];
      const [grupo] = adicionalService.grupos();
      adicionalService.asociarProducto(grupo.id, producto.id);
      sesionService.entrarComo('marketing', 'Marketing Demo');
      fixture.componentRef.setInput('producto', producto);
      fixture.detectChanges();

      fixture.componentInstance.quitarAdicional(grupo.id);

      expect(fixture.componentInstance.gruposAsociados().map((g) => g.id)).toContain(grupo.id);
    });
  });

  describe('Precio por canal', () => {
    it('rol operaciones puede editar el precio por canal, y "usar precio base" lo limpia', () => {
      const producto = productoService.todos()[0];
      const cartaId = cartaService.crear('Carta de prueba');
      const [canal] = cartaService.canales();
      sesionService.entrarComo('operaciones', 'Operaciones Demo');
      fixture.componentRef.setInput('producto', producto);
      fixture.componentRef.setInput('cartaId', cartaId);
      fixture.detectChanges();

      fixture.componentInstance.actualizarPrecioCanal(canal.id, 9999);
      expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.precio).toBe(9999);

      fixture.componentInstance.usarPrecioBaseCanal(canal.id);
      expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.precio).toBeUndefined();
    });

    it('rol marketing no puede editar el precio por canal — el permiso bloquea el campo', () => {
      const producto = productoService.todos()[0];
      const cartaId = cartaService.crear('Carta de prueba');
      const [canal] = cartaService.canales();
      sesionService.entrarComo('marketing', 'Marketing Demo');
      fixture.componentRef.setInput('producto', producto);
      fixture.componentRef.setInput('cartaId', cartaId);
      fixture.detectChanges();

      fixture.componentInstance.actualizarPrecioCanal(canal.id, 9999);

      expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.precio).toBeUndefined();
    });
  });

  describe('Guardar con overrides por canal existentes', () => {
    it('sin overrides, guardar no pregunta nada', () => {
      const producto = productoService.todos()[0];
      fixture.componentRef.setInput('producto', producto);
      fixture.detectChanges();
      const confirmSpy = vi.spyOn(confirmationService, 'confirm');

      fixture.componentInstance.form.nombre.set('Nombre nuevo');
      fixture.componentInstance.guardar();

      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it('cambiar el nombre base con overrides de nombre en otros canales pregunta si actualizarlos también', () => {
      const producto = productoService.todos()[0];
      const cartaId = cartaService.crear('Carta de prueba');
      const [canal] = cartaService.canales();
      cartaService.setNombreCanal(cartaId, canal.id, producto.id, 'Nombre distinto en Uber');
      fixture.componentRef.setInput('producto', producto);
      fixture.detectChanges();
      const confirmSpy = vi.spyOn(confirmationService, 'confirm');

      fixture.componentInstance.form.nombre.set('Nombre base nuevo');
      fixture.componentInstance.guardar();

      expect(confirmSpy).toHaveBeenCalledOnce();
    });

    it('aceptar la confirmación resetea el override para que herede el nuevo nombre base', () => {
      const producto = productoService.todos()[0];
      const cartaId = cartaService.crear('Carta de prueba');
      const [canal] = cartaService.canales();
      cartaService.setNombreCanal(cartaId, canal.id, producto.id, 'Nombre distinto en Uber');
      fixture.componentRef.setInput('producto', producto);
      fixture.detectChanges();
      vi.spyOn(confirmationService, 'confirm').mockImplementation((opts) => {
        opts.accept?.();
        return confirmationService;
      });

      fixture.componentInstance.form.nombre.set('Nombre base nuevo');
      fixture.componentInstance.guardar();

      expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.nombre).toBeUndefined();
    });

    it('rechazar la confirmación deja el override como estaba', () => {
      const producto = productoService.todos()[0];
      const cartaId = cartaService.crear('Carta de prueba');
      const [canal] = cartaService.canales();
      cartaService.setNombreCanal(cartaId, canal.id, producto.id, 'Nombre distinto en Uber');
      fixture.componentRef.setInput('producto', producto);
      fixture.detectChanges();
      vi.spyOn(confirmationService, 'confirm').mockImplementation((opts) => {
        opts.reject?.();
        return confirmationService;
      });

      fixture.componentInstance.form.nombre.set('Nombre base nuevo');
      fixture.componentInstance.guardar();

      expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.nombre).toBe('Nombre distinto en Uber');
    });

    it('un override de un campo que no cambió no dispara la confirmación', () => {
      const producto = productoService.todos()[0];
      const cartaId = cartaService.crear('Carta de prueba');
      const [canal] = cartaService.canales();
      cartaService.setPrecioCanal(cartaId, canal.id, producto.id, 12345);
      fixture.componentRef.setInput('producto', producto);
      fixture.detectChanges();
      const confirmSpy = vi.spyOn(confirmationService, 'confirm');

      fixture.componentInstance.form.nombre.set('Solo cambia el nombre');
      fixture.componentInstance.guardar();

      expect(confirmSpy).not.toHaveBeenCalled();
    });
  });
});
