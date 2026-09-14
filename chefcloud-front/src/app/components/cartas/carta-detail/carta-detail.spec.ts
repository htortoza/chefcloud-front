import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartaDetail } from './carta-detail';
import { CartaService } from '../../../services/carta.service';

// jsdom no implementa ResizeObserver — p-tabs lo usa para el ink bar. Stub mínimo solo para que el componente monte en test.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
(globalThis as any).ResizeObserver ??= ResizeObserverStub;

describe('CartaDetail', () => {
  let fixture: ComponentFixture<CartaDetail>;
  let cartaService: CartaService;
  let cartaId: string;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CartaDetail] }).compileComponents();
    cartaService = TestBed.inject(CartaService);
    cartaId = cartaService.crear('Carta de prueba');
    fixture = TestBed.createComponent(CartaDetail);
    fixture.componentRef.setInput('id', cartaId);
    fixture.detectChanges();
  });

  it('resuelve la carta activa a partir del id de la ruta', () => {
    expect(fixture.componentInstance.carta()?.id).toBe(cartaId);
  });

  it('abre en el tab Estructura por defecto, no General', () => {
    const activo = fixture.nativeElement.querySelector('p-tabs')?.getAttribute('value');
    expect(activo).toBe('estructura');
  });

  it('no muestra el tab General — su contenido vive en el header editable', () => {
    const valores = Array.from(fixture.nativeElement.querySelectorAll('p-tab')).map((el: any) => el.getAttribute('value'));
    expect(valores).not.toContain('general');
  });
});
