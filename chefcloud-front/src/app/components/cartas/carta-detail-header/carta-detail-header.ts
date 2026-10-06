import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { ConfirmationService } from 'primeng/api';
import { CartaService } from '../../../services/carta.service';
import { Canal, Carta } from '../../../data/cartas.model';
import { EditableTextField } from '../../shared/editable-text-field/editable-text-field';

@Component({
  selector: 'app-carta-detail-header',
  imports: [FormsModule, Button, EditableTextField],
  templateUrl: './carta-detail-header.html',
  styleUrl: './carta-detail-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartaDetailHeader {
  private readonly cartaService = inject(CartaService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly carta = input.required<Carta>();

  readonly canales = this.cartaService.canales;

  /** Badge por canal: verde si todos los productos de la carta están activos en ese canal, gris
   * en cualquier otro caso (pausado, error, o sin productos) — vistazo rápido junto a "Publicar",
   * reemplaza la barra "Estado global" que antes vivía arriba del listado en Estructura. */
  readonly estadoCanales = computed(() => {
    const c = this.carta();
    const ids = c.secciones.flatMap((s) => s.items.map((i) => i.productoId));
    return this.canales().map((canal) => {
      const estados = ids.map((pid) => this.cartaService.estadoCanal(c.id, canal.id, pid)?.estado ?? 'activo');
      const publicado = estados.length > 0 && estados.every((e) => e === 'activo');
      return { canal, publicado };
    });
  });

  guardarNombre(valor: string): void {
    this.cartaService.actualizarGeneral(this.carta().id, { nombre: valor });
  }

  guardarDescripcion(valor: string): void {
    this.cartaService.actualizarGeneral(this.carta().id, { descripcionInterna: valor });
  }

  publicar(): void {
    this.cartaService.publicar(this.carta().id);
  }

  /** Pausar/activar TODOS los productos de la carta en un canal, desde el badge — acción masiva
   * y destructiva para el canal entero (no por producto), siempre con confirmación explícita
   * antes de aplicarla. */
  confirmarCambioEstadoCanal(item: { canal: Canal; publicado: boolean }): void {
    const nuevoEstado = item.publicado ? 'pausado' : 'activo';
    const verbo = item.publicado ? 'pausar' : 'activar';
    this.confirmationService.confirm({
      header: `${item.publicado ? 'Pausar' : 'Activar'} ${item.canal.nombre}`,
      message: `Vas a ${verbo} TODOS los productos de "${this.carta().nombre}" en ${item.canal.nombre}. Afecta a todas las secciones de esta carta en ese canal. ¿Continuar?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: item.publicado ? 'Pausar todo' : 'Activar todo',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: item.publicado ? 'danger' : 'success' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => {
        const c = this.carta();
        const ids = c.secciones.flatMap((s) => s.items.map((i) => i.productoId));
        ids.forEach((productoId) => this.cartaService.setEstadoOperativo(c.id, item.canal.id, productoId, nuevoEstado));
      },
    });
  }
}
