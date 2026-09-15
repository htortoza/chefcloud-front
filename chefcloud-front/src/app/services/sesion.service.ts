import { Injectable, computed, signal } from '@angular/core';
import { Rol } from '../data/roles.model';

interface SesionState {
  rol: Rol;
  nombreUsuario: string;
}

const SESION_INICIAL: SesionState = {
  rol: 'administrador',
  nombreUsuario: 'Administrador',
};

// No hay sistema de autenticación aún — esta sesión se simula desde el selector de rol del sidebar.
@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly _sesion = signal<SesionState>(SESION_INICIAL);
  private readonly _autenticado = signal(false);

  readonly autenticado = this._autenticado.asReadonly();
  readonly rol = computed(() => this._sesion().rol);
  readonly nombreUsuarioActual = computed(() => this._sesion().nombreUsuario);

  entrarComo(rol: Rol, nombreUsuario: string): void {
    this._sesion.set({ rol, nombreUsuario });
  }

  iniciarSesion(): void {
    this._autenticado.set(true);
  }

  cerrarSesion(): void {
    this._autenticado.set(false);
  }
}
