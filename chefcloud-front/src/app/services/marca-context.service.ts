import { Injectable, signal } from '@angular/core';
import { Marca } from '../data/marca.model';

// Organización comercial (Empresas/Marcas/Locales con pantalla propia) queda fuera de este ciclo —
// una sola marca mock activa, sin selector, hasta que ese módulo se construya.
const MARCA_MOCK: Marca = {
  id: 'marca-1',
  nombre: 'ChefCloud Demo',
  dominio: 'demo.chefcloud.app',
};

@Injectable({ providedIn: 'root' })
export class MarcaContextService {
  private readonly _marcaActiva = signal<Marca>(MARCA_MOCK);
  readonly marcaActiva = this._marcaActiva.asReadonly();
}
