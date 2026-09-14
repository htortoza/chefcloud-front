import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SesionService } from './sesion.service';

describe('SesionService', () => {
  let service: SesionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SesionService);
  });

  it('arranca como administrador-holding de empresa-1', () => {
    expect(service.rol()).toBe('administrador-holding');
    expect(service.empresaId()).toBe('empresa-1');
    expect(service.puedeAdministrarGiftcards()).toBe(true);
    expect(service.puedeCrearAccesoExterno()).toBe(true);
  });

  it('usuario-pos no puede administrar giftcards ni crear accesos externos', () => {
    service.entrarComoInterno('usuario-pos', 'empresa-1a', 'Vendedor Providencia');
    expect(service.rol()).toBe('usuario-pos');
    expect(service.nombreUsuarioActual()).toBe('Vendedor Providencia');
    expect(service.puedeAdministrarGiftcards()).toBe(false);
    expect(service.puedeCrearAccesoExterno()).toBe(false);
  });

  it('administrador-tienda puede administrar giftcards pero no crear accesos externos', () => {
    service.entrarComoInterno('administrador-tienda', 'empresa-1a', 'Admin Providencia');
    expect(service.puedeAdministrarGiftcards()).toBe(true);
    expect(service.puedeCrearAccesoExterno()).toBe(false);
  });

  it('comprador-externo queda marcado, sin empresaId, con accesoExternoId', () => {
    service.entrarComoCompradorExterno('acceso-1', 'DOT Solutions');
    expect(service.esCompradorExterno()).toBe(true);
    expect(service.empresaId()).toBeNull();
    expect(service.accesoExternoId()).toBe('acceso-1');
    expect(service.puedeAdministrarGiftcards()).toBe(false);
  });

  it('arranca no autenticado, e iniciarSesion() lo marca true', () => {
    expect(service.autenticado()).toBe(false);
    service.iniciarSesion();
    expect(service.autenticado()).toBe(true);
  });
});
