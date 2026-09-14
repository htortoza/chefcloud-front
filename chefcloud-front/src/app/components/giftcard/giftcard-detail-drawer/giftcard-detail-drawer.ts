import { ChangeDetectionStrategy, Component, computed, inject, input, model, output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Drawer } from 'primeng/drawer';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { ProgressBar } from 'primeng/progressbar';
import { Textarea } from 'primeng/textarea';
import { InputText } from 'primeng/inputtext';
import { InputNumber } from 'primeng/inputnumber';
import { Message } from 'primeng/message';
import { ActivarGiftcardPayload, BloquearGiftcardPayload, Giftcard, GiftcardEstado, MovimientoTipo, ReiniciarActivacionPayload, calcularEstadoGiftcard } from '../../../data/giftcard.model';
import { CampanaService } from '../../../services/campana.service';
import { SesionService } from '../../../services/sesion.service';

const ESTADO_INFO: Record<GiftcardEstado, { etiqueta: string; severidad: 'success' | 'warn' | 'secondary' }> = {
  'sin-activar': { etiqueta: 'Sin activar', severidad: 'secondary' },
  activa: { etiqueta: 'Activa', severidad: 'success' },
  agotada: { etiqueta: 'Agotada', severidad: 'secondary' },
  inactiva: { etiqueta: 'Inactiva', severidad: 'warn' },
};

const MOVIMIENTO_ETIQUETA: Record<MovimientoTipo, string> = {
  creacion: 'Creación',
  venta: 'Venta',
  uso: 'Uso',
  ajuste: 'Ajuste',
};

const CANAL_ETIQUETA = { ecommerce: 'Solo ecommerce', tienda: 'Solo tienda', ambos: 'Ambos' } as const;

type AccionActiva = 'ninguna' | 'activar' | 'bloquear';

@Component({
  selector: 'app-giftcard-detail-drawer',
  imports: [CurrencyPipe, FormsModule, Drawer, Button, Tag, ProgressBar, Textarea, InputText, InputNumber, Message],
  templateUrl: './giftcard-detail-drawer.html',
  styleUrl: './giftcard-detail-drawer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GiftcardDetailDrawer {
  private readonly campanaService = inject(CampanaService);
  private readonly sesionService = inject(SesionService);

  readonly visible = model.required<boolean>();
  readonly giftcard = input<Giftcard | null>(null);
  readonly activar = output<ActivarGiftcardPayload>();
  readonly bloquear = output<BloquearGiftcardPayload>();
  readonly reiniciarActivacion = output<ReiniciarActivacionPayload>();

  readonly accionActiva = signal<AccionActiva>('ninguna');
  readonly motivo = signal('');
  readonly destinatario = signal('');
  readonly montoDinamico = signal<number | null>(null);

  readonly canalEtiqueta = CANAL_ETIQUETA;

  readonly estadoCalculado = computed(() => {
    const giftcard = this.giftcard();
    return giftcard ? calcularEstadoGiftcard(giftcard) : null;
  });

  readonly estadoInfo = computed(() => {
    const estado = this.estadoCalculado();
    return estado ? ESTADO_INFO[estado] : null;
  });

  /** % consumido, no % restante — una giftcard agotada gastó el 100% de su monto, la barra debe verse llena. */
  readonly progresoSaldo = computed(() => {
    const giftcard = this.giftcard();
    if (!giftcard || giftcard.monto <= 0) return 0;
    return Math.round(((giftcard.monto - giftcard.saldo) / giftcard.monto) * 100);
  });

  readonly nombreCampana = computed(() => {
    const giftcard = this.giftcard();
    if (!giftcard?.campanaId) return null;
    return this.campanaService.campanaPorId(giftcard.campanaId)?.nombre ?? null;
  });

  readonly vencimientoCampana = computed(() => {
    const giftcard = this.giftcard();
    if (!giftcard?.campanaId) return null;
    return this.campanaService.campanaPorId(giftcard.campanaId)?.fechaFin ?? null;
  });

  readonly puedeActivar = computed(() => this.estadoCalculado() === 'sin-activar');
  readonly esDinamico = computed(() => this.giftcard()?.tipoMonto === 'dinamico');
  readonly puedeBloquear = computed(() => {
    const estado = this.estadoCalculado();
    return this.sesionService.puedeAdministrarGiftcards() && estado !== null && estado !== 'inactiva' && estado !== 'agotada';
  });
  readonly puedeReiniciarActivacion = computed(() => {
    const estado = this.estadoCalculado();
    return (
      this.sesionService.puedeAdministrarGiftcards() && this.giftcard()?.fechaActivacion !== null && estado !== 'inactiva' && estado !== 'agotada'
    );
  });

  etiquetaMovimiento(tipo: MovimientoTipo): string {
    return MOVIMIENTO_ETIQUETA[tipo];
  }

  iniciarActivacion(): void {
    this.accionActiva.set('activar');
  }

  iniciarBloqueo(): void {
    this.accionActiva.set('bloquear');
  }

  cancelarAccion(): void {
    this.accionActiva.set('ninguna');
    this.motivo.set('');
    this.destinatario.set('');
    this.montoDinamico.set(null);
  }

  confirmarActivacion(): void {
    const giftcard = this.giftcard();
    if (!giftcard || !this.destinatario().trim() || (this.esDinamico() && !this.montoDinamico())) return;
    this.activar.emit({
      giftcardId: giftcard.id,
      destinatario: this.destinatario().trim(),
      monto: this.esDinamico() ? this.montoDinamico()! : undefined,
    });
    this.cerrar();
  }

  confirmarBloqueo(): void {
    const giftcard = this.giftcard();
    if (!giftcard || !this.motivo().trim()) return;
    this.bloquear.emit({ giftcardId: giftcard.id, motivo: this.motivo().trim() });
    this.cerrar();
  }

  confirmarReiniciarActivacion(): void {
    const giftcard = this.giftcard();
    if (!giftcard) return;
    this.reiniciarActivacion.emit({ giftcardId: giftcard.id });
    this.cerrar();
  }

  cerrar(): void {
    this.visible.set(false);
    this.accionActiva.set('ninguna');
    this.motivo.set('');
    this.destinatario.set('');
    this.montoDinamico.set(null);
  }
}
