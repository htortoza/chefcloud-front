import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CartaDetailHeader } from './carta-detail-header';
import { CartaService } from '../../../services/carta.service';
import { EditableTextField } from '../../shared/editable-text-field/editable-text-field';

describe('CartaDetailHeader', () => {
  let fixture: ComponentFixture<CartaDetailHeader>;
  let cartaService: CartaService;
  let cartaId: string;

  function refrescarInput() {
    fixture.componentRef.setInput('carta', cartaService.cartas().find((c) => c.id === cartaId));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CartaDetailHeader] }).compileComponents();
    cartaService = TestBed.inject(CartaService);
    cartaId = cartaService.crear('Carta de prueba');
    fixture = TestBed.createComponent(CartaDetailHeader);
    refrescarInput();
  });

  it('guardarNombre persiste el nombre en CartaService', () => {
    fixture.componentInstance.guardarNombre('Menú Renombrado');
    expect(cartaService.cartas().find((c) => c.id === cartaId)?.nombre).toBe('Menú Renombrado');
  });

  it('guardarDescripcion persiste la descripción en CartaService', () => {
    fixture.componentInstance.guardarDescripcion('Nueva descripción');
    expect(cartaService.cartas().find((c) => c.id === cartaId)?.descripcionInterna).toBe('Nueva descripción');
  });

  it('el campo de nombre exige valor no vacío (requerido), el de descripción no', () => {
    const [campoNombre, campoDescripcion] = fixture.debugElement.queryAll(By.directive(EditableTextField));
    expect(campoNombre.componentInstance.requerido()).toBe(true);
    expect(campoDescripcion.componentInstance.requerido()).toBe(false);
  });

  it('resumenVigencia muestra "Regular" por defecto', () => {
    expect(fixture.componentInstance.resumenVigencia()).toBe('Regular');
  });

  it('confirmarVigencia con tipo fecha-especial guarda tipoVigencia, rangoFechas y franjaEspecial juntos', () => {
    fixture.componentInstance.iniciarEdicionVigencia();
    fixture.componentInstance.tipoVigenciaBorrador.set('fecha-especial');
    fixture.componentInstance.rangoDesdeBorrador.set('2026-09-18');
    fixture.componentInstance.rangoHastaBorrador.set('2026-09-19');
    fixture.componentInstance.franjaEspecialBorrador.set('almuerzo');
    fixture.componentInstance.confirmarVigencia();

    const carta = cartaService.cartas().find((c) => c.id === cartaId)!;
    expect(carta.tipoVigencia).toBe('fecha-especial');
    expect(carta.rangoFechas).toEqual({ desde: '2026-09-18', hasta: '2026-09-19' });
    expect(carta.franjaEspecial).toBe('almuerzo');
    expect(fixture.componentInstance.editandoVigencia()).toBe(false);
  });

  it('volver a "regular" y confirmar limpia rangoFechas y franjaEspecial', () => {
    fixture.componentInstance.iniciarEdicionVigencia();
    fixture.componentInstance.tipoVigenciaBorrador.set('fecha-especial');
    fixture.componentInstance.rangoDesdeBorrador.set('2026-09-18');
    fixture.componentInstance.rangoHastaBorrador.set('2026-09-19');
    fixture.componentInstance.confirmarVigencia();
    refrescarInput();

    fixture.componentInstance.iniciarEdicionVigencia();
    fixture.componentInstance.tipoVigenciaBorrador.set('regular');
    fixture.componentInstance.confirmarVigencia();

    const carta = cartaService.cartas().find((c) => c.id === cartaId)!;
    expect(carta.tipoVigencia).toBe('regular');
    expect(carta.rangoFechas).toBeUndefined();
    expect(carta.franjaEspecial).toBeUndefined();
  });

  it('publicar llama a CartaService.publicar', () => {
    fixture.componentInstance.publicar();
    expect(cartaService.cartas().find((c) => c.id === cartaId)?.estado).toBe('publicada');
  });
});
