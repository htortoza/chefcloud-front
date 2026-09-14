import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GiftcardList } from './giftcard-list';
import { SesionService } from '../../../services/sesion.service';

describe('GiftcardList — gating de creación por rol', () => {
  let fixture: ComponentFixture<GiftcardList>;
  let sesionService: SesionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [GiftcardList] }).compileComponents();
    fixture = TestBed.createComponent(GiftcardList);
    sesionService = TestBed.inject(SesionService);
  });

  it('usuario-pos no ve el botón "Crear giftcard"', () => {
    sesionService.entrarComoInterno('usuario-pos', 'empresa-1a', 'Vendedor Providencia');
    fixture.detectChanges();
    const boton = fixture.nativeElement.querySelector('.filtro-crear');
    expect(boton).toBeNull();
  });

  it('administrador-holding sí ve el botón "Crear giftcard"', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    fixture.detectChanges();
    const boton = fixture.nativeElement.querySelector('.filtro-crear');
    expect(boton).not.toBeNull();
  });
});
