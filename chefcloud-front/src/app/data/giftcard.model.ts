export type GiftcardEstado = 'sin-activar' | 'activa' | 'agotada' | 'inactiva';

export type GiftcardTipoMonto = 'fijo' | 'dinamico';

export type GiftcardCanal = 'ecommerce' | 'tienda' | 'ambos';

export type MovimientoTipo = 'creacion' | 'venta' | 'uso' | 'ajuste';

export interface Movimiento {
  sid: string;
  tipo: MovimientoTipo;
  fecha: string;
  monto: number;
  saldoResultante: number;
  detalle: string;
  usuario: string;
}

export interface Giftcard {
  id: string;
  empresaId: string;
  codigo: string;
  tipoMonto: GiftcardTipoMonto;
  canal: GiftcardCanal;
  cliente: string | null;
  monto: number;
  saldo: number;
  sid: string;
  vigente: boolean;
  fechaActivacion: string | null;
  campanaId: string | null;
  movimientos: Movimiento[];
}

/** Estado siempre calculado — nunca se setea como campo aislado. */
export function calcularEstadoGiftcard(giftcard: Pick<Giftcard, 'vigente' | 'fechaActivacion' | 'saldo'>): GiftcardEstado {
  if (!giftcard.vigente) return 'inactiva';
  if (!giftcard.fechaActivacion) return 'sin-activar';
  return giftcard.saldo > 0 ? 'activa' : 'agotada';
}

export interface Empresa {
  id: string;
  nombre: string;
  /** null = holding (o empresa standalone sin tiendas); si tiene valor, es una tienda de ese holding. */
  holdingId: string | null;
}

export interface DenominacionTier {
  monto: number;
  cantidad: number;
}

/**
 * Gobierna qué monto pueden tener las giftcards de una campaña:
 * - 'abierto': sin monto fijo — se cobra según el gasto real del cliente (tipoMonto dinámico obligatorio).
 * - 'fijo-unico': todas las giftcards de la campaña valen exactamente `monto`.
 * - 'fijo-tiers': la campaña tiene varias denominaciones, cada una con su propio cupo (ej. 5 de $10.000, 10 de $20.000).
 */
export type PoliticaMonto = { tipo: 'abierto' } | { tipo: 'fijo-unico'; monto: number } | { tipo: 'fijo-tiers'; tiers: DenominacionTier[] };

/** Agrupa códigos de giftcard bajo una campaña con vigencia propia (ej. "Campaña Invierno"). */
export interface Campana {
  id: string;
  empresaId: string;
  nombre: string;
  fechaCreacion: string;
  fechaInicio: string;
  fechaFin: string;
  archivada: boolean;
  /** Tope total de giftcards que puede tener esta campaña a lo largo de su vida — no solo por lote. Con 'fijo-tiers' es la suma de los tiers. */
  cupoMaximo: number;
  politicaMonto: PoliticaMonto;
}

export interface EstadisticasCampana {
  campana: Campana;
  total: number;
  activas: number;
  sinActivar: number;
  canjeadas: number;
  canceladas: number;
}

export interface CrearCampanaPayload {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  cupoMaximo: number;
  politicaMonto: PoliticaMonto;
}

export interface CrearGiftcardIndividualPayload {
  modo: 'individual';
  tipoMonto: GiftcardTipoMonto;
  canal: GiftcardCanal;
  montoFijo: number | null;
  crearSoloComoVigente: boolean;
}

export interface CrearGiftcardLotePayload {
  modo: 'lote';
  campanaId: string;
  cantidad: number;
  tipoMonto: GiftcardTipoMonto;
  canal: GiftcardCanal;
  montoFijo: number | null;
}

export type CrearGiftcardPayload = CrearGiftcardIndividualPayload | CrearGiftcardLotePayload;

export interface ActivarGiftcardPayload {
  giftcardId: string;
  destinatario: string;
  /** Obligatorio si la giftcard es de monto dinámico — recién ahí se le asigna el monto. */
  monto?: number;
}

export interface BloquearGiftcardPayload {
  giftcardId: string;
  motivo: string;
}

export interface ReiniciarActivacionPayload {
  giftcardId: string;
}
