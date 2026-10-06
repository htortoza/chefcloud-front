import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartaDetailAsignacion } from './carta-detail-asignacion';
import { CartaService } from '../../../services/carta.service';

describe('CartaDetailAsignacion', () => {
  let fixture: ComponentFixture<CartaDetailAsignacion>;
  let cartaService: CartaService;
  let cartaId: string;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CartaDetailAsignacion] }).compileComponents();
    cartaService = TestBed.inject(CartaService);
    cartaId = cartaService.crear('Carta de prueba');
    fixture = TestBed.createComponent(CartaDetailAsignacion);
    fixture.componentRef.setInput('carta', cartaService.cartas().find((c) => c.id === cartaId));
    fixture.detectChanges();
  });

  it('marcar una tienda la asigna y no muestra conflicto', () => {
    const [tienda] = cartaService.tiendas();
    fixture.componentInstance.toggleTienda(tienda.id);
    fixture.detectChanges();
    expect(cartaService.tiendasAsignadas(cartaId).map((t) => t.id)).toContain(tienda.id);
    expect(fixture.componentInstance.mensajeConflicto()).toBeNull();
  });
});
