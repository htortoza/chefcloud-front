import { Injectable, computed, inject, signal } from '@angular/core';
import { Banner, Carta, Asignacion, Canal, EstadoCanalCarta, EstadoCanalProducto, EstadoCarta, FRANJA_GENERAL_ID, Seccion } from '../data/cartas.model';
import { TIENDAS_MOCK, TiendaMock } from '../data/tienda-mock.data';
import { MarcaContextService } from './marca-context.service';

let contadorId = 0;
function siguienteId(prefijo: string): string {
  contadorId += 1;
  return `${prefijo}-${contadorId}`;
}

const CANALES_MOCK: Canal[] = [
  { id: 'web', nombre: 'WEB', tipo: 'web', colorMarca: '#EC4899', inicial: 'W', icono: 'pi pi-globe' },
  { id: 'uber-eats', nombre: 'Uber Eats', tipo: 'externo', colorMarca: '#06C167', inicial: 'UE' },
  { id: 'rappi', nombre: 'Rappi', tipo: 'externo', colorMarca: '#FF441F', inicial: 'R' },
  { id: 'pedidosya', nombre: 'PedidosYa', tipo: 'externo', colorMarca: '#FA0050', inicial: 'PY' },
];

function snapshotDe(carta: Carta): string {
  // Serialización simple del contenido editable — alcanza para detectar "hay cambios sin publicar".
  return JSON.stringify({
    nombre: carta.nombre,
    descripcionInterna: carta.descripcionInterna,
    tipoVigencia: carta.tipoVigencia,
    rangoFechas: carta.rangoFechas,
    franjaEspecial: carta.franjaEspecial,
    secciones: carta.secciones,
  });
}

function franjasSePisan(a: NonNullable<Carta['franjaEspecial']>, b: NonNullable<Carta['franjaEspecial']>): boolean {
  return a === 'todo-dia' || b === 'todo-dia' || a === b;
}

function rangosSePisan(a: { desde: string; hasta: string }, b: { desde: string; hasta: string }): boolean {
  return a.desde <= b.hasta && b.desde <= a.hasta;
}

const MARCA_ID_MOCK = 'marca-1';

// Cartas de ejemplo con ids con prefijo "seed" — nunca colisionan con siguienteId('carta'|'seccion'|...),
// que solo produce sufijos numéricos puros ("carta-1", "seccion-2", ...).
const CARTAS_SEED: Carta[] = (
  [
    {
      id: 'carta-seed-1',
      marcaId: MARCA_ID_MOCK,
      nombre: 'Menú Regular',
      descripcionInterna: 'Carta base del local — rota entre almuerzo y cena por sección',
      estado: 'publicada',
      tipoVigencia: 'regular',
      franjaId: FRANJA_GENERAL_ID,
      secciones: [
        {
          id: 'seccion-seed-1',
          nombre: 'Entradas',
          orden: 0,
          franjaId: FRANJA_GENERAL_ID,
          items: [
            { productoId: 'producto-1', orden: 0 },
            { productoId: 'producto-4', orden: 1 },
            { productoId: 'producto-5', orden: 2 },
          ],
        },
        {
          id: 'seccion-seed-2',
          nombre: 'Almuerzo',
          orden: 1,
          franjaId: 'franja-almuerzo',
          items: [
            { productoId: 'producto-6', orden: 0 },
            { productoId: 'producto-7', orden: 1 },
          ],
        },
        {
          id: 'seccion-seed-3',
          nombre: 'Cena',
          orden: 2,
          franjaId: 'franja-cena',
          items: [{ productoId: 'producto-2', orden: 0 }],
        },
        {
          id: 'seccion-seed-4',
          nombre: 'Bebidas',
          orden: 3,
          franjaId: FRANJA_GENERAL_ID,
          items: [
            { productoId: 'producto-3', orden: 0 },
            { productoId: 'producto-8', orden: 1 },
            { productoId: 'producto-9', orden: 2 },
          ],
        },
        {
          id: 'seccion-seed-5',
          nombre: 'Postres',
          orden: 4,
          franjaId: FRANJA_GENERAL_ID,
          items: [
            { productoId: 'producto-10', orden: 0 },
            { productoId: 'producto-11', orden: 1 },
          ],
        },
      ],
      banners: [
        { id: 'banner-seed-1', texto: '20% de descuento en pedidos sobre $25.000', link: '/cartas' },
        { id: 'banner-seed-2', texto: 'Nuevo: Pisco Sour de la casa', link: '/cartas' },
      ],
    },
    {
      id: 'carta-seed-2',
      marcaId: MARCA_ID_MOCK,
      nombre: 'Fiestas Patrias',
      descripcionInterna: 'Carta especial para el 18 y 19 de septiembre',
      estado: 'borrador',
      tipoVigencia: 'fecha-especial',
      rangoFechas: { desde: '2026-09-18', hasta: '2026-09-19' },
      franjaEspecial: 'todo-dia',
      franjaId: 'franja-almuerzo',
      secciones: [
        {
          id: 'seccion-seed-6',
          nombre: 'Parrilla criolla',
          orden: 0,
          franjaId: FRANJA_GENERAL_ID,
          items: [
            { productoId: 'producto-6', orden: 0 },
            { productoId: 'producto-2', orden: 1 },
          ],
        },
      ],
      banners: [{ id: 'banner-seed-3', texto: 'Solo por Fiestas Patrias', link: '/cartas' }],
    },
  ] as Carta[]
).map((carta) =>
  carta.estado === 'publicada'
    ? { ...carta, snapshotUltimaPublicacion: snapshotDe(carta), ultimaPublicacionEn: '2026-09-01T12:00:00.000Z' }
    : carta,
);

