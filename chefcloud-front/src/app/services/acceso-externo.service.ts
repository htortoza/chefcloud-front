import { Injectable, computed, inject, signal } from '@angular/core';
import { AccesoExterno, ActualizarAccesoExternoPayload, CrearAccesoExternoPayload, OtorgarRecursoPayload, recursoVigente } from '../data/governance.model';
import { EmpresaService } from './empresa.service';
import { SesionService } from './sesion.service';

const MOCK_ACCESOS_EXTERNOS: AccesoExterno[] = [
  {
    id: 'acceso-externo-1',
    nombre: 'Falabella Retail',
    email: 'compras@falabella.com',
    empresaVendedoraId: 'empresa-1',
    recursos: [{ tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2026-12-31' }],
  },
  {
    id: 'acceso-externo-2',
    nombre: 'Cencosud B2B',
    email: 'b2b@cencosud.com',
    empresaVendedoraId: 'empresa-1',
    recursos: [{ tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2026-01-15' }],
  },
];

@Injectable({ providedIn: 'root' })
export class AccesoExternoService {
  private readonly empresaService = inject(EmpresaService);
  private readonly sesionService = inject(SesionService);
  private readonly _accesos = signal<AccesoExterno[]>(MOCK_ACCESOS_EXTERNOS);
  private secuencia = MOCK_ACCESOS_EXTERNOS.length;

  /** Todas las cuentas externas — solo para el selector de sesión de demo, nunca para una vista de negocio. */
  readonly todos = this._accesos.asReadonly();

  /** Cuentas creadas por el holding actualmente activo. */
  readonly accesosDeHoldingActivo = computed(() => {
    const empresa = this.empresaService.empresaActiva();
    if (!empresa) return [];
    const holdingId = empresa.holdingId ?? empresa.id;
    return this._accesos().filter((a) => a.empresaVendedoraId === holdingId);
  });

  /** Recursos no vencidos de la cuenta externa con sesión activa. */
  readonly recursosVigentesDeSesion = computed(() => {
    const accesoId = this.sesionService.accesoExternoId();
    if (!accesoId) return [];
    const acceso = this._accesos().find((a) => a.id === accesoId);
    if (!acceso) return [];
    const hoy = new Date().toISOString().slice(0, 10);
    return acceso.recursos.filter((r) => recursoVigente(r, hoy));
  });

  /** Busca sin importar mayúsculas/espacios — el correo es el identificador de login de la cuenta. */
  buscarPorEmail(email: string): AccesoExterno | null {
    const normalizado = email.trim().toLowerCase();
    return this._accesos().find((a) => a.email.toLowerCase() === normalizado) ?? null;
  }

  /** Si el correo ya tiene una cuenta, el recurso se agrega a esa cuenta en vez de duplicar (es el mismo comprador). */
  crear(payload: CrearAccesoExternoPayload): void {
    const existente = this.buscarPorEmail(payload.email);
    if (existente) {
      this.otorgarRecurso({ accesoExternoId: existente.id, recurso: payload.recurso });
      return;
    }

    const empresa = this.empresaService.empresaActiva();
    if (!empresa) return;

    this.secuencia += 1;
    const holdingId = empresa.holdingId ?? empresa.id;
    const acceso: AccesoExterno = {
      id: `acceso-externo-${this.secuencia}`,
      nombre: payload.nombre,
      email: payload.email.trim(),
      empresaVendedoraId: holdingId,
      recursos: [payload.recurso],
    };
    this._accesos.update((lista) => [acceso, ...lista]);
  }

  /** No permite tomar el correo de otra cuenta ya existente — el correo es el identificador de login. */
  actualizar(payload: ActualizarAccesoExternoPayload): void {
    const emailNormalizado = payload.email.trim().toLowerCase();
    const colision = this._accesos().find((a) => a.id !== payload.id && a.email.toLowerCase() === emailNormalizado);
    if (colision) return;

    this._accesos.update((lista) =>
      lista.map((a) => (a.id === payload.id ? { ...a, nombre: payload.nombre.trim(), email: payload.email.trim() } : a)),
    );
  }

  otorgarRecurso(payload: OtorgarRecursoPayload): void {
    this._accesos.update((lista) =>
      lista.map((a) => (a.id === payload.accesoExternoId ? { ...a, recursos: [...a.recursos, payload.recurso] } : a)),
    );
  }
}
