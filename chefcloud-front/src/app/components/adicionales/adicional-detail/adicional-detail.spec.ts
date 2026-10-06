import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdicionalDetail } from './adicional-detail';
import { AdicionalService } from '../../../services/adicional.service';
import { ProductoService } from '../../../services/producto.service';

describe('AdicionalDetail', () => {
  let fixture: ComponentFixture<AdicionalDetail>;
  let adicionalService: AdicionalService;
  let productoService: ProductoService;
  let grupoId: string;

  function refrescarInput() {
    fixture.componentRef.setInput('id', grupoId);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AdicionalDetail], providers: [provideRouter([])] }).compileComponents();
    adicionalService = TestBed.inject(AdicionalService);
    productoService = TestBed.inject(ProductoService);
    grupoId = adicionalService.crear();
    fixture = TestBed.createComponent(AdicionalDetail);
    refrescarInput();
  });

  it('guardarNombre/guardarTitulo/guardarDescripcion actualizan el grupo, autoguardado', () => {
    fixture.componentInstance.guardarNombre('Salsas');
    fixture.componentInstance.guardarTitulo('Elige tu salsa');
    fixture.componentInstance.guardarDescripcion('Hasta 2 sin costo');

    const grupo = adicionalService.obtenerPorId(grupoId);
    expect(grupo?.nombre).toBe('Salsas');
    expect(grupo?.titulo).toBe('Elige tu salsa');
    expect(grupo?.descripcion).toBe('Hasta 2 sin costo');
  });

  it('actualizarLimiteMinimo/Maximo actualizan los límites del grupo', () => {
    fixture.componentInstance.actualizarLimiteMinimo(1);
    fixture.componentInstance.actualizarLimiteMaximo(3);

    const grupo = adicionalService.obtenerPorId(grupoId);
    expect(grupo?.limiteMinimo).toBe(1);
    expect(grupo?.limiteMaximo).toBe(3);
  });

  it('toggleActivo alterna el estado del grupo', () => {
    expect(adicionalService.obtenerPorId(grupoId)?.activo).toBe(true);

    fixture.componentInstance.toggleActivo();
    expect(adicionalService.obtenerPorId(grupoId)?.activo).toBe(false);

    fixture.componentInstance.toggleActivo();
    expect(adicionalService.obtenerPorId(grupoId)?.activo).toBe(true);
  });

  it('confirmarOpcionNueva agrega la opción con los datos del formulario y cierra el modo agregar', () => {
    fixture.componentInstance.abrirCrearOpcion();
    fixture.componentInstance.formOpcion.sku.set('TOP-001');
    fixture.componentInstance.formOpcion.nombre.set('Queso extra');
    fixture.componentInstance.formOpcion.precioBase.set(800);

    fixture.componentInstance.confirmarOpcionNueva();

    const grupo = adicionalService.obtenerPorId(grupoId)!;
    expect(grupo.opciones.length).toBe(1);
    expect(grupo.opciones[0].nombre).toBe('Queso extra');
    expect(fixture.componentInstance.modoAgregar()).toBeNull();
  });

  it('confirmarOpcionNueva no agrega nada si falta SKU o nombre', () => {
    fixture.componentInstance.abrirCrearOpcion();
    fixture.componentInstance.formOpcion.nombre.set('Queso extra');

    fixture.componentInstance.confirmarOpcionNueva();

    expect(adicionalService.obtenerPorId(grupoId)!.opciones.length).toBe(0);
  });

  it('opcionesDelCatalogoElegidas agrega las opciones y cierra el modo agregar', () => {
    const [producto] = productoService.todos();
    fixture.componentInstance.abrirElegirDelCatalogo();

    fixture.componentInstance.opcionesDelCatalogoElegidas([producto.id]);

    const grupo = adicionalService.obtenerPorId(grupoId)!;
    expect(grupo.opciones.length).toBe(1);
    expect(grupo.opciones[0].fromCatalogo).toBe(true);
    expect(fixture.componentInstance.modoAgregar()).toBeNull();
  });

  it('opcionesFiltradas filtra por término de búsqueda, case-insensitive', () => {
    adicionalService.agregarOpcionNueva(grupoId, { sku: 'A', nombre: 'Queso extra', precioBase: 800, limiteMinimo: 0, limiteMaximo: 1 });
    adicionalService.agregarOpcionNueva(grupoId, { sku: 'B', nombre: 'Tocino', precioBase: 1200, limiteMinimo: 0, limiteMaximo: 1 });
    refrescarInput();

    fixture.componentInstance.terminoOpcion.set('QUESO');

    expect(fixture.componentInstance.opcionesFiltradas().map((o) => o.nombre)).toEqual(['Queso extra']);
  });

  it('eliminarOpcion la quita del grupo', () => {
    const opcionId = adicionalService.agregarOpcionNueva(grupoId, { sku: 'A', nombre: 'Queso extra', precioBase: 800, limiteMinimo: 0, limiteMaximo: 1 });
    refrescarInput();

    fixture.componentInstance.eliminarOpcion(opcionId);

    expect(adicionalService.obtenerPorId(grupoId)!.opciones.length).toBe(0);
  });

  it('clickPastilla en activo la pasa a pausado y viceversa', () => {
    const opcionId = adicionalService.agregarOpcionNueva(grupoId, { sku: 'A', nombre: 'Queso extra', precioBase: 800, limiteMinimo: 0, limiteMaximo: 1 });
    refrescarInput();
    const [canal] = fixture.componentInstance.canales();

    fixture.componentInstance.clickPastilla(opcionId, canal.id);
    expect(adicionalService.estadoCanalOpcion(grupoId, opcionId, canal.id)?.estado).toBe('pausado');

    fixture.componentInstance.clickPastilla(opcionId, canal.id);
    expect(adicionalService.estadoCanalOpcion(grupoId, opcionId, canal.id)?.estado).toBe('activo');
  });

  it('clickPastilla en error expande la fila en vez de alternar estado', () => {
    const opcionId = adicionalService.agregarOpcionNueva(grupoId, { sku: 'A', nombre: 'Queso extra', precioBase: 800, limiteMinimo: 0, limiteMaximo: 1 });
    refrescarInput();
    const [canal] = fixture.componentInstance.canales();
    adicionalService.simularErrorCanalOpcion(grupoId, opcionId, canal.id, 'Actualizar precio', 'Timeout');

    fixture.componentInstance.clickPastilla(opcionId, canal.id);

    expect(adicionalService.estadoCanalOpcion(grupoId, opcionId, canal.id)?.estado).toBe('error');
    expect(fixture.componentInstance.estaExpandido(opcionId)).toBe(true);
  });

  it('actualizarPrecio igual al precio base limpia el override, y usarPrecioBase también', () => {
    const opcionId = adicionalService.agregarOpcionNueva(grupoId, { sku: 'A', nombre: 'Queso extra', precioBase: 800, limiteMinimo: 0, limiteMaximo: 1 });
    refrescarInput();
    const [canal] = fixture.componentInstance.canales();

    fixture.componentInstance.actualizarPrecio(opcionId, canal.id, 950);
    expect(adicionalService.estadoCanalOpcion(grupoId, opcionId, canal.id)?.precio).toBe(950);

    fixture.componentInstance.actualizarPrecio(opcionId, canal.id, 800);
    expect(adicionalService.estadoCanalOpcion(grupoId, opcionId, canal.id)?.precio).toBeUndefined();

    fixture.componentInstance.actualizarPrecio(opcionId, canal.id, 950);
    fixture.componentInstance.usarPrecioBase(opcionId, canal.id);
    expect(adicionalService.estadoCanalOpcion(grupoId, opcionId, canal.id)?.precio).toBeUndefined();
  });

  it('simularError deja la opción en error y expande su fila; reintentar la vuelve a activo', () => {
    const opcionId = adicionalService.agregarOpcionNueva(grupoId, { sku: 'A', nombre: 'Queso extra', precioBase: 800, limiteMinimo: 0, limiteMaximo: 1 });
    refrescarInput();
    const [canal] = fixture.componentInstance.canales();

    fixture.componentInstance.simularError(opcionId, canal.id);
    expect(adicionalService.estadoCanalOpcion(grupoId, opcionId, canal.id)?.estado).toBe('error');
    expect(fixture.componentInstance.estaExpandido(opcionId)).toBe(true);

    fixture.componentInstance.reintentar(opcionId, canal.id);
    expect(adicionalService.estadoCanalOpcion(grupoId, opcionId, canal.id)?.estado).toBe('activo');
  });

  it('grupo inexistente muestra el mensaje de no encontrado', () => {
    fixture.componentRef.setInput('id', 'id-que-no-existe');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Grupo de adicionales no encontrado');
  });
});
