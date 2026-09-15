import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CartaService } from './carta.service';
import { ProductoService } from './producto.service';

describe('CartaService', () => {
  let cartaService: CartaService;
  let productoService: ProductoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    cartaService = TestBed.inject(CartaService);
    productoService = TestBed.inject(ProductoService);
  });

  it('crear agrega una carta en borrador sin secciones', () => {
    const id = cartaService.crear('Carta de verano');
    const carta = cartaService.cartas().find((c) => c.id === id);
    expect(carta?.estado).toBe('borrador');
    expect(carta?.secciones).toEqual([]);
  });

  it('publicar cambia el estado a publicada y fija el snapshot', () => {
    const id = cartaService.crear('Carta de verano');
    cartaService.publicar(id);
    const carta = cartaService.cartas().find((c) => c.id === id)!;
    expect(carta.estado).toBe('publicada');
    expect(cartaService.estadoDerivado(carta)).toBe('publicada');
  });

  it('editar una carta publicada la marca "con-cambios" sin tocar su estado persistido', () => {
    const id = cartaService.crear('Carta de verano');
    cartaService.publicar(id);
    cartaService.actualizarGeneral(id, { descripcionInterna: 'Editado después de publicar' });
    const carta = cartaService.cartas().find((c) => c.id === id)!;
    expect(carta.estado).toBe('publicada');
    expect(cartaService.estadoDerivado(carta)).toBe('con-cambios');
  });

  it('agregarItem nunca crea un producto — solo referencia uno existente', () => {
    const cartaId = cartaService.crear('Carta de verano');
    const seccionId = cartaService.agregarSeccion(cartaId, 'Entradas');
    const [producto] = productoService.todos();

    cartaService.agregarItem(cartaId, seccionId, producto.id);

    const carta = cartaService.cartas().find((c) => c.id === cartaId)!;
    const seccion = carta.secciones.find((s) => s.id === seccionId)!;
    expect(seccion.items.map((i) => i.productoId)).toContain(producto.id);
  });

  it('asignar dos cartas fecha-especial con rangos y franjas superpuestas a la misma tienda devuelve conflicto', () => {
    const tienda = cartaService.tiendas()[0];

    const cartaA = cartaService.crear('Fiestas Patrias — todo el día');
    cartaService.actualizarGeneral(cartaA, {
      tipoVigencia: 'fecha-especial',
      rangoFechas: { desde: '2026-09-18', hasta: '2026-09-19' },
      franjaEspecial: 'todo-dia',
    });
    expect(cartaService.asignar(cartaA, tienda.id)).toEqual({ ok: true });

    const cartaB = cartaService.crear('Fiestas Patrias — almuerzo especial');
    cartaService.actualizarGeneral(cartaB, {
      tipoVigencia: 'fecha-especial',
      rangoFechas: { desde: '2026-09-18', hasta: '2026-09-18' },
      franjaEspecial: 'almuerzo',
    });
    const resultado = cartaService.asignar(cartaB, tienda.id);
    expect(resultado.ok).toBe(false);
  });

  it('cartasQueUsanProducto sube en 1 cuando una nueva carta referencia ese producto', () => {
    const [producto] = productoService.todos();
    const antes = cartaService.cartasQueUsanProducto(producto.id);
    const cartaId = cartaService.crear('Carta de verano');
    const seccionId = cartaService.agregarSeccion(cartaId, 'Entradas');
    cartaService.agregarItem(cartaId, seccionId, producto.id);

    expect(cartaService.cartasQueUsanProducto(producto.id)).toBe(antes + 1);
  });

  it('agregarItem no agrega el mismo producto dos veces si ya está en otra sección de la carta', () => {
    const cartaId = cartaService.crear('Carta de verano');
    const seccionA = cartaService.agregarSeccion(cartaId, 'Entradas');
    const seccionB = cartaService.agregarSeccion(cartaId, 'Platos de fondo');
    const [producto] = productoService.todos();

    cartaService.agregarItem(cartaId, seccionA, producto.id);
    cartaService.agregarItem(cartaId, seccionB, producto.id);

    const carta = cartaService.cartas().find((c) => c.id === cartaId)!;
    const totalOcurrencias = carta.secciones.flatMap((s) => s.items).filter((i) => i.productoId === producto.id).length;
    expect(totalOcurrencias).toBe(1);
  });

  it('moverSeccion intercambia con la anterior o siguiente, y no hace nada en los bordes', () => {
    const cartaId = cartaService.crear('Carta de verano');
    const seccionA = cartaService.agregarSeccion(cartaId, 'A');
    const seccionB = cartaService.agregarSeccion(cartaId, 'B');
    cartaService.agregarSeccion(cartaId, 'C');

    cartaService.moverSeccion(cartaId, seccionB, 'arriba');
    let carta = cartaService.cartas().find((c) => c.id === cartaId)!;
    expect(carta.secciones.map((s) => s.id)).toEqual([seccionB, seccionA, expect.any(String)]);

    cartaService.moverSeccion(cartaId, seccionB, 'arriba');
    carta = cartaService.cartas().find((c) => c.id === cartaId)!;
    expect(carta.secciones[0].id).toBe(seccionB);
  });

  it('setPrecioCanal y estadoCanal guardan el override de precio por carta+canal+producto', () => {
    const cartaId = cartaService.crear('Carta de verano');
    const [canal] = cartaService.canales();
    const [producto] = productoService.todos();

    cartaService.setPrecioCanal(cartaId, canal.id, producto.id, 4990);

    expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.precio).toBe(4990);
  });

  it('setEstadoOperativo alterna activo/pausado sin tocar el precio', () => {
    const cartaId = cartaService.crear('Carta de verano');
    const [canal] = cartaService.canales();
    const [producto] = productoService.todos();

    cartaService.setPrecioCanal(cartaId, canal.id, producto.id, 4990);
    cartaService.setEstadoOperativo(cartaId, canal.id, producto.id, 'pausado');

    const estado = cartaService.estadoCanal(cartaId, canal.id, producto.id);
    expect(estado?.estado).toBe('pausado');
    expect(estado?.precio).toBe(4990);
  });

  it('setNombreCanal y setDescripcionCanal son independientes entre sí y de precio/estado', () => {
    const cartaId = cartaService.crear('Carta de verano');
    const [canal] = cartaService.canales();
    const [producto] = productoService.todos();

    cartaService.setPrecioCanal(cartaId, canal.id, producto.id, 4990);
    cartaService.setEstadoOperativo(cartaId, canal.id, producto.id, 'pausado');
    cartaService.setNombreCanal(cartaId, canal.id, producto.id, 'Nombre corto para Uber');

    let estado = cartaService.estadoCanal(cartaId, canal.id, producto.id);
    expect(estado?.nombre).toBe('Nombre corto para Uber');
    expect(estado?.descripcion).toBeUndefined();
    expect(estado?.precio).toBe(4990);
    expect(estado?.estado).toBe('pausado');

    cartaService.setDescripcionCanal(cartaId, canal.id, producto.id, 'Descripción especial para este canal');
    estado = cartaService.estadoCanal(cartaId, canal.id, producto.id);
    expect(estado?.descripcion).toBe('Descripción especial para este canal');
    expect(estado?.nombre).toBe('Nombre corto para Uber');

    cartaService.setNombreCanal(cartaId, canal.id, producto.id, undefined);
    estado = cartaService.estadoCanal(cartaId, canal.id, producto.id);
    expect(estado?.nombre).toBeUndefined();
    expect(estado?.descripcion).toBe('Descripción especial para este canal');
  });

  it('simularErrorCanal deja diagnóstico, y reintentar limpia el error y vuelve a activo', () => {
    const cartaId = cartaService.crear('Carta de verano');
    const [canal] = cartaService.canales();
    const [producto] = productoService.todos();

    cartaService.simularErrorCanal(cartaId, canal.id, producto.id, 'Actualizar precio a $16.990', 'El canal devolvió error 429');
    let estado = cartaService.estadoCanal(cartaId, canal.id, producto.id);
    expect(estado?.estado).toBe('error');
    expect(estado?.diagnostico?.intentos).toBe(1);

    cartaService.reintentar(cartaId, canal.id, producto.id);
    estado = cartaService.estadoCanal(cartaId, canal.id, producto.id);
    expect(estado?.estado).toBe('activo');
    expect(estado?.diagnostico).toBeUndefined();
  });
});
