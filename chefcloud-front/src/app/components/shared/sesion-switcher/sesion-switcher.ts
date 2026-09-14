import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Select } from 'primeng/select';
import { SesionService } from '../../../services/sesion.service';
import { EmpresaService } from '../../../services/empresa.service';
import { AccesoExternoService } from '../../../services/acceso-externo.service';
import { Rol } from '../../../data/governance.model';

const OPCIONES_ROL: { label: string; value: Rol }[] = [
  { label: 'Master', value: 'master' },
  { label: 'Administrador Holding', value: 'administrador-holding' },
  { label: 'Administrador Tienda', value: 'administrador-tienda' },
  { label: 'Usuario POS', value: 'usuario-pos' },
  { label: 'Comprador Externo', value: 'comprador-externo' },
];

@Component({
  selector: 'app-sesion-switcher',
  imports: [FormsModule, Select],
  templateUrl: './sesion-switcher.html',
  styleUrl: './sesion-switcher.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SesionSwitcher {
  private readonly sesionService = inject(SesionService);
  private readonly empresaService = inject(EmpresaService);
  private readonly accesoExternoService = inject(AccesoExternoService);
  private readonly router = inject(Router);

  readonly opcionesRol = OPCIONES_ROL;
  readonly rolActual = computed(() => this.sesionService.rol());
  readonly empresaIdActual = computed(() => this.sesionService.empresaId());
  readonly accesoExternoIdActual = computed(() => this.sesionService.accesoExternoId());

  readonly opcionesHolding = computed(() => this.empresaService.empresas().filter((e) => e.holdingId === null));
  readonly opcionesTienda = computed(() => this.empresaService.empresas().filter((e) => e.holdingId !== null));
  readonly opcionesAccesoExterno = computed(() => this.accesoExternoService.todos());

  cambiarRol(rol: Rol): void {
    if (rol === 'comprador-externo') {
      const primero = this.opcionesAccesoExterno()[0];
      this.sesionService.entrarComoCompradorExterno(primero?.id ?? '', primero?.nombre ?? 'Comprador Externo');
    } else if (rol === 'master' || rol === 'administrador-holding') {
      const primerHolding = this.opcionesHolding()[0];
      this.sesionService.entrarComoInterno(rol, primerHolding?.id ?? '', rol === 'master' ? 'Master' : 'Administrador Holding');
    } else {
      const primeraTienda = this.opcionesTienda()[0];
      this.sesionService.entrarComoInterno(rol, primeraTienda?.id ?? '', rol === 'usuario-pos' ? 'Usuario POS' : 'Administrador Tienda');
    }
    // Los guards de ruta solo se evalúan en navegación — sin esto, cambiar de rol en la misma pantalla no reubica al usuario.
    this.router.navigateByUrl('/');
  }

  cambiarEmpresaSesion(empresaId: string): void {
    const rol = this.sesionService.rol();
    if (rol === 'comprador-externo') return;
    const nombre = this.empresaService.empresas().find((e) => e.id === empresaId)?.nombre ?? '';
    this.sesionService.entrarComoInterno(rol, empresaId, nombre);
  }

  cambiarAccesoExterno(accesoId: string): void {
    const nombre = this.opcionesAccesoExterno().find((a) => a.id === accesoId)?.nombre ?? '';
    this.sesionService.entrarComoCompradorExterno(accesoId, nombre);
  }
}
