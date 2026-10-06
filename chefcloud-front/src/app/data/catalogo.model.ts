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
}
