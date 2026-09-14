import { ChangeDetectionStrategy, Component, computed, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { DatePicker } from 'primeng/datepicker';
import { SelectButton } from 'primeng/selectbutton';
import { Button } from 'primeng/button';
import { CrearCampanaPayload, PoliticaMonto } from '../../../data/giftcard.model';

type PoliticaTipo = PoliticaMonto['tipo'];

interface TierFila {
  monto: number | null;
  cantidad: number | null;
}

const OPCIONES_POLITICA: { label: string; value: PoliticaTipo }[] = [
  { label: 'Monto único fijo', value: 'fijo-unico' },
  { label: 'Varios límites de lote', value: 'fijo-tiers' },
  { label: 'Abierta (se cobra al usar)', value: 'abierto' },
];

@Component({
  selector: 'app-campana-create-modal',
  imports: [FormsModule, Dialog, InputText, InputNumber, DatePicker, SelectButton, Button],
  templateUrl: './campana-create-modal.html',
  styleUrl: './campana-create-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampanaCreateModal {
  readonly visible = model.required<boolean>();
  readonly crear = output<CrearCampanaPayload>();

  readonly opcionesPolitica = OPCIONES_POLITICA;

  readonly nombre = signal('');
  readonly fechaInicio = signal<Date | null>(null);
  readonly fechaFin = signal<Date | null>(null);
  readonly cupoMaximo = signal<number | null>(null);

  readonly politicaTipo = signal<PoliticaTipo>('fijo-unico');
  readonly montoUnico = signal<number | null>(null);
  readonly tiers = signal<TierFila[]>([{ monto: null, cantidad: null }]);

  readonly tiersValidos = computed(() => this.tiers().filter((t) => !!t.monto && !!t.cantidad));
  readonly cupoDesdeTiers = computed(() => this.tiersValidos().reduce((total, t) => total + (t.cantidad ?? 0), 0));

  readonly puedeConfirmar = computed(() => {
    if (this.nombre().trim().length === 0 || this.fechaInicio() === null || this.fechaFin() === null) return false;
    switch (this.politicaTipo()) {
      case 'abierto':
        return !!this.cupoMaximo();
      case 'fijo-unico':
        return !!this.cupoMaximo() && !!this.montoUnico();
      case 'fijo-tiers':
        return this.tiersValidos().length > 0 && this.tiersValidos().length === this.tiers().length;
    }
  });

  agregarTier(): void {
    this.tiers.update((filas) => [...filas, { monto: null, cantidad: null }]);
  }

  quitarTier(indice: number): void {
    this.tiers.update((filas) => filas.filter((_, i) => i !== indice));
  }

  actualizarTierMonto(indice: number, monto: number | null): void {
    this.tiers.update((filas) => filas.map((f, i) => (i === indice ? { ...f, monto } : f)));
  }

  actualizarTierCantidad(indice: number, cantidad: number | null): void {
    this.tiers.update((filas) => filas.map((f, i) => (i === indice ? { ...f, cantidad } : f)));
  }

  confirmar(): void {
    if (!this.puedeConfirmar()) return;

    const politicaMonto: PoliticaMonto =
      this.politicaTipo() === 'fijo-unico'
        ? { tipo: 'fijo-unico', monto: this.montoUnico()! }
        : this.politicaTipo() === 'fijo-tiers'
          ? { tipo: 'fijo-tiers', tiers: this.tiersValidos().map((t) => ({ monto: t.monto!, cantidad: t.cantidad! })) }
          : { tipo: 'abierto' };

    const cupoMaximo = this.politicaTipo() === 'fijo-tiers' ? this.cupoDesdeTiers() : this.cupoMaximo()!;

    this.crear.emit({
      nombre: this.nombre().trim(),
      fechaInicio: aIso(this.fechaInicio()!),
      fechaFin: aIso(this.fechaFin()!),
      cupoMaximo,
      politicaMonto,
    });
    this.cerrar();
  }

  cerrar(): void {
    this.visible.set(false);
    this.nombre.set('');
    this.fechaInicio.set(null);
    this.fechaFin.set(null);
    this.cupoMaximo.set(null);
    this.politicaTipo.set('fijo-unico');
    this.montoUnico.set(null);
    this.tiers.set([{ monto: null, cantidad: null }]);
  }
}

function aIso(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}
