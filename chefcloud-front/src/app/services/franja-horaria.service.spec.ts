import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FranjaHorariaService } from './franja-horaria.service';
import { FRANJA_GENERAL_ID } from '../data/cartas.model';

describe('FranjaHorariaService', () => {
  let service: FranjaHorariaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FranjaHorariaService);
  });

  it('"General" existe, es la primera y no tiene horas (vigente todo el día)', () => {
    const [primera] = service.franjas();
    expect(primera.id).toBe(FRANJA_GENERAL_ID);
    expect(primera.nombre).toBe('General');
    expect(primera.horaInicio).toBeNull();
    expect(primera.horaFin).toBeNull();
  });

  it('trae franjas reutilizables además de General (Desayuno, Almuerzo, Cena)', () => {
    const nombres = service.franjas().map((f) => f.nombre);
    expect(nombres).toContain('Desayuno');
    expect(nombres).toContain('Almuerzo');
    expect(nombres).toContain('Cena');
  });

  it('obtenerPorId resuelve una franja existente y undefined si no existe', () => {
    const almuerzo = service.franjas().find((f) => f.nombre === 'Almuerzo')!;
    expect(service.obtenerPorId(almuerzo.id)).toEqual(almuerzo);
    expect(service.obtenerPorId('no-existe')).toBeUndefined();
  });

  it('crear agrega una franja nueva sin horario personalizado', () => {
    const id = service.crear('Merienda');
    const franja = service.obtenerPorId(id)!;
    expect(franja.nombre).toBe('Merienda');
    expect(franja.horaInicio).toBeNull();
    expect(franja.horaFin).toBeNull();
  });

  it('actualizar cambia nombre y horario personalizado de una franja existente', () => {
    const id = service.crear('Merienda');
    service.actualizar(id, { nombre: 'Once', horaInicio: '17:00', horaFin: '19:00' });
    const franja = service.obtenerPorId(id)!;
    expect(franja.nombre).toBe('Once');
    expect(franja.horaInicio).toBe('17:00');
    expect(franja.horaFin).toBe('19:00');
  });

  it('actualizar puede volver una franja a sin-horario (todo el día) seteando null', () => {
    const id = service.crear('Merienda');
    service.actualizar(id, { horaInicio: '17:00', horaFin: '19:00' });
    service.actualizar(id, { horaInicio: null, horaFin: null });
    const franja = service.obtenerPorId(id)!;
    expect(franja.horaInicio).toBeNull();
    expect(franja.horaFin).toBeNull();
  });

  it('eliminar quita una franja del catálogo', () => {
    const id = service.crear('Merienda');
    service.eliminar(id);
    expect(service.obtenerPorId(id)).toBeUndefined();
  });

  it('eliminar nunca borra "General"', () => {
    service.eliminar(FRANJA_GENERAL_ID);
    expect(service.obtenerPorId(FRANJA_GENERAL_ID)).toBeDefined();
  });
});
