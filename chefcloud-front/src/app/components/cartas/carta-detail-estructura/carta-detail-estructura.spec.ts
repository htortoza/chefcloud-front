import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { CartaDetailEstructura } from './carta-detail-estructura';
import { CartaService } from '../../../services/carta.service';
import { ProductoService } from '../../../services/producto.service';
import { SesionService } from '../../../services/sesion.service';
import { AdicionalService } from '../../../services/adicional.service';

describe('CartaDetailEstructura', () => {
  let fixture: ComponentFixture<CartaDetailEstructura>;
  let cartaService: CartaService;
  let productoService: ProductoService;
  let sesionService: SesionService;
  let adicionalService: AdicionalService;
  let cartaId: string;

  function refrescarInput() {
    fixture.componentRef.setInput('carta', cartaService.cartas().find((c) => c.id === cartaId));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CartaDetailEstructura], providers: [provideRouter([]), ConfirmationService] }).compileComponents();
    cartaService = TestBed.inject(CartaService);
    productoService = TestBed.inject(ProductoService);
    sesionService = TestBed.inject(SesionService);
    adicionalService = TestBed.inject(AdicionalService);
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

  it('rol marketing no puede alternar estado — el permiso bloquea el campo', () => {
    const seccionId = cartaService.agregarSeccion(cartaId, 'Entradas');
    const [producto] = productoService.todos();
    cartaService.agregarItem(cartaId, seccionId, producto.id);
    sesionService.entrarComo('marketing', 'Marketing Demo');
    refrescarInput();
    const [canal] = cartaService.canales();

    fixture.componentInstance.clickPastilla(producto.id, canal.id);
    expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.estado ?? 'activo').toBe('activo');
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

  it('el nav lateral muestra "Todas" y un ítem por cada sección', () => {
    cartaService.agregarSeccion(cartaId, 'Entradas');
    cartaService.agregarSeccion(cartaId, 'Postres');
    refrescarInput();

    const textos = Array.from(fixture.nativeElement.querySelectorAll('.secciones-nav__item')).map((el: any) => el.textContent.trim());
    expect(textos.some((t: string) => t.includes('Todas'))).toBe(true);
    expect(textos.some((t: string) => t.includes('Entradas'))).toBe(true);
    expect(textos.some((t: string) => t.includes('Postres'))).toBe(true);
  });

  it('click en un ítem del nav muestra solo esa sección en el DOM, y "Todas" restaura el resto', () => {
    cartaService.agregarSeccion(cartaId, 'Entradas');
    cartaService.agregarSeccion(cartaId, 'Postres');
    refrescarInput();

    const botones = Array.from(fixture.nativeElement.querySelectorAll('.secciones-nav__item')) as HTMLButtonElement[];
    botones.find((b) => b.textContent?.includes('Entradas'))!.click();
    fixture.detectChanges();

    let nombresVisibles = Array.from(fixture.nativeElement.querySelectorAll('.seccion__nombre')).map((el: any) => el.textContent.trim());
    expect(nombresVisibles).toEqual(['Entradas']);

    botones.find((b) => b.textContent?.includes('Todas'))!.click();
    fixture.detectChanges();

    nombresVisibles = Array.from(fixture.nativeElement.querySelectorAll('.seccion__nombre')).map((el: any) => el.textContent.trim());
    expect(nombresVisibles.length).toBe(2);
  });

  it('el ítem del nav con producto en error muestra el indicador de error', () => {
    const seccionId = cartaService.agregarSeccion(cartaId, 'Entradas');
    const [producto] = productoService.todos();
    cartaService.agregarItem(cartaId, seccionId, producto.id);
    const [canal] = cartaService.canales();
    cartaService.simularErrorCanal(cartaId, canal.id, producto.id, 'Actualizar precio', 'Timeout');
    refrescarInput();

    expect(fixture.nativeElement.querySelector('.secciones-nav__error')).toBeTruthy();
  });

  it('filtroProducto acota seccionesVisibles a las secciones con un producto que matchea, cruzando secciones', () => {
    const seccionA = cartaService.agregarSeccion(cartaId, 'Entradas');
    const seccionB = cartaService.agregarSeccion(cartaId, 'Platos de fondo');
    const [productoA, productoB] = productoService.todos();
    cartaService.agregarItem(cartaId, seccionA, productoA.id);
    cartaService.agregarItem(cartaId, seccionB, productoB.id);
    refrescarInput();

    fixture.componentInstance.filtroProducto.set(productoB.nombre.slice(0, 4));

    expect(fixture.componentInstance.seccionesVisibles().map((s) => s.id)).toEqual([seccionB]);
  });

  it('filtroProducto es case-insensitive y filtra también los productos mostrados dentro de la sección', () => {
    const seccionId = cartaService.agregarSeccion(cartaId, 'Entradas');
    const [productoA, productoB] = productoService.todos();
    cartaService.agregarItem(cartaId, seccionId, productoA.id);
    cartaService.agregarItem(cartaId, seccionId, productoB.id);
    refrescarInput();
    const seccion = cartaService.cartas().find((c) => c.id === cartaId)!.secciones[0];

    fixture.componentInstance.filtroProducto.set(productoA.nombre.toUpperCase());

    expect(fixture.componentInstance.productosDe(seccion).map((p) => p.id)).toEqual([productoA.id]);
  });

  it('filtroProducto sin resultados deja seccionesVisibles vacío', () => {
    cartaService.agregarSeccion(cartaId, 'Entradas');
    refrescarInput();

    fixture.componentInstance.filtroProducto.set('producto que no existe');

    expect(fixture.componentInstance.seccionesVisibles().length).toBe(0);
  });

  it('seleccionar una sección del nav limpia el filtro de búsqueda', () => {
    const seccionA = cartaService.agregarSeccion(cartaId, 'Entradas');
    refrescarInput();
    fixture.componentInstance.filtroProducto.set('algo');

    fixture.componentInstance.seleccionarSeccion(seccionA);

    expect(fixture.componentInstance.filtroProducto()).toBe('');
  });

  it('con búsqueda activa, la selección masiva se acota a los productos que matchean', () => {
    const seccionA = cartaService.agregarSeccion(cartaId, 'Entradas');
    const [productoA, productoB] = productoService.todos();
    cartaService.agregarItem(cartaId, seccionA, productoA.id);
    cartaService.agregarItem(cartaId, seccionA, productoB.id);
    refrescarInput();

    fixture.componentInstance.filtroProducto.set(productoA.nombre);

    expect(fixture.componentInstance.todosLosProductosIds()).toEqual([productoA.id]);
  });

  it('una sección sin productos muestra el estado vacío con botón para agregar', () => {
    const seccionId = cartaService.agregarSeccion(cartaId, 'Entradas');
    refrescarInput();

    expect(fixture.nativeElement.querySelector('.seccion__vacia')).toBeTruthy();
    const boton = Array.from(fixture.nativeElement.querySelectorAll('.seccion__vacia button')).find((b: any) =>
      b.textContent.includes('Agregar producto'),
    ) as HTMLButtonElement;
    expect(boton).toBeTruthy();

    boton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.seccionParaAgregarId()).toBe(seccionId);
  });

  it('carta sin secciones: el nav muestra solo "Todas" y el botón de agregar, y el panel muestra el mensaje vacío', () => {
    refrescarInput();

    const textos = Array.from(fixture.nativeElement.querySelectorAll('.secciones-nav__item')).map((el: any) => el.textContent.trim());
    expect(textos.length).toBe(1); // "Todas" — "+ Sección" ya no es un ítem de lista, es un botón aparte
    expect(fixture.nativeElement.querySelector('.secciones-nav__nueva')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.estructura__vacio')).toBeTruthy();
  });

  it('gruposDeProducto refleja los grupos de adicionales asociados al producto', () => {
    const seccionId = cartaService.agregarSeccion(cartaId, 'Entradas');
    const [producto] = productoService.todos();
    cartaService.agregarItem(cartaId, seccionId, producto.id);
    const [grupo] = adicionalService.grupos();
    adicionalService.asociarProducto(grupo.id, producto.id);
    refrescarInput();

    expect(fixture.componentInstance.gruposDeProducto(producto.id).map((g) => g.id)).toContain(grupo.id);
  });

  it('abrirAsociarAdicional/cerrarAsociarAdicional alternan qué fila tiene el buscador abierto', () => {
    const [producto] = productoService.todos();
    expect(fixture.componentInstance.productoParaAsociarAdicionalId()).toBeNull();

    fixture.componentInstance.abrirAsociarAdicional(producto.id);
    expect(fixture.componentInstance.productoParaAsociarAdicionalId()).toBe(producto.id);

    fixture.componentInstance.cerrarAsociarAdicional();
    expect(fixture.componentInstance.productoParaAsociarAdicionalId()).toBeNull();
  });

  it('idsAdicionalesDe refleja los grupos ya asociados al producto', () => {
    const [producto] = productoService.todos();
    const [grupo] = adicionalService.grupos();
    adicionalService.asociarProducto(grupo.id, producto.id);

    expect(fixture.componentInstance.idsAdicionalesDe(producto.id)).toEqual(new Set([grupo.id]));
  });

  it('agregarAdicionales vincula varios grupos de una vez y cierra el selector', () => {
    const [producto] = productoService.todos();
    const [grupoA, grupoB] = adicionalService.grupos();
    fixture.componentInstance.abrirAsociarAdicional(producto.id);

    fixture.componentInstance.agregarAdicionales(producto.id, [grupoA.id, grupoB.id]);

    const idsAsociados = adicionalService.gruposDeProducto(producto.id).map((g) => g.id);
    expect(idsAsociados).toContain(grupoA.id);
    expect(idsAsociados).toContain(grupoB.id);
    expect(fixture.componentInstance.productoParaAsociarAdicionalId()).toBeNull();
  });

  it('desasociarAdicional quita el vínculo', () => {
    const [producto] = productoService.todos();
    const [grupo] = adicionalService.grupos();
    adicionalService.asociarProducto(grupo.id, producto.id);

    fixture.componentInstance.desasociarAdicional(producto.id, grupo.id);

    expect(adicionalService.gruposDeProducto(producto.id).map((g) => g.id)).not.toContain(grupo.id);
  });

  it('toggleAdicional alterna qué grupo está expandido, por grupoId', () => {
    const [grupo] = adicionalService.grupos();
    expect(fixture.componentInstance.estaAdicionalExpandido(grupo.id)).toBe(false);

    fixture.componentInstance.toggleAdicional(grupo.id);
    expect(fixture.componentInstance.estaAdicionalExpandido(grupo.id)).toBe(true);

    fixture.componentInstance.toggleAdicional(grupo.id);
    expect(fixture.componentInstance.estaAdicionalExpandido(grupo.id)).toBe(false);
  });

  it('toggleActivoAdicional alterna el estado activo/pausado del grupo', () => {
    const [grupo] = adicionalService.grupos();
    expect(adicionalService.obtenerPorId(grupo.id)?.activo).toBe(true);

    fixture.componentInstance.toggleActivoAdicional(grupo.id);
    expect(adicionalService.obtenerPorId(grupo.id)?.activo).toBe(false);

    fixture.componentInstance.toggleActivoAdicional(grupo.id);
    expect(adicionalService.obtenerPorId(grupo.id)?.activo).toBe(true);
  });

  it('eliminarOpcionAdicional quita una opción del grupo', () => {
    const [grupo] = adicionalService.grupos();
    const [opcion] = grupo.opciones;

    fixture.componentInstance.eliminarOpcionAdicional(grupo.id, opcion.id);

    expect(adicionalService.obtenerPorId(grupo.id)?.opciones.find((o) => o.id === opcion.id)).toBeUndefined();
  });

  it('rol marketing no puede alternar activo/pausado ni eliminar opciones de un grupo — el permiso bloquea la acción', () => {
    const [grupo] = adicionalService.grupos();
    const [opcion] = grupo.opciones;
    sesionService.entrarComo('marketing', 'Marketing Demo');
    refrescarInput();

    fixture.componentInstance.toggleActivoAdicional(grupo.id);
    expect(adicionalService.obtenerPorId(grupo.id)?.activo).toBe(true);

    fixture.componentInstance.eliminarOpcionAdicional(grupo.id, opcion.id);
    expect(adicionalService.obtenerPorId(grupo.id)?.opciones.find((o) => o.id === opcion.id)).toBeDefined();
  });

  it('rol marketing no puede abrir el buscador ni asociar/desasociar adicionales — el permiso bloquea la acción', () => {
    const [producto] = productoService.todos();
    const [grupo] = adicionalService.grupos();
    adicionalService.asociarProducto(grupo.id, producto.id);
    sesionService.entrarComo('marketing', 'Marketing Demo');
    refrescarInput();

    fixture.componentInstance.abrirAsociarAdicional(producto.id);
    expect(fixture.componentInstance.productoParaAsociarAdicionalId()).toBeNull();

    fixture.componentInstance.desasociarAdicional(producto.id, grupo.id);
    expect(adicionalService.gruposDeProducto(producto.id).map((g) => g.id)).toContain(grupo.id);
  });
});
