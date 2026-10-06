import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { rolRedirectGuard } from './rol-redirect.guard';
import { SesionService } from '../services/sesion.service';

describe('rolRedirectGuard', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    TestBed.inject(SesionService);
    router = TestBed.inject(Router);
  });

  it('manda siempre a /cartas para cualquier sesión autenticada', () => {
    const resultado = TestBed.runInInjectionContext(() => rolRedirectGuard({} as any, {} as any)) as UrlTree;
    expect(router.serializeUrl(resultado)).toBe('/cartas');
  });
});
