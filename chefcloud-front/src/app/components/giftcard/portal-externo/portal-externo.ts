import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { PrimeTemplate } from 'primeng/api';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Button } from 'primeng/button';
import { GiftcardService } from '../../../services/giftcard.service';
import { GiftcardEstado, ActivarGiftcardPayload, BloquearGiftcardPayload, Giftcard, ReiniciarActivacionPayload, calcularEstadoGiftcard } from '../../../data/giftcard.model';
import { GiftcardDetailDrawer } from '../giftcard-detail-drawer/giftcard-detail-drawer';
import { PageHeader } from '../../shared/page-header/page-header';

const ESTADO_INFO: Record<GiftcardEstado, { etiqueta: string; severidad: 'success' | 'warn' | 'secondary' }> = {
  'sin-activar': { etiqueta: 'Sin activar', severidad: 'secondary' },
  activa: { etiqueta: 'Activa', severidad: 'success' },
  agotada: { etiqueta: 'Agotada', severidad: 'secondary' },
  inactiva: { etiqueta: 'Inactiva', severidad: 'warn' },
};

@Component({
  selector: 'app-portal-externo',
  imports: [CurrencyPipe, PrimeTemplate, Card, TableModule, Tag, Button, GiftcardDetailDrawer, PageHeader],
  templateUrl: './portal-externo.html',
  styleUrl: './portal-externo.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalExterno {
  private readonly giftcardService = inject(GiftcardService);

  readonly giftcards = this.giftcardService.giftcardsDelAccesoExterno;
  readonly detalleVisible = signal(false);
  readonly giftcardSeleccionada = signal<Giftcard | null>(null);

  estadoInfo(giftcard: Giftcard) {
    return ESTADO_INFO[calcularEstadoGiftcard(giftcard)];
  }

  verDetalle(giftcard: Giftcard): void {
    this.giftcardSeleccionada.set(giftcard);
    this.detalleVisible.set(true);
  }

  activarGiftcard(payload: ActivarGiftcardPayload): void {
    this.giftcardService.activar(payload);
  }

  // El comprador externo nunca puede bloquear ni reiniciar — el drawer ya lo restringe, pero los outputs deben cablearse igual.
  bloquearGiftcard(_payload: BloquearGiftcardPayload): void {}
  reiniciarActivacionGiftcard(_payload: ReiniciarActivacionPayload): void {}
}
