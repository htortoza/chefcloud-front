import { Injectable, computed, inject, signal } from '@angular/core';
import { CrearProductoPayload, Familia, Producto } from '../data/catalogo.model';
import { MarcaContextService } from './marca-context.service';

// Arranca en 100 para no colisionar con los ids literales de PRODUCTOS_MOCK (producto-1..11) —
// si el contador arrancara en 0, el primer producto creado desde la UI reusaría 'producto-1'.
let contadorId = 100;
function siguienteId(prefijo: string): string {
  contadorId += 1;
  return `${prefijo}-${contadorId}`;
}

const MARCA_ID_MOCK = 'marca-1';

const FAMILIAS_MOCK: Familia[] = [
  { id: 'familia-entradas', marcaId: MARCA_ID_MOCK, nombre: 'Entradas' },
  { id: 'familia-platos', marcaId: MARCA_ID_MOCK, nombre: 'Platos de fondo' },
  { id: 'familia-bebidas', marcaId: MARCA_ID_MOCK, nombre: 'Bebidas' },
  { id: 'familia-postres', marcaId: MARCA_ID_MOCK, nombre: 'Postres' },
  { id: 'familia-sopas', marcaId: MARCA_ID_MOCK, nombre: 'Sopas' },
  { id: 'familia-sandwiches', marcaId: MARCA_ID_MOCK, nombre: 'Sándwiches' },
  { id: 'familia-guarniciones', marcaId: MARCA_ID_MOCK, nombre: 'Guarniciones' },
];

