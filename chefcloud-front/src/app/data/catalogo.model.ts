export interface OpcionModificador {
  nombre: string;
  precio: number;
  disponible: boolean;
}

export interface GrupoModificador {
  id: string;
  nombre: string;
  minimo: number;
  maximo: number;
  opciones: OpcionModificador[];
}

export interface Categoria {
  id: string;
  marcaId: string;
  nombre: string;
}

export interface Producto {
  id: string;
  marcaId: string;
  nombre: string;
  descripcion: string;
  foto?: string;
  video?: string;
  precioVenta: number;
  precioOferta?: number;
  precioCosto: number;
  sku: string;
  categoriaId: string;
  etiquetas: string[];
  gruposModificadores: GrupoModificador[];
  activo: boolean;
}

export interface CrearProductoPayload {
  nombre: string;
  descripcion: string;
  foto?: string;
  precioVenta: number;
  precioOferta?: number;
  precioCosto: number;
  sku: string;
  categoriaId: string;
  etiquetas: string[];
  gruposModificadores: GrupoModificador[];
}
