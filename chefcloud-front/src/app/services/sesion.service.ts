import { Injectable, computed, signal } from '@angular/core';
import { Rol } from '../data/governance.model';

interface SesionState {
  rol: Rol;
  empresaId: string | null;
  accesoExternoId: string | null;
  nombreUsuario: string;
}

const SESION_INICIAL: SesionState = {
  rol: 'administrador-holding',
  empresaId: 'empresa-1',
  accesoExternoId: null,
  nombreUsuario: 'Administrador',
};

const ROLES_ADMINISTRADORES: Rol[] = ['master', 'administrador-holding', 'administrador-tienda'];

// No hay sistema de autenticación aún — esta sesión se simula desde el selector de rol del BackOffice.
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly _sesion = signal<SesionState>(SESION_INICIAL);
  private readonly _autenticado = signal(false);

  readonly autenticado = this._autenticado.asReadonly();

  readonly rol = computed(() => this._sesion().rol);
  readonly empresaId = computed(() => this._sesion().empresaId);
  readonly accesoExternoId = computed(() => this._sesion().accesoExternoId);
  readonly nombreUsuarioActual = computed(() => this._sesion().nombreUsuario);

  readonly esCompradorExterno = computed(() => this.rol() === 'comprador-externo');
  readonly puedeAdministrarGiftcards = computed(() => ROLES_ADMINISTRADORES.includes(this.rol()));
  readonly puedeCrearAccesoExterno = computed(() => this.rol() === 'administrador-holding');

  entrarComoInterno(rol: Exclude<Rol, 'comprador-externo'>, empresaId: string, nombreUsuario: string): void {
    this._sesion.set({ rol, empresaId, accesoExternoId: null, nombreUsuario });
  }

  entrarComoCompradorExterno(accesoExternoId: string, nombreUsuario: string): void {
    this._sesion.set({ rol: 'comprador-externo', empresaId: null, accesoExternoId, nombreUsuario });
  }

  iniciarSesion(): void {
    this._autenticado.set(true);
  }
}
