import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { PrimeTemplate } from 'primeng/api';
import { PageHeader } from '../../shared/page-header/page-header';
import { AdicionalService } from '../../../services/adicional.service';

@Component({
  selector: 'app-adicional-list',
  imports: [FormsModule, TableModule, Button, InputText, PrimeTemplate, PageHeader],
  templateUrl: './adicional-list.html',
  styleUrl: './adicional-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdicionalList {
  private readonly adicionalService = inject(AdicionalService);
  private readonly router = inject(Router);

  readonly termino = signal('');

  readonly filas = computed(() => {
    const termino = this.termino().trim().toLowerCase();
    return this.adicionalService.grupos().filter((g) => g.nombre.toLowerCase().includes(termino));
  });

  /** Crear = editar (Módulo Adicionales, sección 3) — se crea el borrador y se navega directo a su editor, sin pantalla intermedia. */
  crearGrupo(): void {
    const id = this.adicionalService.crear();
    this.router.navigate(['/adicionales', id]);
  }

  abrirGrupo(grupoId: string): void {
    this.router.navigate(['/adicionales', grupoId]);
  }

  eliminarGrupo(grupoId: string): void {
    if (!window.confirm('¿Eliminar este grupo de adicionales? Esta acción no se puede deshacer.')) return;
    this.adicionalService.eliminar(grupoId);
  }
}
