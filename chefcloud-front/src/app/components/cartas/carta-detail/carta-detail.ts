import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { CartaService } from '../../../services/carta.service';
import { CartaDetailHeader } from '../carta-detail-header/carta-detail-header';
import { CartaDetailEstructura } from '../carta-detail-estructura/carta-detail-estructura';
import { CartaDetailAsignacion } from '../carta-detail-asignacion/carta-detail-asignacion';
import { CartaDetailExperiencias } from '../carta-detail-experiencias/carta-detail-experiencias';

@Component({
  selector: 'app-carta-detail',
  imports: [
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    CartaDetailHeader,
    CartaDetailEstructura,
    CartaDetailAsignacion,
    CartaDetailExperiencias,
  ],
  templateUrl: './carta-detail.html',
  styleUrl: './carta-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartaDetail {
  private readonly cartaService = inject(CartaService);

  readonly id = input.required<string>();
  readonly carta = computed(() => this.cartaService.cartas().find((c) => c.id === this.id()));
}
