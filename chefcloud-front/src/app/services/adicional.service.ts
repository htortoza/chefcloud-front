import { Injectable, computed, inject, signal } from '@angular/core';
import { AsociacionAdicionalProducto, EstadoCanalOpcion, GrupoAdicional, OpcionAdicional } from '../data/adicionales.model';
import { EstadoCanalProducto } from '../data/cartas.model';
import { MarcaContextService } from './marca-context.service';
import { CartaService } from './carta.service';
import { ProductoService } from './producto.service';

let contadorId = 0;
function siguienteId(prefijo: string): string {
  contadorId += 1;
  return `${prefijo}-${contadorId}`;
}

const MARCA_ID_MOCK = 'marca-1';

const GRUPOS_SEED: GrupoAdicional[] = [
  {
    id: 'adicional-seed-1',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Salsas',
    titulo: 'Elige tus salsas',
    descripcion: 'Hasta 2 salsas, la primera sin costo',
    limiteMinimo: 0,
    limiteMaximo: 2,
    activo: true,
    opciones: [
      { id: 'adicional-opcion-seed-1', sku: 'SAL-001', fromCatalogo: false, nombre: 'Ají', descripcion: '', precioBase: 0, limiteMinimo: 0, limiteMaximo: 1, disponible: true },
      { id: 'adicional-opcion-seed-2', sku: 'SAL-002', fromCatalogo: false, nombre: 'Mayonesa', descripcion: '', precioBase: 0, limiteMinimo: 0, limiteMaximo: 1, disponible: true },
      { id: 'adicional-opcion-seed-3', sku: 'SAL-003', fromCatalogo: false, nombre: 'Chimichurri', descripcion: '', precioBase: 300, limiteMinimo: 0, limiteMaximo: 1, disponible: true },
    ],
  },
  {
    id: 'adicional-seed-2',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Extras parrilla',
    titulo: 'Agrega extras',
    descripcion: '',
    limiteMinimo: 0,
    limiteMaximo: 3,
    activo: true,
    opciones: [
      { id: 'adicional-opcion-seed-4', sku: 'EXT-001', fromCatalogo: false, nombre: 'Queso extra', descripcion: '', precioBase: 800, limiteMinimo: 0, limiteMaximo: 2, disponible: true },
      { id: 'adicional-opcion-seed-5', sku: 'EXT-002', fromCatalogo: false, nombre: 'Tocino', descripcion: '', precioBase: 1200, limiteMinimo: 0, limiteMaximo: 2, disponible: true },
    ],
  },
];

const ESTADOS_CANAL_OPCION_SEED: EstadoCanalOpcion[] = [
  { grupoId: 'adicional-seed-2', opcionId: 'adicional-opcion-seed-5', canalId: 'uber-eats', estado: 'activo', precio: 1500 },
  {
    grupoId: 'adicional-seed-2',
    opcionId: 'adicional-opcion-seed-4',
    canalId: 'rappi',
    estado: 'error',
    diagnostico: { queSeIntento: 'Actualizar precio', motivo: 'El canal devolvió error 500 (simulado)', ultimoIntento: 'Hace 7 minutos', intentos: 1 },
  },
];

// "Pollo a la brasa (1/4)" (producto-7) con "Extras parrilla" ya asignado — para ver el flujo con datos desde el arranque.
const ASOCIACIONES_SEED: AsociacionAdicionalProducto[] = [{ id: 'adicional-asociacion-seed-1', grupoId: 'adicional-seed-2', productoId: 'producto-7' }];

@Injectable({ providedIn: 'root' })
export class AdicionalService {
  private readonly marcaContextService = inject(MarcaContextService);
  private readonly cartaService = inject(CartaService);
  private readonly productoService = inject(ProductoService);

  private readonly _grupos = signal<GrupoAdicional[]>(GRUPOS_SEED);
  private readonly _estadosCanalOpcion = signal<EstadoCanalOpcion[]>(ESTADOS_CANAL_OPCION_SEED);
  private readonly _asociaciones = signal<AsociacionAdicionalProducto[]>(ASOCIACIONES_SEED);

