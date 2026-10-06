import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ConfirmationService } from 'primeng/api';
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
    await TestBed.configureTestingModule({ imports: [CartaDetailHeader], providers: [ConfirmationService] }).compileComponents();
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

  it('publicar llama a CartaService.publicar', () => {
    fixture.componentInstance.publicar();
    expect(cartaService.cartas().find((c) => c.id === cartaId)?.estado).toBe('publicada');
  });
});
