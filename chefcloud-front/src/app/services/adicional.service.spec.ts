import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AdicionalService } from './adicional.service';
import { ProductoService } from './producto.service';

describe('AdicionalService', () => {
  let adicionalService: AdicionalService;
  let productoService: ProductoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    adicionalService = TestBed.inject(AdicionalService);
    productoService = TestBed.inject(ProductoService);
  });

  it('arranca con grupos mock de la marca activa', () => {
    expect(adicionalService.grupos().length).toBeGreaterThan(0);
  });

  it('crear agrega un grupo en borrador con nombre por defecto, límites en 0, activo y sin opciones', () => {
    const id = adicionalService.crear();
    const grupo = adicionalService.obtenerPorId(id);
    expect(grupo?.nombre).toBe('Nuevo grupo');
    expect(grupo?.limiteMinimo).toBe(0);
    expect(grupo?.limiteMaximo).toBe(0);
    expect(grupo?.activo).toBe(true);
    expect(grupo?.opciones).toEqual([]);
  });

  it('actualizar cambia solo los campos pasados, autoguardado', () => {
    const id = adicionalService.crear();
    adicionalService.actualizar(id, { nombre: 'Salsas', titulo: 'Elige tu salsa', limiteMaximo: 2 });
    const grupo = adicionalService.obtenerPorId(id);
    expect(grupo?.nombre).toBe('Salsas');
    expect(grupo?.titulo).toBe('Elige tu salsa');
    expect(grupo?.limiteMaximo).toBe(2);
    expect(grupo?.descripcion).toBe('');
  });

  it('eliminar quita el grupo del catálogo', () => {
    const id = adicionalService.crear();
    adicionalService.eliminar(id);
    expect(adicionalService.obtenerPorId(id)).toBeUndefined();
  });

  it('agregarOpcionNueva agrega una opción creada desde cero, fromCatalogo false', () => {
    const grupoId = adicionalService.crear();
    const opcionId = adicionalService.agregarOpcionNueva(grupoId, { sku: 'TOP-001', nombre: 'Queso extra', precioBase: 800, limiteMinimo: 0, limiteMaximo: 2 });
    const grupo = adicionalService.obtenerPorId(grupoId)!;
    const opcion = grupo.opciones.find((o) => o.id === opcionId);
    expect(opcion?.nombre).toBe('Queso extra');
    expect(opcion?.fromCatalogo).toBe(false);
    expect(opcion?.precioBase).toBe(800);
  });

  it('agregarOpcionesDelCatalogo copia sku/nombre/precio del producto, fromCatalogo true', () => {
    const grupoId = adicionalService.crear();
    const [producto] = productoService.todos();

    adicionalService.agregarOpcionesDelCatalogo(grupoId, [producto.id]);

    const grupo = adicionalService.obtenerPorId(grupoId)!;
    expect(grupo.opciones.length).toBe(1);
    expect(grupo.opciones[0]).toMatchObject({
      sku: producto.sku,
      nombre: producto.nombre,
      precioBase: producto.precioVenta,
      fromCatalogo: true,
    });
  });

  it('agregarOpcionesDelCatalogo suma varias de una vez', () => {
    const grupoId = adicionalService.crear();
    const [a, b] = productoService.todos();

    adicionalService.agregarOpcionesDelCatalogo(grupoId, [a.id, b.id]);

    expect(adicionalService.obtenerPorId(grupoId)!.opciones.length).toBe(2);
  });

  it('actualizarOpcion cambia campos base de una opción', () => {
    const grupoId = adicionalService.crear();
    adicionalService.actualizar(grupoId, { limiteMaximo: 5 });
    const opcionId = adicionalService.agregarOpcionNueva(grupoId, { sku: 'TOP-001', nombre: 'Queso extra', precioBase: 800, limiteMinimo: 0, limiteMaximo: 2 });

    adicionalService.actualizarOpcion(grupoId, opcionId, { nombre: 'Queso extra doble', limiteMaximo: 3 });

    const opcion = adicionalService.obtenerPorId(grupoId)!.opciones.find((o) => o.id === opcionId);
    expect(opcion?.nombre).toBe('Queso extra doble');
    expect(opcion?.limiteMaximo).toBe(3);
  });

  it('actualizarOpcion clampea el límite máximo de la opción al límite máximo del grupo', () => {
    const grupoId = adicionalService.crear();
    adicionalService.actualizar(grupoId, { limiteMaximo: 2 });
    const opcionId = adicionalService.agregarOpcionNueva(grupoId, { sku: 'TOP-001', nombre: 'Queso extra', precioBase: 800, limiteMinimo: 0, limiteMaximo: 1 });

    adicionalService.actualizarOpcion(grupoId, opcionId, { limiteMaximo: 10 });

    const opcion = adicionalService.obtenerPorId(grupoId)!.opciones.find((o) => o.id === opcionId);
    expect(opcion?.limiteMaximo).toBe(2);
  });

  it('eliminarOpcion quita la opción y sus estados por canal', () => {
    const grupoId = adicionalService.crear();
    const opcionId = adicionalService.agregarOpcionNueva(grupoId, { sku: 'TOP-001', nombre: 'Queso extra', precioBase: 800, limiteMinimo: 0, limiteMaximo: 2 });
    const [canal] = adicionalService.canales();
    adicionalService.setPrecioCanalOpcion(grupoId, opcionId, canal.id, 900);

    adicionalService.eliminarOpcion(grupoId, opcionId);

    expect(adicionalService.obtenerPorId(grupoId)!.opciones.find((o) => o.id === opcionId)).toBeUndefined();
    expect(adicionalService.estadoCanalOpcion(grupoId, opcionId, canal.id)).toBeUndefined();
  });

  it('setPrecioCanalOpcion y estadoCanalOpcion guardan el override de precio por grupo+opción+canal', () => {
    const grupoId = adicionalService.crear();
    const opcionId = adicionalService.agregarOpcionNueva(grupoId, { sku: 'TOP-001', nombre: 'Queso extra', precioBase: 800, limiteMinimo: 0, limiteMaximo: 2 });
    const [canal] = adicionalService.canales();

    adicionalService.setPrecioCanalOpcion(grupoId, opcionId, canal.id, 950);

    expect(adicionalService.estadoCanalOpcion(grupoId, opcionId, canal.id)?.precio).toBe(950);
  });

  it('setEstadoOperativoOpcion alterna activo/pausado sin tocar el precio', () => {
    const grupoId = adicionalService.crear();
    const opcionId = adicionalService.agregarOpcionNueva(grupoId, { sku: 'TOP-001', nombre: 'Queso extra', precioBase: 800, limiteMinimo: 0, limiteMaximo: 2 });
    const [canal] = adicionalService.canales();

    adicionalService.setPrecioCanalOpcion(grupoId, opcionId, canal.id, 950);
    adicionalService.setEstadoOperativoOpcion(grupoId, opcionId, canal.id, 'pausado');

    const estado = adicionalService.estadoCanalOpcion(grupoId, opcionId, canal.id);
    expect(estado?.estado).toBe('pausado');
    expect(estado?.precio).toBe(950);
  });

  it('arranca con "Pollo a la brasa (1/4)" ya con un grupo de adicionales asignado', () => {
    expect(adicionalService.gruposDeProducto('producto-7').length).toBeGreaterThan(0);
  });

  it('asociarProducto vincula el grupo al producto, y gruposDeProducto lo refleja', () => {
    const grupoId = adicionalService.crear();
    const [producto] = productoService.todos();

    adicionalService.asociarProducto(grupoId, producto.id);

    expect(adicionalService.gruposDeProducto(producto.id).map((g) => g.id)).toContain(grupoId);
  });

  it('asociarProducto no duplica si el grupo ya está asociado a ese producto', () => {
    const grupoId = adicionalService.crear();
    const [producto] = productoService.todos();

    adicionalService.asociarProducto(grupoId, producto.id);
    adicionalService.asociarProducto(grupoId, producto.id);

    expect(adicionalService.gruposDeProducto(producto.id).filter((g) => g.id === grupoId).length).toBe(1);
  });

  it('desasociarProducto quita el vínculo sin borrar el grupo del catálogo', () => {
    const grupoId = adicionalService.crear();
    const [producto] = productoService.todos();
    adicionalService.asociarProducto(grupoId, producto.id);

    adicionalService.desasociarProducto(grupoId, producto.id);

    expect(adicionalService.gruposDeProducto(producto.id).map((g) => g.id)).not.toContain(grupoId);
    expect(adicionalService.obtenerPorId(grupoId)).toBeDefined();
  });

  it('eliminar un grupo también quita sus asociaciones a productos', () => {
    const grupoId = adicionalService.crear();
    const [producto] = productoService.todos();
    adicionalService.asociarProducto(grupoId, producto.id);

    adicionalService.eliminar(grupoId);

    expect(adicionalService.gruposDeProducto(producto.id)).toEqual([]);
  });

  it('gruposDeProducto de un producto sin asociaciones devuelve vacío', () => {
    const [, segundoProducto] = productoService.todos();
    expect(adicionalService.gruposDeProducto(segundoProducto.id)).toEqual([]);
  });

  it('simularErrorCanalOpcion deja diagnóstico, y reintentarCanalOpcion limpia el error y vuelve a activo', () => {
    const grupoId = adicionalService.crear();
    const opcionId = adicionalService.agregarOpcionNueva(grupoId, { sku: 'TOP-001', nombre: 'Queso extra', precioBase: 800, limiteMinimo: 0, limiteMaximo: 2 });
    const [canal] = adicionalService.canales();

    adicionalService.simularErrorCanalOpcion(grupoId, opcionId, canal.id, 'Actualizar precio', 'El canal devolvió error 429');
    let estado = adicionalService.estadoCanalOpcion(grupoId, opcionId, canal.id);
    expect(estado?.estado).toBe('error');
    expect(estado?.diagnostico?.intentos).toBe(1);

    adicionalService.reintentarCanalOpcion(grupoId, opcionId, canal.id);
    estado = adicionalService.estadoCanalOpcion(grupoId, opcionId, canal.id);
    expect(estado?.estado).toBe('activo');
    expect(estado?.diagnostico).toBeUndefined();
  });
});
