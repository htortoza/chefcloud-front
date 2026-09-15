import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Select } from 'primeng/select';
import { Popover } from 'primeng/popover';
import { SesionService } from '../../../services/sesion.service';
import { Rol } from '../../../data/roles.model';

const OPCIONES_ROL: { label: string; value: Rol }[] = [
  { label: 'Administrador', value: 'administrador' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Operaciones', value: 'operaciones' },
  { label: 'Cocina / POS', value: 'cocina-pos' },
  { label: 'Consultor', value: 'consultor' },
];

const NOMBRE_POR_ROL: Record<Rol, string> = {
  administrador: 'Administrador',
  marketing: 'Marketing',
  operaciones: 'Operaciones',
  'cocina-pos': 'Cocina / POS',
  consultor: 'Consultor',
};

@Component({
  selector: 'app-sesion-switcher',
  imports: [FormsModule, Select, Popover],
  templateUrl: './sesion-switcher.html',
  styleUrl: './sesion-switcher.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SesionSwitcher {
  private readonly sesionService = inject(SesionService);
  private readonly router = inject(Router);

  private readonly panelRol = viewChild<Popover>('panelRol');

  readonly opcionesRol = OPCIONES_ROL;
  readonly rolActual = computed(() => this.sesionService.rol());
  readonly etiquetaRolActual = computed(() => this.opcionesRol.find((o) => o.value === this.rolActual())?.label ?? '');

  cambiarRol(rol: Rol): void {
    this.sesionService.entrarComo(rol, NOMBRE_POR_ROL[rol]);
    // Los guards de ruta solo se evalúan en navegación — sin esto, cambiar de rol en la misma pantalla no reubica al usuario.
    this.router.navigateByUrl('/');
    this.panelRol()?.hide();
  }
}
