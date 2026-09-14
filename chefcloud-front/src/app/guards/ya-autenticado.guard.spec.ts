import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { yaAutenticadoGuard } from './ya-autenticado.guard';
import { SesionService } from '../services/sesion.service';

describe('yaAutenticadoGuard', () => {
  let sesionService: SesionService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    sesionService = TestBed.inject(SesionService);
    router = TestBed.inject(Router);
  });

  it('redirige a / si la sesión ya estaba autenticada (ej. volver atrás con el browser a /login)', () => {
    sesionService.iniciarSesion();
    const resultado = TestBed.runInInjectionContext(() => yaAutenticadoGuard({} as any, {} as any)) as UrlTree;
    expect(router.serializeUrl(resultado)).toBe('/');
  });

  it('deja pasar a /login si todavía no hay sesión iniciada', () => {
    expect(TestBed.runInInjectionContext(() => yaAutenticadoGuard({} as any, {} as any))).toBe(true);
  });
});
