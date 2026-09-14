import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { autenticadoGuard } from './autenticado.guard';
import { SesionService } from '../services/sesion.service';

describe('autenticadoGuard', () => {
  let sesionService: SesionService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    sesionService = TestBed.inject(SesionService);
    router = TestBed.inject(Router);
  });

  it('redirige a /login si no hay sesión iniciada', () => {
    const resultado = TestBed.runInInjectionContext(() => autenticadoGuard({} as any, {} as any)) as UrlTree;
    expect(router.serializeUrl(resultado)).toBe('/login');
  });

  it('deja pasar si la sesión ya fue iniciada', () => {
    sesionService.iniciarSesion();
    expect(TestBed.runInInjectionContext(() => autenticadoGuard({} as any, {} as any))).toBe(true);
  });
});