const ASIGNACIONES_SEED: Asignacion[] = [
  { id: 'asignacion-seed-1', cartaId: 'carta-seed-1', tiendaId: 'tienda-1' },
  { id: 'asignacion-seed-2', cartaId: 'carta-seed-1', tiendaId: 'tienda-2' },
  { id: 'asignacion-seed-3', cartaId: 'carta-seed-2', tiendaId: 'tienda-3' },
];

const ESTADOS_CANAL_SEED: EstadoCanalCarta[] = [
  // Lomo a lo pobre con precio distinto en Uber Eats.
  { cartaId: 'carta-seed-1', canalId: 'uber-eats', productoId: 'producto-2', estado: 'activo', precio: 11990 },
  // Pollo a la brasa pausado puntualmente en Rappi.
  { cartaId: 'carta-seed-1', canalId: 'rappi', productoId: 'producto-7', estado: 'pausado' },
  // Ceviche clásico con error real de publicación en PedidosYa, para poder ver el diagnóstico sin usar "Simular error".
  {
    cartaId: 'carta-seed-1',
    canalId: 'pedidosya',
    productoId: 'producto-5',
    estado: 'error',
    diagnostico: {
      queSeIntento: 'Actualizar disponibilidad',
      motivo: 'El canal devolvió error 429 (demasiadas solicitudes)',
      ultimoIntento: 'Hace 12 minutos',
      intentos: 2,
    },
  },
];

@Injectable({ providedIn: 'root' })
export class CartaService {
  private readonly marcaContextService = inject(MarcaContextService);
  private readonly _cartas = signal<Carta[]>(CARTAS_SEED);
  private readonly _asignaciones = signal<Asignacion[]>(ASIGNACIONES_SEED);
  private readonly _estadosCanal = signal<EstadoCanalCarta[]>(ESTADOS_CANAL_SEED);

  readonly cartas = computed(() => this._cartas().filter((c) => c.marcaId === this.marcaContextService.marcaActiva().id));
  readonly tiendas = (): TiendaMock[] => TIENDAS_MOCK;
  readonly canales = (): Canal[] => CANALES_MOCK;

  estadoDerivado(carta: Carta): EstadoCarta | 'con-cambios' {
    if (carta.estado === 'publicada' && carta.snapshotUltimaPublicacion !== snapshotDe(carta)) {
      return 'con-cambios';
    }
    return carta.estado;
  }

  crear(nombre: string): string {
    const id = siguienteId('carta');
    const nueva: Carta = {
      id,
      marcaId: this.marcaContextService.marcaActiva().id,
      nombre,
      descripcionInterna: '',
      estado: 'borrador',
      tipoVigencia: 'regular',
      franjaId: FRANJA_GENERAL_ID,
      secciones: [],
      banners: [],
    };
    this._cartas.update((lista) => [...lista, nueva]);
    return id;
  }

  private mutarCarta(cartaId: string, mutar: (carta: Carta) => Carta): void {
    this._cartas.update((lista) => lista.map((c) => (c.id === cartaId ? mutar(c) : c)));
  }

  actualizarGeneral(cartaId: string, cambios: Partial<Pick<Carta, 'nombre' | 'descripcionInterna' | 'tipoVigencia' | 'rangoFechas' | 'franjaEspecial'>>): void {
    this.mutarCarta(cartaId, (c) => ({ ...c, ...cambios }));
  }

