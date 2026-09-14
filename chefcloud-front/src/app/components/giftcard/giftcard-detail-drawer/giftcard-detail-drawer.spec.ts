import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GiftcardDetailDrawer } from './giftcard-detail-drawer';
import { SesionService } from '../../../services/sesion.service';
import { Giftcard } from '../../../data/giftcard.model';

const GIFTCARD_ACTIVA: Giftcard = {
  id: '1',
  empresaId: 'empresa-1',
  codigo: 'GC-TEST-01',
  tipoMonto: 'fijo',
  canal: 'ambos',
  cliente: 'Cliente Test',
  monto: 10000,
  saldo: 10000,
  sid: 'SID-1',
  vigente: true,
  fechaActivacion: '2026-01-01',
  campanaId: null,
  movimientos: [],
};

const GIFTCARD_SIN_ACTIVAR: Giftcard = { ...GIFTCARD_ACTIVA, id: '2', fechaActivacion: null, cliente: null };

describe('GiftcardDetailDrawer — gating por rol', () => {
  let fixture: ComponentFixture<GiftcardDetailDrawer>;
  let component: GiftcardDetailDrawer;
  let sesionService: SesionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [GiftcardDetailDrawer] }).compileComponents();
    fixture = TestBed.createComponent(GiftcardDetailDrawer);
    component = fixture.componentInstance;
    sesionService = TestBed.inject(SesionService);
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('giftcard', GIFTCARD_ACTIVA);
  });

  it('administrador-holding puede bloquear y reiniciar activación', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    fixture.detectChanges();
    expect(component.puedeBloquear()).toBe(true);
    expect(component.puedeReiniciarActivacion()).toBe(true);
  });

  it('comprador-externo no puede bloquear ni reiniciar activación', () => {
    sesionService.entrarComoCompradorExterno('acceso-1', 'DOT Solutions');
    fixture.detectChanges();
    expect(component.puedeBloquear()).toBe(false);
    expect(component.puedeReiniciarActivacion()).toBe(false);
  });

  it('usuario-pos no puede bloquear ni reiniciar activación', () => {
    sesionService.entrarComoInterno('usuario-pos', 'empresa-1a', 'Vendedor Providencia');
    fixture.detectChanges();
    expect(component.puedeBloquear()).toBe(false);
    expect(component.puedeReiniciarActivacion()).toBe(false);
  });

  it('comprador-externo sí puede activar una giftcard sin activar', () => {
    sesionService.entrarComoCompradorExterno('acceso-1', 'DOT Solutions');
    fixture.componentRef.setInput('giftcard', GIFTCARD_SIN_ACTIVAR);
    fixture.detectChanges();
    expect(component.puedeActivar()).toBe(true);
  });

  it('una giftcard agotada no admite ninguna acción — ya cumplió su ciclo', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    fixture.componentRef.setInput('giftcard', { ...GIFTCARD_ACTIVA, saldo: 0 });
    fixture.detectChanges();
    expect(component.puedeActivar()).toBe(false);
    expect(component.puedeBloquear()).toBe(false);
    expect(component.puedeReiniciarActivacion()).toBe(false);
  });
});
