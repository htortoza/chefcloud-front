import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CartaDetailEstructura } from './carta-detail-estructura';
import { CartaService } from '../../../services/carta.service';
import { ProductoService } from '../../../services/producto.service';
import { SesionService } from '../../../services/sesion.service';

describe('CartaDetailEstructura', () => {
  let fixture: ComponentFixture<CartaDetailEstructura>;
  let cartaService: CartaService;
  let productoService: ProductoService;
  let sesionService: SesionService;
  let cartaId: string;

  function refrescarInput() {
    fixture.componentRef.setInput('carta', cartaService.cartas().find((c) => c.id === cartaId));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CartaDetailEstructura], providers: [provideRouter([])] }).compileComponents();
    cartaService = TestBed.inject(CartaService);
    productoService = TestBed.inject(ProductoService);
    sesionService = TestBed.inject(SesionService);
    cartaId = cartaService.crear('Carta de prueba');
    fixture = TestBed.createComponent(CartaDetailEstructura);
    fixture.componentRef.setInput('carta', cartaService.cartas().find((c) => c.id === cartaId));
    fixture.detectChanges();
  });

  it('lista los productos agrupados bajo el nombre de su sección', () => {
    const seccionId = cartaService.agregarSeccion(cartaId, 'Entradas');
    cartaService.agregarItem(cartaId, seccionId, productoService.todos()[0].id);
    refrescarInput();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Entradas');
    expect(texto).toContain(productoService.todos()[0].nombre);
  });

  it('clic en pastilla activo la pasa a pausado y viceversa', () => {
    const seccionId = cartaService.agregarSeccion(cartaId, 'Entradas');
    const [producto] = productoService.todos();
    cartaService.agregarItem(cartaId, seccionId, producto.id);
    refrescarInput();
    const [canal] = cartaService.canales();

    fixture.componentInstance.clickPastilla(producto.id, canal.id);
    expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.estado).toBe('pausado');

    fixture.componentInstance.clickPastilla(producto.id, canal.id);
    expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.estado).toBe('activo');
  });

  it('clic en pastilla en error expande la fila en vez de alternar estado', () => {
    const seccionId = cartaService.agregarSeccion(cartaId, 'Entradas');
    const [producto] = productoService.todos();
    cartaService.agregarItem(cartaId, seccionId, producto.id);
    const [canal] = cartaService.canales();
    cartaService.simularErrorCanal(cartaId, canal.id, producto.id, 'Actualizar precio', 'Timeout');
    refrescarInput();

    fixture.componentInstance.clickPastilla(producto.id, canal.id);

    expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.estado).toBe('error');
    expect(fixture.componentInstance.estaExpandido(producto.id)).toBe(true);
  });

  it('editar el precio igual al precio base limpia el override', () => {
    const seccionId = cartaService.agregarSeccion(cartaId, 'Entradas');
    const [producto] = productoService.todos();
    cartaService.agregarItem(cartaId, seccionId, producto.id);
    refrescarInput();
    const [canal] = cartaService.canales();

    fixture.componentInstance.actualizarPrecio(producto.id, canal.id, 9999);
    expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.precio).toBe(9999);

    fixture.componentInstance.actualizarPrecio(producto.id, canal.id, producto.precioVenta);
    expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.precio).toBeUndefined();
  });

  it('reintentar limpia el error del diagnóstico', () => {
    const seccionId = cartaService.agregarSeccion(cartaId, 'Entradas');
    const [producto] = productoService.todos();
    cartaService.agregarItem(cartaId, seccionId, producto.id);
    const [canal] = cartaService.canales();
    cartaService.simularErrorCanal(cartaId, canal.id, producto.id, 'Actualizar precio', 'Timeout');
    refrescarInput();

    fixture.componentInstance.reintentar(producto.id, canal.id);

    expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.estado).toBe('activo');
  });

  it('simular error deja el producto en error y expande su fila', () => {
    const seccionId = cartaService.agregarSeccion(cartaId, 'Entradas');
    const [producto] = productoService.todos();
    cartaService.agregarItem(cartaId, seccionId, producto.id);
    refrescarInput();
    const [canal] = cartaService.canales();

    fixture.componentInstance.simularError(producto.id, canal.id);

    expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.estado).toBe('error');
    expect(fixture.componentInstance.estaExpandido(producto.id)).toBe(true);
  });

  it('selección masiva aplica el estado elegido a todos los seleccionados, cruzando secciones', () => {
    const seccionA = cartaService.agregarSeccion(cartaId, 'Entradas');
    const seccionB = cartaService.agregarSeccion(cartaId, 'Platos de fondo');
    const [productoA, productoB] = productoService.todos();
    cartaService.agregarItem(cartaId, seccionA, productoA.id);
    cartaService.agregarItem(cartaId, seccionB, productoB.id);
    refrescarInput();
    const [canal] = cartaService.canales();

    fixture.componentInstance.toggleSeleccionProducto(productoA.id);
    fixture.componentInstance.toggleSeleccionProducto(productoB.id);
    fixture.componentInstance.canalBulkSeleccionado.set(canal.id);
    fixture.componentInstance.aplicarAccionMasiva('pausado');

    expect(cartaService.estadoCanal(cartaId, canal.id, productoA.id)?.estado).toBe('pausado');
    expect(cartaService.estadoCanal(cartaId, canal.id, productoB.id)?.estado).toBe('pausado');
  });

  it('renombrar sección persiste el nuevo nombre', () => {
    const seccionId = cartaService.agregarSeccion(cartaId, 'Entradas');
    refrescarInput();

    fixture.componentInstance.iniciarRenombre(seccionId, 'Entradas');
    fixture.componentInstance.nombreEnEdicion.set('Entradas frías');
    fixture.componentInstance.confirmarRenombre(seccionId);

    const carta = cartaService.cartas().find((c) => c.id === cartaId)!;
    expect(carta.secciones.find((s) => s.id === seccionId)?.nombre).toBe('Entradas frías');
  });

  it('eliminar una sección vacía no pide confirmación', () => {
    const seccionId = cartaService.agregarSeccion(cartaId, 'Vacía');
    refrescarInput();
    const confirmSpy = vi.spyOn(window, 'confirm');

    fixture.componentInstance.eliminarSeccion({ id: seccionId, items: [] } as any);

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(cartaService.cartas().find((c) => c.id === cartaId)?.secciones.length).toBe(0);
  });

  it('eliminar una sección con productos pide confirmación y respeta la respuesta', () => {
    const seccionId = cartaService.agregarSeccion(cartaId, 'Con productos');
    cartaService.agregarItem(cartaId, seccionId, productoService.todos()[0].id);
    refrescarInput();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    fixture.componentInstance.eliminarSeccion(cartaService.cartas().find((c) => c.id === cartaId)!.secciones[0]);

    expect(confirmSpy).toHaveBeenCalled();
    expect(cartaService.cartas().find((c) => c.id === cartaId)?.secciones.length).toBe(1);
  });

  it('abrirSelectorProductos fija la sección destino, y agregarProductosSeleccionados suma varios productos de una vez y cierra el selector', () => {
    const seccionId = cartaService.agregarSeccion(cartaId, 'Entradas');
    const [productoA, productoB] = productoService.todos();
    refrescarInput();

    fixture.componentInstance.abrirSelectorProductos(seccionId);
    expect(fixture.componentInstance.seccionParaAgregarId()).toBe(seccionId);

    fixture.componentInstance.agregarProductosSeleccionados(seccionId, [productoA.id, productoB.id]);

    const carta = cartaService.cartas().find((c) => c.id === cartaId)!;
    const idsEnSeccion = carta.secciones.find((s) => s.id === seccionId)!.items.map((i) => i.productoId);
    expect(idsEnSeccion).toEqual([productoA.id, productoB.id]);
    expect(fixture.componentInstance.seccionParaAgregarId()).toBeNull();
  });

  it('rol marketing no puede alternar estado ni editar precio — el permiso bloquea el campo', () => {
    const seccionId = cartaService.agregarSeccion(cartaId, 'Entradas');
    const [producto] = productoService.todos();
    cartaService.agregarItem(cartaId, seccionId, producto.id);
    sesionService.entrarComo('marketing', 'Marketing Demo');
    refrescarInput();
    const [canal] = cartaService.canales();

    fixture.componentInstance.clickPastilla(producto.id, canal.id);
    expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.estado ?? 'activo').toBe('activo');

    fixture.componentInstance.actualizarPrecio(producto.id, canal.id, 5000);
    expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.precio).toBeUndefined();
  });

  it('rol marketing sí puede expandir el diagnóstico de un error (es lectura, no edición)', () => {
    const seccionId = cartaService.agregarSeccion(cartaId, 'Entradas');
    const [producto] = productoService.todos();
    cartaService.agregarItem(cartaId, seccionId, producto.id);
    const [canal] = cartaService.canales();
    cartaService.simularErrorCanal(cartaId, canal.id, producto.id, 'Actualizar precio', 'Timeout');
    sesionService.entrarComo('marketing', 'Marketing Demo');
    refrescarInput();

    fixture.componentInstance.clickPastilla(producto.id, canal.id);

    expect(fixture.componentInstance.estaExpandido(producto.id)).toBe(true);
  });

  it('una sección nueva arranca en franja "General" y actualizarFranjaSeccion la cambia a una franja reutilizable', () => {
    const seccionId = cartaService.agregarSeccion(cartaId, 'Entradas');
    refrescarInput();

    const seccionInicial = cartaService.cartas().find((c) => c.id === cartaId)!.secciones[0];
    expect(fixture.componentInstance.franjaDe(seccionInicial)?.nombre).toBe('General');

    const [franjaAlmuerzo] = fixture.componentInstance.franjas().filter((f) => f.nombre === 'Almuerzo');
    fixture.componentInstance.actualizarFranjaSeccion(seccionId, franjaAlmuerzo.id);

    const seccionActualizada = cartaService.cartas().find((c) => c.id === cartaId)!.secciones[0];
    expect(seccionActualizada.franjaId).toBe(franjaAlmuerzo.id);
    expect(fixture.componentInstance.franjaDe(seccionActualizada)?.horaInicio).toBe('12:00');
  });

  it('editarEnCatalogo navega a /productos con el producto y la carta como query params', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    fixture.componentInstance.editarEnCatalogo('producto-1');

    expect(navigateSpy).toHaveBeenCalledWith(['/productos'], { queryParams: { productoId: 'producto-1', cartaId } });
  });

  it('por defecto la sección activa es "todas" y seccionesVisibles muestra todas las secciones', () => {
    cartaService.agregarSeccion(cartaId, 'Entradas');
    cartaService.agregarSeccion(cartaId, 'Postres');
    refrescarInput();

    expect(fixture.componentInstance.seccionActivaId()).toBe('todas');
    expect(fixture.componentInstance.seccionesVisibles().length).toBe(2);
  });

  it('seleccionar una sección muestra solo esa en seccionesVisibles, y "todas" restaura el resto', () => {
    const seccionA = cartaService.agregarSeccion(cartaId, 'Entradas');
    cartaService.agregarSeccion(cartaId, 'Postres');
    refrescarInput();

    fixture.componentInstance.seleccionarSeccion(seccionA);
    expect(fixture.componentInstance.seccionesVisibles().map((s) => s.id)).toEqual([seccionA]);

    fixture.componentInstance.seleccionarSeccion('todas');
    expect(fixture.componentInstance.seccionesVisibles().length).toBe(2);
  });

  it('con una sección activa, la selección masiva se acota a sus productos', () => {
    const seccionA = cartaService.agregarSeccion(cartaId, 'Entradas');
    const seccionB = cartaService.agregarSeccion(cartaId, 'Postres');
    const [productoA, productoB] = productoService.todos();
    cartaService.agregarItem(cartaId, seccionA, productoA.id);
    cartaService.agregarItem(cartaId, seccionB, productoB.id);
    refrescarInput();

    fixture.componentInstance.seleccionarSeccion(seccionA);
    expect(fixture.componentInstance.todosLosProductosIds()).toEqual([productoA.id]);
  });

  it('idsProductosEnCarta sigue viendo toda la carta aunque haya una sección activa', () => {
    const seccionA = cartaService.agregarSeccion(cartaId, 'Entradas');
    const seccionB = cartaService.agregarSeccion(cartaId, 'Postres');
    const [productoA, productoB] = productoService.todos();
    cartaService.agregarItem(cartaId, seccionA, productoA.id);
    cartaService.agregarItem(cartaId, seccionB, productoB.id);
    refrescarInput();

    fixture.componentInstance.seleccionarSeccion(seccionA);
    expect(fixture.componentInstance.idsProductosEnCarta()).toEqual(new Set([productoA.id, productoB.id]));
  });

  it('eliminar la sección activa del medio selecciona la vecina anterior', () => {
    const seccionA = cartaService.agregarSeccion(cartaId, 'A');
    const seccionB = cartaService.agregarSeccion(cartaId, 'B');
    cartaService.agregarSeccion(cartaId, 'C');
    refrescarInput();
    fixture.componentInstance.seleccionarSeccion(seccionB);

    fixture.componentInstance.eliminarSeccion({ id: seccionB, items: [] } as any);

    expect(fixture.componentInstance.seccionActivaId()).toBe(seccionA);
  });

  it('eliminar la primera sección activa selecciona la que queda primera', () => {
    const seccionA = cartaService.agregarSeccion(cartaId, 'A');
    const seccionB = cartaService.agregarSeccion(cartaId, 'B');
    refrescarInput();
    fixture.componentInstance.seleccionarSeccion(seccionA);

    fixture.componentInstance.eliminarSeccion({ id: seccionA, items: [] } as any);

    expect(fixture.componentInstance.seccionActivaId()).toBe(seccionB);
  });

  it('eliminar la única sección activa vuelve a "todas"', () => {
    const seccionA = cartaService.agregarSeccion(cartaId, 'A');
    refrescarInput();
    fixture.componentInstance.seleccionarSeccion(seccionA);

    fixture.componentInstance.eliminarSeccion({ id: seccionA, items: [] } as any);

    expect(fixture.componentInstance.seccionActivaId()).toBe('todas');
  });

  it('eliminar una sección que no es la activa no cambia la selección', () => {
    const seccionA = cartaService.agregarSeccion(cartaId, 'A');
    const seccionB = cartaService.agregarSeccion(cartaId, 'B');
    refrescarInput();
    fixture.componentInstance.seleccionarSeccion(seccionA);

    fixture.componentInstance.eliminarSeccion({ id: seccionB, items: [] } as any);

    expect(fixture.componentInstance.seccionActivaId()).toBe(seccionA);
  });

  it('agregarSeccionNueva selecciona automáticamente la sección recién creada', () => {
    refrescarInput();

    fixture.componentInstance.agregarSeccionNueva();

    const nuevaSeccion = cartaService.cartas().find((c) => c.id === cartaId)!.secciones.at(-1)!;
    expect(fixture.componentInstance.seccionActivaId()).toBe(nuevaSeccion.id);
  });

  it('itemsNav marca tieneError cuando algún producto de la sección tiene estado error en algún canal', () => {
    const seccionId = cartaService.agregarSeccion(cartaId, 'Entradas');
    const [producto] = productoService.todos();
    cartaService.agregarItem(cartaId, seccionId, producto.id);
    const [canal] = cartaService.canales();
    cartaService.simularErrorCanal(cartaId, canal.id, producto.id, 'Actualizar precio', 'Timeout');
    refrescarInput();

    const item = fixture.componentInstance.itemsNav().find((i) => i.seccion.id === seccionId);
    expect(item?.tieneError).toBe(true);
  });

  it('itemsNav no marca tieneError si ningún producto de la sección tiene estado error', () => {
    const seccionId = cartaService.agregarSeccion(cartaId, 'Entradas');
    const [producto] = productoService.todos();
    cartaService.agregarItem(cartaId, seccionId, producto.id);
    refrescarInput();

    const item = fixture.componentInstance.itemsNav().find((i) => i.seccion.id === seccionId);
    expect(item?.tieneError).toBe(false);
  });

  it('indiceDe devuelve la posición real de la sección en la carta', () => {
    const seccionA = cartaService.agregarSeccion(cartaId, 'A');
    const seccionB = cartaService.agregarSeccion(cartaId, 'B');
    refrescarInput();

    const carta = cartaService.cartas().find((c) => c.id === cartaId)!;
    expect(fixture.componentInstance.indiceDe(carta.secciones.find((s) => s.id === seccionA)!)).toBe(0);
    expect(fixture.componentInstance.indiceDe(carta.secciones.find((s) => s.id === seccionB)!)).toBe(1);
  });
});