  publicar(cartaId: string): void {
    this.mutarCarta(cartaId, (c) => {
      const publicada: Carta = { ...c, estado: 'publicada' };
      return { ...publicada, snapshotUltimaPublicacion: snapshotDe(publicada), ultimaPublicacionEn: new Date().toISOString() };
    });
  }

  agregarSeccion(cartaId: string, nombre: string): string {
    const seccionId = siguienteId('seccion');
    this.mutarCarta(cartaId, (c) => ({
      ...c,
      secciones: [...c.secciones, { id: seccionId, nombre, orden: c.secciones.length, icono: undefined, franjaId: FRANJA_GENERAL_ID, items: [] }],
    }));
    return seccionId;
  }

  actualizarSeccion(cartaId: string, seccionId: string, cambios: Partial<Pick<Seccion, 'nombre' | 'icono' | 'franjaId' | 'orden'>>): void {
    this.mutarCarta(cartaId, (c) => ({
      ...c,
      secciones: c.secciones.map((s) => (s.id === seccionId ? { ...s, ...cambios } : s)),
    }));
  }

  /** Intercambia la sección con la inmediatamente anterior ('arriba') o siguiente ('abajo'). No-op en los bordes. */
  moverSeccion(cartaId: string, seccionId: string, direccion: 'arriba' | 'abajo'): void {
    this.mutarCarta(cartaId, (c) => {
      const indice = c.secciones.findIndex((s) => s.id === seccionId);
      const destino = direccion === 'arriba' ? indice - 1 : indice + 1;
      if (indice === -1 || destino < 0 || destino >= c.secciones.length) return c;

      const secciones = [...c.secciones];
      [secciones[indice], secciones[destino]] = [secciones[destino], secciones[indice]];
      secciones[indice] = { ...secciones[indice], orden: indice };
      secciones[destino] = { ...secciones[destino], orden: destino };
      return { ...c, secciones };
    });
  }

  eliminarSeccion(cartaId: string, seccionId: string): void {
    this.mutarCarta(cartaId, (c) => ({ ...c, secciones: c.secciones.filter((s) => s.id !== seccionId) }));
  }

  /** Un producto pertenece a una sola sección a la vez — no-op silencioso si ya está en otra sección de esta carta. */
  agregarItem(cartaId: string, seccionId: string, productoId: string): void {
    const carta = this._cartas().find((c) => c.id === cartaId);
    if (carta?.secciones.some((s) => s.items.some((i) => i.productoId === productoId))) return;

    this.mutarCarta(cartaId, (c) => ({
      ...c,
      secciones: c.secciones.map((s) => (s.id === seccionId ? { ...s, items: [...s.items, { productoId, orden: s.items.length }] } : s)),
    }));
  }

  quitarItem(cartaId: string, seccionId: string, productoId: string): void {
    this.mutarCarta(cartaId, (c) => ({
      ...c,
      secciones: c.secciones.map((s) => (s.id === seccionId ? { ...s, items: s.items.filter((i) => i.productoId !== productoId) } : s)),
    }));
  }

  tiendasAsignadas(cartaId: string): TiendaMock[] {
    const idsAsignados = this._asignaciones().filter((a) => a.cartaId === cartaId).map((a) => a.tiendaId);
    return TIENDAS_MOCK.filter((t) => idsAsignados.includes(t.id));
  }

  /** Solo valida solapamiento entre cartas de fecha especial — las regulares rotan por sección, no chocan entre sí. */
  asignar(cartaId: string, tiendaId: string): { ok: true } | { ok: false; conflicto: string } {
    const carta = this._cartas().find((c) => c.id === cartaId);
    if (!carta) return { ok: false, conflicto: 'La carta no existe' };

    if (carta.tipoVigencia === 'fecha-especial' && carta.rangoFechas && carta.franjaEspecial) {
      const otrasCartasEnTienda = this._asignaciones()
        .filter((a) => a.tiendaId === tiendaId && a.cartaId !== cartaId)
        .map((a) => this._cartas().find((c) => c.id === a.cartaId))
        .filter((c): c is Carta => !!c && c.tipoVigencia === 'fecha-especial' && !!c.rangoFechas && !!c.franjaEspecial);

      const conflicto = otrasCartasEnTienda.find(
        (otra) => rangosSePisan(carta.rangoFechas!, otra.rangoFechas!) && franjasSePisan(carta.franjaEspecial!, otra.franjaEspecial!),
      );

      if (conflicto) {
        return { ok: false, conflicto: `Se superpone con "${conflicto.nombre}" en esa tienda y rango de fechas` };
      }
    }

    this._asignaciones.update((lista) => [...lista, { id: siguienteId('asignacion'), cartaId, tiendaId }]);
    return { ok: true };
  }

