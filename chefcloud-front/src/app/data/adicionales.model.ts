import { EstadoCanalProducto, DiagnosticoError } from './cartas.model';

/** Un ítem elegible dentro de un GrupoAdicional — nunca vive fuera de un grupo (Módulo Adicionales, sección 2). */
export interface OpcionAdicional {
  id: string;
  sku: string;
  /** Solo informativo — no ata la opción a cambios futuros del producto origen (Módulo Adicionales, sección 2). */
  fromCatalogo: boolean;
  nombre: string;
  descripcion: string;
  precioBase: number;
  /** Límite de unidades de esta opción específica (0 = sin mínimo) — independiente del límite del grupo. */
  limiteMinimo: number;
  limiteMaximo: number;
  /** Apagar/encender sin perder la opción (a diferencia de eliminarla) — toggle simple, no varía por canal. */
  disponible: boolean;
}

/** Catálogo reutilizable a nivel Marca — crear=editar, todo autoguardado (Módulo Adicionales, sección 3). */
export interface GrupoAdicional {
  id: string;
  marcaId: string;
  nombre: string;
  titulo: string;
  descripcion: string;
  /** Selecciones totales del grupo (independiente del límite de cada opción individual). */
  limiteMinimo: number;
  limiteMaximo: number;
  /** Un único toggle, no varía por canal (Módulo Adicionales, pendiente #1 — cerrado así para v1). */
  activo: boolean;
  opciones: OpcionAdicional[];
}

/** Estado operativo + override de precio de una opción en un canal — vive separado de GrupoAdicional/OpcionAdicional,
 *  mismo patrón que EstadoCanalCarta (evita mutación inmutable anidada 3 niveles adentro). */
export interface EstadoCanalOpcion {
  grupoId: string;
  opcionId: string;
  canalId: string;
  estado: EstadoCanalProducto;
  precio?: number; // undefined = hereda precioBase de la opción
  diagnostico?: DiagnosticoError;
}

/** Relación muchos-a-muchos Producto↔GrupoAdicional — nivel Marca, no por carta (un producto lleva los mismos
 *  adicionales en cualquier carta donde aparezca). Se administra desde la fila expandida de Estructura. */
export interface AsociacionAdicionalProducto {
  id: string;
  grupoId: string;
  productoId: string;
}