  readonly grupos = computed(() => this._grupos().filter((g) => g.marcaId === this.marcaContextService.marcaActiva().id));
  readonly canales = this.cartaService.canales;

  obtenerPorId(id: string): GrupoAdicional | undefined {
    return this._grupos().find((g) => g.id === id);
  }

  /** Crear = editar (Módulo Adicionales, sección 3): el grupo se crea ya en borrador y se navega directo a su editor. */
  crear(): string {
    const id = siguienteId('adicional');
    const nuevo: GrupoAdicional = {
      id,
      marcaId: this.marcaContextService.marcaActiva().id,
      nombre: 'Nuevo grupo',
      titulo: '',
      descripcion: '',
      limiteMinimo: 0,
      limiteMaximo: 0,
      activo: true,
      opciones: [],
    };
    this._grupos.update((lista) => [...lista, nuevo]);
    return id;
  }

  private mutarGrupo(grupoId: string, mutar: (grupo: GrupoAdicional) => GrupoAdicional): void {
    this._grupos.update((lista) => lista.map((g) => (g.id === grupoId ? mutar(g) : g)));
  }

  actualizar(grupoId: string, cambios: Partial<Pick<GrupoAdicional, 'nombre' | 'titulo' | 'descripcion' | 'limiteMinimo' | 'limiteMaximo' | 'activo'>>): void {
    this.mutarGrupo(grupoId, (g) => ({ ...g, ...cambios }));
  }

  eliminar(grupoId: string): void {
    this._grupos.update((lista) => lista.filter((g) => g.id !== grupoId));
    this._asociaciones.update((lista) => lista.filter((a) => a.grupoId !== grupoId));
  }

  /** Muchos-a-muchos, a nivel Marca — un producto lleva los mismos adicionales en cualquier carta donde aparezca. */
  gruposDeProducto(productoId: string): GrupoAdicional[] {
    const ids = new Set(this._asociaciones().filter((a) => a.productoId === productoId).map((a) => a.grupoId));
    return this.grupos().filter((g) => ids.has(g.id));
  }

  asociarProducto(grupoId: string, productoId: string): void {
    const yaAsociado = this._asociaciones().some((a) => a.grupoId === grupoId && a.productoId === productoId);
    if (yaAsociado) return;
    this._asociaciones.update((lista) => [...lista, { id: siguienteId('adicional-asociacion'), grupoId, productoId }]);
  }

  desasociarProducto(grupoId: string, productoId: string): void {
    this._asociaciones.update((lista) => lista.filter((a) => !(a.grupoId === grupoId && a.productoId === productoId)));
  }

  agregarOpcionNueva(grupoId: string, datos: { sku: string; nombre: string; precioBase: number; limiteMinimo: number; limiteMaximo: number }): string {
    const opcionId = siguienteId('adicional-opcion');
    const nueva: OpcionAdicional = { id: opcionId, fromCatalogo: false, descripcion: '', disponible: true, ...datos };
    this.mutarGrupo(grupoId, (g) => ({ ...g, opciones: [...g.opciones, nueva] }));
    return opcionId;
  }

  /** Copia sku/nombre/precio del producto al momento de agregar — luego vive independiente (Módulo Adicionales, sección 7). */
  agregarOpcionesDelCatalogo(grupoId: string, productoIds: string[]): void {
    const nuevas: OpcionAdicional[] = productoIds
      .map((id) => this.productoService.obtenerPorId(id))
      .filter((p) => p !== undefined)
      .map((p) => ({
        id: siguienteId('adicional-opcion'),
        sku: p.sku,
        fromCatalogo: true,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precioBase: p.precioVenta,
        limiteMinimo: 0,
        limiteMaximo: 1,
        disponible: true,
      }));
    if (nuevas.length === 0) return;
    this.mutarGrupo(grupoId, (g) => ({ ...g, opciones: [...g.opciones, ...nuevas] }));
  }

