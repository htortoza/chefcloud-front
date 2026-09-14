import { Injectable, computed, inject, signal } from '@angular/core';
import { Empresa } from '../data/giftcard.model';
import { Modulo } from '../data/shell.model';
import { SesionService } from './sesion.service';

const MOCK_EMPRESAS: Empresa[] = [
  { id: 'empresa-1', nombre: 'Italmod', holdingId: null },
  { id: 'empresa-1a', nombre: 'Italmod Providencia', holdingId: 'empresa-1' },
  { id: 'empresa-1b', nombre: 'Italmod Ñuñoa', holdingId: 'empresa-1' },
  { id: 'empresa-2', nombre: 'Autoplanet', holdingId: null },
];

/** Motor de Promociones es el único módulo raíz — Giftcards es una parte de él, no un módulo paralelo. */
const MOTOR_PROMOCIONES: Modulo = {
  clave: 'motor-promociones',
  etiqueta: 'Motor de Promociones',
  empresasHabilitadas: ['empresa-1', 'empresa-1a', 'empresa-1b'],
  submodulos: [
    { clave: 'giftcards', etiqueta: 'Giftcards', icono: 'pi pi-credit-card', ruta: '/giftcards', implementado: true },
    { clave: 'promociones', etiqueta: 'Promociones', icono: 'pi pi-percentage', ruta: '/promociones', implementado: false },
  ],
};

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly sesionService = inject(SesionService);
  private readonly _empresas = signal<Empresa[]>(MOCK_EMPRESAS);
  private readonly _empresaActivaId = signal<string>(MOCK_EMPRESAS[0].id);
  private readonly _cambiandoContexto = signal(false);

  readonly empresas = this._empresas.asReadonly();
  readonly cambiandoContexto = this._cambiandoContexto.asReadonly();
  readonly modulo = MOTOR_PROMOCIONES;

  /** Empresas que la sesión activa puede seleccionar, según su rol y alcance. */
  readonly empresasVisibles = computed<Empresa[]>(() => {
    const rol = this.sesionService.rol();
    const empresaId = this.sesionService.empresaId();
    const todas = this._empresas();

    if (rol === 'master') return todas;
    if (rol === 'comprador-externo') return [];
    if (!empresaId) return [];

    if (rol === 'administrador-holding') {
      const holding = todas.find((e) => e.id === empresaId);
      if (!holding) return [];
      return [holding, ...todas.filter((e) => e.holdingId === holding.id)];
    }

    // administrador-tienda / usuario-pos: acotado a su propia tienda.
    const propia = todas.find((e) => e.id === empresaId);
    return propia ? [propia] : [];
  });

  readonly empresaActiva = computed<Empresa | null>(() => {
    const visibles = this.empresasVisibles();
    if (visibles.length === 0) return null;
    const activaId = this._empresaActivaId();
    return visibles.find((e) => e.id === activaId) ?? visibles[0];
  });

  readonly moduloHabilitadoParaEmpresa = computed(() => {
    const activa = this.empresaActiva();
    return activa !== null && this.modulo.empresasHabilitadas.includes(activa.id);
  });

  /** Empresas incluidas en la vista actual: agregado (holding + tiendas) si la activa es un holding, acotado a una sola tienda si no. */
  readonly empresasIncluidasEnVistaActiva = computed<string[]>(() => {
    const activa = this.empresaActiva();
    if (!activa) return [];
    if (activa.holdingId === null) {
      return [activa.id, ...this._empresas().filter((e) => e.holdingId === activa.id).map((e) => e.id)];
    }
    return [activa.id];
  });

  cambiarEmpresa(empresaId: string): void {
    this._cambiandoContexto.set(true);
    this._empresaActivaId.set(empresaId);
    setTimeout(() => this._cambiandoContexto.set(false), 500);
  }
}