const PRODUCTOS_MOCK: Producto[] = [
  {
    id: 'producto-1',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Empanada de pino',
    descripcion: 'Empanada horneada rellena de pino tradicional',
    precioVenta: 2500,
    precioCosto: 900,
    sku: 'EMP-001',
    familiaId: 'familia-entradas',
    etiquetas: ['clásico'],
    gruposModificadores: [],
    activo: true,
  },
  {
    id: 'producto-2',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Lomo a lo pobre',
    descripcion: 'Lomo de res, huevo frito, papas fritas y cebolla salteada',
    precioVenta: 9900,
    precioOferta: 8900,
    precioCosto: 4200,
    sku: 'LOM-001',
    familiaId: 'familia-platos',
    etiquetas: ['best-seller'],
    gruposModificadores: [
      {
        id: 'grupo-terminos',
        nombre: 'Término de la carne',
        minimo: 1,
        maximo: 1,
        opciones: [
          { nombre: 'Término medio', precio: 0, disponible: true },
          { nombre: 'Bien cocido', precio: 0, disponible: true },
        ],
      },
    ],
    activo: true,
  },
  {
    id: 'producto-3',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Limonada natural',
    descripcion: 'Limonada exprimida al momento',
    precioVenta: 2200,
    precioCosto: 700,
    sku: 'BEB-001',
    familiaId: 'familia-bebidas',
    etiquetas: [],
    gruposModificadores: [],
    activo: true,
  },
  {
    id: 'producto-4',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Causa limeña',
    descripcion: 'Capas de papa amarilla con relleno de pollo y palta',
    precioVenta: 6900,
    precioCosto: 2500,
    sku: 'CAU-001',
    familiaId: 'familia-entradas',
    etiquetas: [],
    gruposModificadores: [],
    activo: true,
  },
  {
    id: 'producto-5',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Ceviche clásico',
    descripcion: 'Pescado blanco marinado en leche de tigre, choclo y camote',
    precioVenta: 8900,
    precioCosto: 3500,
    sku: 'CEV-001',
    familiaId: 'familia-entradas',
    etiquetas: ['sin gluten'],
    gruposModificadores: [],
    activo: true,
  },
  {
    id: 'producto-6',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Arroz con mariscos',
    descripcion: 'Arroz salteado con mix de mariscos y un toque de ají amarillo',
    precioVenta: 12900,
    precioCosto: 5200,
    sku: 'ARR-001',
    familiaId: 'familia-platos',
    etiquetas: [],
    gruposModificadores: [],
    activo: true,
  },
  {
    id: 'producto-7',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Pollo a la brasa (1/4)',
    descripcion: 'Cuarto de pollo dorado a las brasas',
    precioVenta: 10900,
    precioCosto: 4300,
    sku: 'POL-001',
    familiaId: 'familia-platos',
    etiquetas: ['best-seller'],
    gruposModificadores: [
      {
        id: 'grupo-acompanamiento',
        nombre: 'Acompañamiento',
        minimo: 1,
        maximo: 1,
        opciones: [
          { nombre: 'Papas fritas', precio: 0, disponible: true },
          { nombre: 'Ensalada', precio: 0, disponible: true },
          { nombre: 'Arroz chaufa', precio: 800, disponible: true },
        ],
      },
    ],
    activo: true,
  },
  {
    id: 'producto-8',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Chicha morada',
    descripcion: 'Bebida de maíz morado con piña y especias',
    precioVenta: 2500,
    precioCosto: 800,
    sku: 'BEB-002',
    familiaId: 'familia-bebidas',
    etiquetas: [],
    gruposModificadores: [],
    activo: true,
  },
  {
    id: 'producto-9',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Pisco sour',
    descripcion: 'Pisco, limón, jarabe de goma, clara de huevo y amargo de angostura',
    precioVenta: 4500,
    precioCosto: 1600,
    sku: 'BEB-003',
    familiaId: 'familia-bebidas',
    etiquetas: ['con alcohol'],
    gruposModificadores: [],
    activo: true,
  },
  {
    id: 'producto-10',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Suspiro a la limeña',
    descripcion: 'Manjar blanco con merengue al oporto',
    precioVenta: 4200,
    precioCosto: 1500,
    sku: 'POS-001',
    familiaId: 'familia-postres',
    etiquetas: [],
    gruposModificadores: [],
    activo: true,
  },
  {
    id: 'producto-11',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Mazamorra morada',
    descripcion: 'Postre de maíz morado con frutas y canela',
    precioVenta: 3800,
    precioCosto: 1300,
    sku: 'POS-002',
    familiaId: 'familia-postres',
    etiquetas: [],
    gruposModificadores: [],
    activo: true,
  },
  {
    id: 'producto-12',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Anticuchos de corazón',
    descripcion: 'Brochetas de corazón de res marinadas, a la parrilla',
    precioVenta: 7500,
    precioCosto: 2800,
    sku: 'ANT-001',
    familiaId: 'familia-entradas',
    etiquetas: ['clásico'],
    gruposModificadores: [],
    activo: true,
  },
  {
    id: 'producto-13',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Tacu tacu con lomo saltado',
    descripcion: 'Tacu tacu de frejoles con lomo saltado encima',
    precioVenta: 13900,
    precioCosto: 5600,
    sku: 'TAC-001',
    familiaId: 'familia-platos',
    etiquetas: ['best-seller'],
    gruposModificadores: [],
    activo: true,
  },
  {
    id: 'producto-14',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Chilcano de pisco',
    descripcion: 'Pisco, ginger ale, limón y amargo de angostura',
    precioVenta: 4800,
    precioCosto: 1700,
    sku: 'BEB-004',
    familiaId: 'familia-bebidas',
    etiquetas: ['con alcohol'],
    gruposModificadores: [],
    activo: true,
  },
  {
    id: 'producto-15',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Turrón de doña Pepa',
    descripcion: 'Capas de bizcocho anisado con miel de higos y grageas de colores',
    precioVenta: 3900,
    precioCosto: 1400,
    sku: 'POS-003',
    familiaId: 'familia-postres',
    etiquetas: ['clásico'],
    gruposModificadores: [],
    activo: true,
  },
  {
    id: 'producto-16',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Parihuela',
    descripcion: 'Sopa de mariscos y pescado en caldo concentrado',
    precioVenta: 10900,
    precioCosto: 4600,
    sku: 'SOP-001',
    familiaId: 'familia-sopas',
    etiquetas: [],
    gruposModificadores: [],
    activo: true,
  },
  {
    id: 'producto-17',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Aguadito de pollo',
    descripcion: 'Caldo de pollo con cilantro, arroz y verduras',
    precioVenta: 8500,
    precioCosto: 3400,
    sku: 'SOP-002',
    familiaId: 'familia-sopas',
    etiquetas: ['clásico'],
    gruposModificadores: [],
    activo: true,
  },
  {
    id: 'producto-18',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Sánguche de chicharrón',
    descripcion: 'Pan francés con chicharrón de cerdo, camote frito y salsa criolla',
    precioVenta: 6500,
    precioCosto: 2600,
    sku: 'SAN-001',
    familiaId: 'familia-sandwiches',
    etiquetas: ['best-seller'],
    gruposModificadores: [],
    activo: true,
  },
  {
    id: 'producto-19',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Butifarra',
    descripcion: 'Jamón del país, salsa criolla y mayonesa casera',
    precioVenta: 5900,
    precioCosto: 2300,
    sku: 'SAN-002',
    familiaId: 'familia-sandwiches',
    etiquetas: [],
    gruposModificadores: [],
    activo: true,
  },
  {
    id: 'producto-20',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Papas fritas',
    descripcion: 'Porción de papas fritas crocantes',
    precioVenta: 3200,
    precioCosto: 1100,
    sku: 'GUA-001',
    familiaId: 'familia-guarniciones',
    etiquetas: [],
    gruposModificadores: [],
    activo: true,
  },
  {
    id: 'producto-21',
    marcaId: MARCA_ID_MOCK,
    nombre: 'Arroz blanco',
    descripcion: 'Porción de arroz blanco graneado',
    precioVenta: 1800,
    precioCosto: 500,
    sku: 'GUA-002',
    familiaId: 'familia-guarniciones',
    etiquetas: [],
    gruposModificadores: [],
    activo: true,
  },
];

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private readonly marcaContextService = inject(MarcaContextService);
  private readonly _familias = signal<Familia[]>(FAMILIAS_MOCK);
  private readonly _productos = signal<Producto[]>(PRODUCTOS_MOCK);

  readonly familias = computed(() => this._familias().filter((f) => f.marcaId === this.marcaContextService.marcaActiva().id));

  /** Solo productos activos — Productos distingue "archivado" mostrándolos aparte, ver `todos()`. */
  readonly productos = computed(() =>
    this._productos().filter((p) => p.marcaId === this.marcaContextService.marcaActiva().id && p.activo),
  );

  readonly todos = computed(() => this._productos().filter((p) => p.marcaId === this.marcaContextService.marcaActiva().id));

  obtenerPorId(id: string): Producto | undefined {
    return this._productos().find((p) => p.id === id);
  }

  crear(payload: CrearProductoPayload): void {
    const nuevo: Producto = {
      id: siguienteId('producto'),
      marcaId: this.marcaContextService.marcaActiva().id,
      activo: true,
      ...payload,
    };
    this._productos.update((lista) => [...lista, nuevo]);
  }

  actualizar(id: string, cambios: Partial<Omit<Producto, 'id' | 'marcaId'>>): void {
    this._productos.update((lista) => lista.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
  }

  archivar(id: string): void {
    this.actualizar(id, { activo: false });
  }

  activar(id: string): void {
    this.actualizar(id, { activo: true });
  }
}
