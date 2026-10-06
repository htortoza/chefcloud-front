import { Injectable, computed, inject, signal } from '@angular/core';
import { FRANJA_GENERAL_ID, FranjaHoraria } from '../data/cartas.model';
import { MarcaContextService } from './marca-context.service';

let contadorId = 0;
function siguienteId(prefijo: string): string {
  contadorId += 1;
  return `${prefijo}-${contadorId}`;
}

const MARCA_ID_MOCK = 'marca-1';

const FRANJAS_SEED: FranjaHoraria[] = [
  { id: FRANJA_GENERAL_ID, marcaId: MARCA_ID_MOCK, nombre: 'General', horaInicio: null, horaFin: null },
  { id: 'franja-desayuno', marcaId: MARCA_ID_MOCK, nombre: 'Desayuno', horaInicio: '07:00', horaFin: '11:00' },
  { id: 'franja-almuerzo', marcaId: MARCA_ID_MOCK, nombre: 'Almuerzo', horaInicio: '12:00', horaFin: '16:00' },
  { id: 'franja-cena', marcaId: MARCA_ID_MOCK, nombre: 'Cena', horaInicio: '19:00', horaFin: '23:00' },
];

@Injectable({ providedIn: 'root' })
export class FranjaHorariaService {
  private readonly marcaContextService = inject(MarcaContextService);
  private readonly _franjas = signal<FranjaHoraria[]>(FRANJAS_SEED);

  /** "General" siempre primera — es la franja no eliminable que representa "todo el día"/"hereda del nivel superior". */
  readonly franjas = computed(() => this._franjas().filter((f) => f.marcaId === this.marcaContextService.marcaActiva().id));

  obtenerPorId(id: string): FranjaHoraria | undefined {
    return this._franjas().find((f) => f.id === id);
  }

  /** Nace sin horario personalizado (como "General") — recién editable después de creada. */
  crear(nombre: string): string {
    const id = siguienteId('franja');
    const nueva: FranjaHoraria = { id, marcaId: this.marcaContextService.marcaActiva().id, nombre, horaInicio: null, horaFin: null };
    this._franjas.update((lista) => [...lista, nueva]);
    return id;
  }

  actualizar(id: string, cambios: Partial<Pick<FranjaHoraria, 'nombre' | 'horaInicio' | 'horaFin'>>): void {
    this._franjas.update((lista) => lista.map((f) => (f.id === id ? { ...f, ...cambios } : f)));
  }

  /** "General" nunca se elimina — es la franja no eliminable que representa "todo el día". */
  eliminar(id: string): void {
    if (id === FRANJA_GENERAL_ID) return;
    this._franjas.update((lista) => lista.filter((f) => f.id !== id));
  }
}
