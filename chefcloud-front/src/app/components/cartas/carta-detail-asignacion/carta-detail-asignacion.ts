import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Checkbox } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { Message } from 'primeng/message';
import { CartaService } from '../../../services/carta.service';
import { Carta } from '../../../data/cartas.model';

@Component({
  selector: 'app-carta-detail-asignacion',
  imports: [FormsModule, Checkbox, Message],
  templateUrl: './carta-detail-asignacion.html',
  styleUrl: './carta-detail-asignacion.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartaDetailAsignacion {
  private readonly cartaService = inject(CartaService);

  readonly carta = input.required<Carta>();
  readonly tiendas = this.cartaService.tiendas;
  readonly mensajeConflicto = signal<string | null>(null);

  readonly idsAsignados = computed(() => this.cartaService.tiendasAsignadas(this.carta().id).map((t) => t.id));

  estaAsignada(tiendaId: string): boolean {
    return this.idsAsignados().includes(tiendaId);
  }

  toggleTienda(tiendaId: string): void {
    this.mensajeConflicto.set(null);
    if (this.estaAsignada(tiendaId)) {
      this.cartaService.desasignar(this.carta().id, tiendaId);
      return;
    }
    const resultado = this.cartaService.asignar(this.carta().id, tiendaId);
    if (!resultado.ok) {
      this.mensajeConflicto.set(resultado.conflicto);
    }
  }
}
