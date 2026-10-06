import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Dialog } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { PrimeTemplate } from 'primeng/api';
import { AdicionalService } from '../../../services/adicional.service';
import { GrupoAdicional } from '../../../data/adicionales.model';

@Component({
  selector: 'app-adicional-selector-dialog',
  imports: [FormsModule, RouterLink, Dialog, TableModule, InputText, Button, Tag, PrimeTemplate],
  templateUrl: './adicional-selector-dialog.html',
  styleUrl: './adicional-selector-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdicionalSelectorDialog {
  private readonly adicionalService = inject(AdicionalService);

  readonly gruposYaAsociados = input.required<Set<string>>();
  readonly titulo = input('Añadir adicional');
  readonly agregar = output<string[]>();
  readonly cerrar = output<void>();

  readonly visible = signal(true);
  readonly textoBusqueda = signal('');
  readonly seleccionados = signal<GrupoAdicional[]>([]);

  readonly catalogoVacio = computed(() => this.adicionalService.grupos().length === 0);

  readonly gruposFiltrados = computed(() => {
    const busqueda = this.textoBusqueda().trim().toLowerCase();
    if (!busqueda) return this.adicionalService.grupos();
    return this.adicionalService.grupos().filter((g) => g.nombre.toLowerCase().includes(busqueda) || g.titulo.toLowerCase().includes(busqueda));
  });

  estaYaAsociado(grupo: GrupoAdicional): boolean {
    return this.gruposYaAsociados().has(grupo.id);
  }

  /** Vista previa de qué trae el grupo por dentro — para elegir sin tener que abrir cada uno. */
  nombresOpciones(grupo: GrupoAdicional): string {
    if (grupo.opciones.length === 0) return 'Sin opciones todavía';
    return grupo.opciones.map((o) => o.nombre).join(', ');
  }

  /** Excluye del "seleccionar todos" del header los grupos ya asociados — su checkbox de fila está deshabilitado. */
  readonly filaSeleccionable = (fila: { data: GrupoAdicional }): boolean => !this.estaYaAsociado(fila.data);

  confirmarSeleccion(): void {
    this.agregar.emit(this.seleccionados().map((g) => g.id));
    this.seleccionados.set([]);
  }

  cerrarDialog(): void {
    this.visible.set(false);
    this.cerrar.emit();
  }
}
