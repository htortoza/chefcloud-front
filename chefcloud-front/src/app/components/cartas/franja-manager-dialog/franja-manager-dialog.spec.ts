import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FranjaManagerDialog } from './franja-manager-dialog';
import { FranjaHorariaService } from '../../../services/franja-horaria.service';
import { FRANJA_GENERAL_ID } from '../../../data/cartas.model';

describe('FranjaManagerDialog', () => {
  let fixture: ComponentFixture<FranjaManagerDialog>;
  let franjaHorariaService: FranjaHorariaService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FranjaManagerDialog] }).compileComponents();
    franjaHorariaService = TestBed.inject(FranjaHorariaService);
    fixture = TestBed.createComponent(FranjaManagerDialog);
    fixture.detectChanges();
  });

  it('esGeneral distingue "General" del resto', () => {
    expect(fixture.componentInstance.esGeneral(FRANJA_GENERAL_ID)).toBe(true);
    expect(fixture.componentInstance.esGeneral('franja-almuerzo')).toBe(false);
  });

  it('tieneHorario es true solo cuando ambas horas están seteadas', () => {
    const almuerzo = franjaHorariaService.franjas().find((f) => f.nombre === 'Almuerzo')!;
    const general = franjaHorariaService.franjas().find((f) => f.id === FRANJA_GENERAL_ID)!;
    expect(fixture.componentInstance.tieneHorario(almuerzo)).toBe(true);
    expect(fixture.componentInstance.tieneHorario(general)).toBe(false);
  });

  it('renombrar persiste el nuevo nombre en el servicio', () => {
    const almuerzo = franjaHorariaService.franjas().find((f) => f.nombre === 'Almuerzo')!;
    fixture.componentInstance.renombrar(almuerzo.id, 'Mediodía');
    expect(franjaHorariaService.obtenerPorId(almuerzo.id)?.nombre).toBe('Mediodía');
  });

  it('toggleHorarioPersonalizado(true) asigna horas por defecto; (false) las limpia', () => {
    const id = franjaHorariaService.crear('Merienda');
    fixture.componentInstance.toggleHorarioPersonalizado(id, true);
    const conHorario = franjaHorariaService.obtenerPorId(id)!;
    expect(conHorario.horaInicio).not.toBeNull();
    expect(conHorario.horaFin).not.toBeNull();

    fixture.componentInstance.toggleHorarioPersonalizado(id, false);
    const sinHorario = franjaHorariaService.obtenerPorId(id)!;
    expect(sinHorario.horaInicio).toBeNull();
    expect(sinHorario.horaFin).toBeNull();
  });

  it('actualizarHoraInicio/actualizarHoraFin editan cada hora de forma independiente', () => {
    const id = franjaHorariaService.crear('Merienda');
    fixture.componentInstance.actualizarHoraInicio(id, '17:00');
    fixture.componentInstance.actualizarHoraFin(id, '19:00');
    const franja = franjaHorariaService.obtenerPorId(id)!;
    expect(franja.horaInicio).toBe('17:00');
    expect(franja.horaFin).toBe('19:00');
  });

  it('agregarFranja crea una franja nueva en el catálogo', () => {
    const antes = franjaHorariaService.franjas().length;
    fixture.componentInstance.agregarFranja();
    expect(franjaHorariaService.franjas().length).toBe(antes + 1);
  });

  it('eliminar quita la franja; "General" nunca se elimina', () => {
    const id = franjaHorariaService.crear('Merienda');
    fixture.componentInstance.eliminar(id);
    expect(franjaHorariaService.obtenerPorId(id)).toBeUndefined();

    fixture.componentInstance.eliminar(FRANJA_GENERAL_ID);
    expect(franjaHorariaService.obtenerPorId(FRANJA_GENERAL_ID)).toBeDefined();
  });

  it('cerrarDialog emite cerrar', () => {
    let emitido = false;
    fixture.componentInstance.cerrar.subscribe(() => (emitido = true));
    fixture.componentInstance.cerrarDialog();
    expect(emitido).toBe(true);
    expect(fixture.componentInstance.visible()).toBe(false);
  });
});
