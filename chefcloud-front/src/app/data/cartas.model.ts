export type EstadoCarta = 'borrador' | 'publicada';

export const FRANJA_GENERAL_ID = 'general';

/** Catálogo reutilizable a nivel Marca — se asigna por selección, nunca escribiendo horas sueltas (Módulo 0, anti-patrón #12). */
export interface FranjaHoraria {
  id: string;
  marcaId: string;
  nombre: string;
  horaInicio: string | null; // "HH:mm" — null solo en "General"
  horaFin: string | null;
}

export interface ItemCarta {
  productoId: string;
  orden: number;
}

export interface Seccion {
  id: string;
  nombre: string;
  orden: number;
  icono?: string;
  franjaId: string; // referencia a FranjaHoraria.id — FRANJA_GENERAL_ID = vigente todo el día
  items: ItemCarta[];
}

export interface Carta {
  id: string;
  marcaId: string;
  nombre: string;
  descripcionInterna: string;
  estado: EstadoCarta;
  /** Nivel más alto de la herencia horaria Carta→Sección→Producto (Módulo 0, sección 3). FRANJA_GENERAL_ID = vigente todo el día. */
  franjaId: string;
  ultimaPublicacionEn?: string;
  snapshotUltimaPublicacion?: string;
  /** Si está seteada, esta carta es una copia exclusiva de otra para UNA sola tienda (nace de
   *  "duplicar para otra tienda con cambios") — nunca se asigna a una segunda tienda. Ausente en
   *  la carta compartida (la que sí puede estar asignada a todas las tiendas que haga falta). */
  tiendaExclusivaId?: string;
  /** Apunta a la carta de la que se duplicó esta — ausente en la carta compartida misma. Junto a
   *  `tiendaExclusivaId` arma la "familia" de una carta (compartida + sus copias por tienda). */
  cartaOrigenId?: string;
  secciones: Seccion[];
}

export interface Asignacion {
  id: string;
  cartaId: string;
  tiendaId: string;
}

export interface Canal {
  id: string;
  nombre: string;
  tipo: 'web' | 'externo';
  /** Color de marca del canal (hex) — usado en el badge/avatar del selector de canal, nunca el logo oficial (trademark). */
  colorMarca: string;
  /** 1-2 caracteres para el badge cuando no hay ícono (ej. "UE", "R", "PY"). */
  inicial: string;
  /** Ícono PrimeIcons opcional — solo se usa para el canal WEB de fábrica (no representa marca de terceros). */
  icono?: string;
}

export type EstadoCanalProducto = 'activo' | 'pausado' | 'error';

export interface DiagnosticoError {
  queSeIntento: string;
  motivo: string;
  ultimoIntento: string;
  intentos: number;
}

/** Estado operativo + overrides de un producto en un canal, dentro de una carta.
 *  Vive a nivel Carta+Canal+Producto (nunca por tienda) — un solo registro por esa terna.
 *  Los 4 campos editables (estado, precio, nombre, descripcion) son independientes entre sí —
 *  dueños distintos: estado/precio = Operaciones (desde Estructura), nombre/descripcion = Marketing
 *  (desde Catálogo → Producto). Ver brief v3 sección 2 y 3. */
export interface EstadoCanalCarta {
  cartaId: string;
  canalId: string;
  productoId: string;
  estado: EstadoCanalProducto;
  precio?: number; // undefined = usa precioVenta del catálogo
  nombre?: string; // undefined = usa Producto.nombre
  descripcion?: string; // undefined = usa Producto.descripcion
  diagnostico?: DiagnosticoError; // solo presente cuando estado === 'error'
}
