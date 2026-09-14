import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { rolRedirectGuard } from './rol-redirect.guard';
import { soloInternoGuard } from './solo-interno.guard';
import { soloAdministradorHoldingGuard } from './solo-administrador-holding.guard';
import { soloCompradorExternoGuard } from './solo-comprador-externo.guard';
import { SesionService } from '../services/sesion.service';

describe('Guards de gobernanza', () => {
  let sesionService: SesionService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    sesionService = TestBed.inject(SesionService);
    router = TestBed.inject(Router);
  });

  it('rolRedirectGuard manda a /giftcards para roles internos', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    const resultado = TestBed.runInInjectionContext(() => rolRedirectGuard({} as any, {} as any)) as UrlTree;
    expect(router.serializeUrl(resultado)).toBe('/giftcards');
  });

  it('rolRedirectGuard manda a /mi-lote para comprador externo', () => {
    sesionService.entrarComoCompradorExterno('acceso-1', 'DOT Solutions');
    const resultado = TestBed.runInInjectionContext(() => rolRedirectGuard({} as any, {} as any)) as UrlTree;
    expect(router.serializeUrl(resultado)).toBe('/mi-lote');
  });

  it('soloInternoGuard bloquea a comprador externo y lo manda a /mi-lote', () => {
    sesionService.entrarComoCompradorExterno('acceso-1', 'DOT Solutions');
    const resultado = TestBed.runInInjectionContext(() => soloInternoGuard({} as any, {} as any)) as UrlTree;
    expect(router.serializeUrl(resultado)).toBe('/mi-lote');
  });

  it('soloInternoGuard deja pasar a roles internos', () => {
    sesionService.entrarComoInterno('usuario-pos', 'empresa-1a', 'Vendedor Providencia');
    expect(TestBed.runInInjectionContext(() => soloInternoGuard({} as any, {} as any))).toBe(true);
  });

  it('soloAdministradorHoldingGuard bloquea a quien no es administrador-holding', () => {
    sesionService.entrarComoInterno('administrador-tienda', 'empresa-1a', 'Admin Providencia');
    const resultado = TestBed.runInInjectionContext(() => soloAdministradorHoldingGuard({} as any, {} as any)) as UrlTree;
    expect(router.serializeUrl(resultado)).toBe('/giftcards');
  });

  it('soloAdministradorHoldingGuard deja pasar a administrador-holding', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    expect(TestBed.runInInjectionContext(() => soloAdministradorHoldingGuard({} as any, {} as any))).toBe(true);
  });

  it('soloCompradorExternoGuard bloquea a roles internos', () => {
    sesionService.entrarComoInterno('master', 'empresa-1', 'Master');
    const resultado = TestBed.runInInjectionContext(() => soloCompradorExternoGuard({} as any, {} as any)) as UrlTree;
    expect(router.serializeUrl(resultado)).toBe('/giftcards');
  });
});
