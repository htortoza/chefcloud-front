import { ChangeDetectionStrategy, Component, computed, inject, model, output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeTemplate } from 'primeng/api';
import { Dialog } from 'primeng/dialog';
import { SelectButton } from 'primeng/selectbutton';
import { Select } from 'primeng/select';
import { InputNumber } from 'primeng/inputnumber';
import { Checkbox } from 'primeng/checkbox';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { CrearGiftcardPayload, GiftcardCanal, GiftcardTipoMonto } from '../../../data/giftcard.model';
import { CampanaService } from '../../../services/campana.service';

type Modo = 'individual' | 'lote';

const OPCIONES_MODO: { label: string; value: Modo }[] = [
  { label: 'Individual', value: 'individual' },
  { label: 'Lote corporativo', value: 'lote' },
];

const OPCIONES_TIPO_MONTO: { label: string; value: GiftcardTipoMonto }[] = [
  { label: 'Fijo', value: 'fijo' },
  { label: 'Dinámico', value: 'dinamico' },
];

const OPCIONES_CANAL: { label: string; value: GiftcardCanal }[] = [
  { label: 'Solo ecommerce', value: 'ecommerce' },
  { label: 'Solo tienda', value: 'tienda' },
  { label: 'Ambos', value: 'ambos' },
];

@Component({
  selector: 'app-giftcard-create-modal',
  imports: [FormsModule, CurrencyPipe, PrimeTemplate, Dialog, SelectButton, Select, InputNumber, Checkbox, Button, Message],
  templateUrl: './giftcard-create-modal.html',
  styleUrl: './giftcard-create-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GiftcardCreateModal {
  private readonly campanaService = inject(CampanaService);

  readonly visible = model.required<boolean>();
  readonly crear = output<CrearGiftcardPayload>();

  readonly opcionesModo = OPCIONES_MODO;
  readonly opcionesTipoMonto = OPCIONES_TIPO_MONTO;
  readonly opcionesCanal = OPCIONES_CANAL;
  readonly campanas = this.campanaService.campanasDeEmpresaActiva;

  readonly modo = signal<Modo>('individual');
  readonly tipoMonto = signal<GiftcardTipoMonto>('fijo');
  readonly canal = signal<GiftcardCanal>('ambos');
  readonly montoFijo = signal<number | null>(null);
  readonly crearSoloComoVigente = signal(false);
  readonly cantidadLote = signal<number | null>(null);
  readonly campanaId = signal<string | null>(null);
  readonly denominacionElegida = signal<number | null>(null);

  readonly etiquetaBotonConfirmar = computed(() => (this.modo() === 'individual' ? 'Crear giftcard' : 'Crear lote'));

  /** Política de monto de la campaña elegida — solo aplica en modo lote. Gobierna qué monto puede tener el lote (§ requerimiento de "costo límite"). */
  readonly politica = computed(() => {
    const campanaId = this.campanaId();
    return campanaId ? this.campanaService.campanaPorId(campanaId)?.politicaMonto ?? null : null;
  });

  readonly tiersConDisponibilidad = computed(() => {
    const pol = this.politica();
    const campanaId = this.campanaId();
    if (!campanaId || !pol || pol.tipo !== 'fijo-tiers') return [];
    return pol.tiers.map((t) => ({ ...t, disponible: this.campanaService.cupoDisponibleTier(campanaId, t.monto) }));
  });

  /** En modo lote, el tipo de monto y el monto quedan derivados de la política de la campaña — no es una elección libre. */
  readonly tipoMontoEfectivo = computed<GiftcardTipoMonto>(() => {
    if (this.modo() === 'individual') return this.tipoMonto();
    const pol = this.politica();
    return !pol || pol.tipo === 'abierto' ? 'dinamico' : 'fijo';
  });

  readonly montoFijoEfectivo = computed(() => {
    if (this.modo() === 'individual') return this.montoFijo();
    const pol = this.politica();
    if (!pol) return null;
    if (pol.tipo === 'fijo-unico') return pol.monto;
    if (pol.tipo === 'fijo-tiers') return this.denominacionElegida();
    return null;
  });

  readonly cupoDisponible = computed(() => {
    const campanaId = this.campanaId();
    return campanaId ? this.campanaService.cupoDisponible(campanaId) : null;
  });

  /** Tope real para "Cantidad de códigos": el cupo total de la campaña, acotado además por el sub-cupo de la denominación elegida si aplica. */
  readonly cupoMaximoParaCantidad = computed(() => {
    const total = this.cupoDisponible();
    if (total === null) return null;
    const pol = this.politica();
    if (pol?.tipo !== 'fijo-tiers') return total;
    const monto = this.denominacionElegida();
    if (!monto) return 0;
    const subCupo = this.campanaService.cupoDisponibleTier(this.campanaId()!, monto);
    return Math.min(total, subCupo);
  });

  readonly puedeConfirmar = computed(() => {
    if (this.modo() === 'individual') {
      return this.tipoMontoEfectivo() !== 'fijo' || !!this.montoFijoEfectivo();
    }

    const campanaId = this.campanaId();
    const cantidad = this.cantidadLote();
    const cupo = this.cupoMaximoParaCantidad();
    if (!campanaId || !cantidad || cupo === null || cupo === 0 || cantidad > cupo) return false;
    if (this.tipoMontoEfectivo() === 'fijo' && !this.montoFijoEfectivo()) return false;
    return true;
  });

  onCampanaSeleccionada(campanaId: string | null): void {
    this.campanaId.set(campanaId);
    this.denominacionElegida.set(null);
    this.cantidadLote.set(null);
  }

  confirmar(): void {
    if (!this.puedeConfirmar()) return;

    const payload: CrearGiftcardPayload =
      this.modo() === 'individual'
        ? {
            modo: 'individual',
            tipoMonto: this.tipoMontoEfectivo(),
            canal: this.canal(),
            montoFijo: this.montoFijoEfectivo(),
            crearSoloComoVigente: this.crearSoloComoVigente(),
          }
        : {
            modo: 'lote',
            campanaId: this.campanaId()!,
            cantidad: this.cantidadLote() ?? 0,
            tipoMonto: this.tipoMontoEfectivo(),
            canal: this.canal(),
            montoFijo: this.montoFijoEfectivo(),
          };

    this.crear.emit(payload);
    this.cerrar();
  }

  cerrar(): void {
    this.visible.set(false);
    this.reiniciar();
  }

  private reiniciar(): void {
    this.modo.set('individual');
    this.tipoMonto.set('fijo');
    this.canal.set('ambos');
    this.montoFijo.set(null);
    this.crearSoloComoVigente.set(false);
    this.cantidadLote.set(null);
    this.campanaId.set(null);
    this.denominacionElegida.set(null);
  }
}