  /** El límite máximo de una opción nunca puede superar el del grupo — se clampea en vez de bloquear el autoguardado (Módulo Adicionales, pendiente #3). */
  actualizarOpcion(grupoId: string, opcionId: string, cambios: Partial<Pick<OpcionAdicional, 'nombre' | 'descripcion' | 'limiteMinimo' | 'limiteMaximo'>>): void {
    this.mutarGrupo(grupoId, (g) => {
      const limiteGrupo = g.limiteMaximo;
      const limiteMaximo = cambios.limiteMaximo !== undefined && limiteGrupo > 0 ? Math.min(cambios.limiteMaximo, limiteGrupo) : cambios.limiteMaximo;
      return { ...g, opciones: g.opciones.map((o) => (o.id === opcionId ? { ...o, ...cambios, ...(limiteMaximo !== undefined ? { limiteMaximo } : {}) } : o)) };
    });
  }

  /** Apagar/encender una opción sin eliminarla — distinto de `eliminarOpcion` (esa sí la borra, uso del editor completo). */
  toggleDisponibleOpcion(grupoId: string, opcionId: string): void {
    this.mutarGrupo(grupoId, (g) => ({ ...g, opciones: g.opciones.map((o) => (o.id === opcionId ? { ...o, disponible: !o.disponible } : o)) }));
  }

  eliminarOpcion(grupoId: string, opcionId: string): void {
    this.mutarGrupo(grupoId, (g) => ({ ...g, opciones: g.opciones.filter((o) => o.id !== opcionId) }));
    this._estadosCanalOpcion.update((lista) => lista.filter((e) => !(e.grupoId === grupoId && e.opcionId === opcionId)));
  }

  estadoCanalOpcion(grupoId: string, opcionId: string, canalId: string): EstadoCanalOpcion | undefined {
    return this._estadosCanalOpcion().find((e) => e.grupoId === grupoId && e.opcionId === opcionId && e.canalId === canalId);
  }

  private upsertEstadoCanalOpcion(grupoId: string, opcionId: string, canalId: string, cambios: Partial<Omit<EstadoCanalOpcion, 'grupoId' | 'opcionId' | 'canalId'>>): void {
    this._estadosCanalOpcion.update((lista) => {
      const existente = lista.find((e) => e.grupoId === grupoId && e.opcionId === opcionId && e.canalId === canalId);
      if (existente) {
        return lista.map((e) => (e === existente ? { ...e, ...cambios } : e));
      }
      return [...lista, { grupoId, opcionId, canalId, estado: 'activo', ...cambios }];
    });
  }

  setPrecioCanalOpcion(grupoId: string, opcionId: string, canalId: string, precio: number | undefined): void {
    this.upsertEstadoCanalOpcion(grupoId, opcionId, canalId, { precio });
  }

  /** El operador solo puede alternar activo/pausado — 'error' lo pone el sistema (ver simularErrorCanalOpcion/reintentarCanalOpcion). */
  setEstadoOperativoOpcion(grupoId: string, opcionId: string, canalId: string, estado: Extract<EstadoCanalProducto, 'activo' | 'pausado'>): void {
    this.upsertEstadoCanalOpcion(grupoId, opcionId, canalId, { estado, diagnostico: undefined });
  }

  /** Demo/dev only — no hay backend real que pueda fallar solo (mismo patrón que CartaService.simularErrorCanal). */
  simularErrorCanalOpcion(grupoId: string, opcionId: string, canalId: string, queSeIntento: string, motivo: string): void {
    const previo = this.estadoCanalOpcion(grupoId, opcionId, canalId);
    this.upsertEstadoCanalOpcion(grupoId, opcionId, canalId, {
      estado: 'error',
      diagnostico: { queSeIntento, motivo, ultimoIntento: 'Hace instantes', intentos: (previo?.diagnostico?.intentos ?? 0) + 1 },
    });
  }

  reintentarCanalOpcion(grupoId: string, opcionId: string, canalId: string): void {
    this.upsertEstadoCanalOpcion(grupoId, opcionId, canalId, { estado: 'activo', diagnostico: undefined });
  }
}
