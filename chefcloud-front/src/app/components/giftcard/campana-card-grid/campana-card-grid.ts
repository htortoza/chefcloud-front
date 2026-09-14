import { ChangeDetectionStrategy, Component, computed, effect, inject, output, signal, untracked } from '@angular/core';
import { Card } from 'primeng/card';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Skeleton } from 'primeng/skeleton';
import { ConfirmPopup } from 'primeng/confirmpopup';
import { ConfirmationService } from 'primeng/api';
import { CampanaService } from '../../../services/campana.service';
import { SesionService } from '../../../services/sesion.service';
import { CrearCampanaPayload, EstadisticasCampana } from '../../../data/giftcard.model';
import { CampanaCreateModal } from '../campana-create-modal/campana-create-modal';
import { PageHeader } from '../../shared/page-header/page-header';

const DURACION_CARGA_MS = 450;

@Component({
  selector: 'app-campana-card-grid',
  imports: [Card, Button, Tag, Skeleton, ConfirmPopup, CampanaCreateModal, PageHeader],
  templateUrl: './campana-card-grid.html',
  styleUrl: './campana-card-grid.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampanaCardGrid {
  private readonly campanaService = inject(CampanaService);
  private readonly confirmationService = inject(ConfirmationService);
  readonly sesionService = inject(SesionService);

  readonly abrirCampana = output<string>();

  readonly modalCrearVisible = signal(false);
  readonly verArchivadas = signal(false);
  readonly cargando = signal(true);

  readonly estadisticas = computed(() => (this.verArchivadas() ? this.campanaService.estadisticasArchivadas() : this.campanaService.estadisticasActivas()));

  readonly placeholdersCarga = Array.from({ length: 3 });

  constructor() {
    effect(() => {
      this.verArchivadas();
      untracked(() => this.simularCarga());
    });
  }

  private simularCarga(): void {
    this.cargando.set(true);
    setTimeout(() => this.cargando.set(false), DURACION_CARGA_MS);
  }

  abrir(campanaId: string): void {
    this.abrirCampana.emit(campanaId);
  }

  confirmarArchivar(event: Event, stat: EstadisticasCampana): void {
    event.stopPropagation();
    const advertencia =
      stat.sinActivar > 0 ? `Hay ${stat.sinActivar} código${stat.sinActivar === 1 ? '' : 's'} sin activar en esta campaña. ` : '';
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: `${advertencia}¿Archivar "${stat.campana.nombre}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Archivar',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger', size: 'small' },
      rejectButtonProps: { severity: 'secondary', size: 'small', outlined: true },
      accept: () => this.campanaService.archivar(stat.campana.id),
    });
  }

  crearCampana(payload: CrearCampanaPayload): void {
    this.campanaService.crear(payload);
  }
}
