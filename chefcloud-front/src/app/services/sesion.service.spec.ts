import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SesionService } from './sesion.service';

describe('SesionService', () => {
  let sesionService: SesionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    sesionService = TestBed.inject(SesionService);
  });

  it('arranca no autenticado', () => {
    expect(sesionService.autenticado()).toBe(false);
  });

  it('iniciarSesion marca autenticado en true', () => {
    sesionService.iniciarSesion();
    expect(sesionService.autenticado()).toBe(true);
  });

  it('entrarComo cambia el rol y el nombre de usuario activos', () => {
    sesionService.entrarComo('marketing', 'Marketing Demo');
    expect(sesionService.rol()).toBe('marketing');
    expect(sesionService.nombreUsuarioActual()).toBe('Marketing Demo');
  });
});