  desasignar(cartaId: string, tiendaId: string): void {
    this._asignaciones.update((lista) => lista.filter((a) => !(a.cartaId === cartaId && a.tiendaId === tiendaId)));
  }

  estadoCanal(cartaId: string, canalId: string, productoId: string): EstadoCanalCarta | undefined {
    return this._estadosCanal().find((e) => e.cartaId === cartaId && e.canalId === canalId && e.productoId === productoId);
  }

  estadosDeCartaYCanal(cartaId: string, canalId: string): EstadoCanalCarta[] {
    return this._estadosCanal().filter((e) => e.cartaId === cartaId && e.canalId === canalId);
  }

  private upsertEstadoCanal(cartaId: string, canalId: string, productoId: string, cambios: Partial<Omit<EstadoCanalCarta, 'cartaId' | 'canalId' | 'productoId'>>): void {
    this._estadosCanal.update((lista) => {
      const existente = lista.find((e) => e.cartaId === cartaId && e.canalId === canalId && e.productoId === productoId);
      if (existente) {
        return lista.map((e) => (e === existente ? { ...e, ...cambios } : e));
      }
      return [...lista, { cartaId, canalId, productoId, estado: 'activo', ...cambios }];
    });
  }

  setPrecioCanal(cartaId: string, canalId: string, productoId: string, precio: number | undefined): void {
    this.upsertEstadoCanal(cartaId, canalId, productoId, { precio });
  }

  /** Dueño: Marketing (desde Catálogo → Producto) — independiente de precio/estado (dueño: Operaciones). */
  setNombreCanal(cartaId: string, canalId: string, productoId: string, nombre: string | undefined): void {
    this.upsertEstadoCanal(cartaId, canalId, productoId, { nombre });
  }

  /** Dueño: Marketing (desde Catálogo → Producto) — independiente de precio/estado (dueño: Operaciones). */
  setDescripcionCanal(cartaId: string, canalId: string, productoId: string, descripcion: string | undefined): void {
    this.upsertEstadoCanal(cartaId, canalId, productoId, { descripcion });
  }

  /** El operador solo puede alternar activo/pausado — 'error' lo pone el sistema (ver simularErrorCanal/reintentar). */
  setEstadoOperativo(cartaId: string, canalId: string, productoId: string, estado: Extract<EstadoCanalProducto, 'activo' | 'pausado'>): void {
    this.upsertEstadoCanal(cartaId, canalId, productoId, { estado, diagnostico: undefined });
  }

  /** Demo/dev only: no hay backend real que pueda fallar — esto simula el escenario para poder probar el diagnóstico y el reintento. */
  simularErrorCanal(cartaId: string, canalId: string, productoId: string, queSeIntento: string, motivo: string): void {
    const previo = this.estadoCanal(cartaId, canalId, productoId);
    this.upsertEstadoCanal(cartaId, canalId, productoId, {
      estado: 'error',
      diagnostico: { queSeIntento, motivo, ultimoIntento: 'Hace instantes', intentos: (previo?.diagnostico?.intentos ?? 0) + 1 },
    });
  }

  /** Reenvía el último comando pendiente. En este demo siempre resuelve exitoso (no hay canal real que pueda volver a fallar). */
  reintentar(cartaId: string, canalId: string, productoId: string): void {
    this.upsertEstadoCanal(cartaId, canalId, productoId, { estado: 'activo', diagnostico: undefined });
  }

  cartasQueUsanProducto(productoId: string): number {
    return this._cartas().filter((c) => c.secciones.some((s) => s.items.some((i) => i.productoId === productoId))).length;
  }

  banners(cartaId: string): Banner[] {
    return this._cartas().find((c) => c.id === cartaId)?.banners ?? [];
  }

  agregarBanner(cartaId: string, texto: string, link: string): string {
    const bannerId = siguienteId('banner');
    this.mutarCarta(cartaId, (c) => ({ ...c, banners: [...c.banners, { id: bannerId, texto, link }] }));
    return bannerId;
  }

  eliminarBanner(cartaId: string, bannerId: string): void {
    this.mutarCarta(cartaId, (c) => ({ ...c, banners: c.banners.filter((b) => b.id !== bannerId) }));
  }
}
