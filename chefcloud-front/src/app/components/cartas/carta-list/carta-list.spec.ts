import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartaList } from './carta-list';
import { CartaService } from '../../../services/carta.service';
import { FRANJA_GENERAL_ID } from '../../../data/cartas.model';

describe('CartaList', () => {
  let fixture: ComponentFixture<CartaList>;
  let cartaService: CartaService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartaList],
      providers: [provideRouter([{ path: 'cartas/:id', children: [] }])],
    }).compileComponents();
    fixture = TestBed.createComponent(CartaList);
    cartaService = TestBed.inject(CartaService);
    fixture.detectChanges();
  });

  it('nueva carta agrega una fila', () => {
    const antes = fixture.nativeElement.querySelectorAll('tbody tr').length;
    fixture.componentInstance.crearCarta();
    fixture.detectChanges();
    const despues = fixture.nativeElement.querySelectorAll('tbody tr').length;
    expect(despues).toBe(antes + 1);
  });

  it('escribir en el buscador filtra la tabla en vivo por nombre', () => {
    cartaService.crear('Carta de temporada');
    fixture.detectChanges();

    fixture.componentInstance.termino.set('temporada');
    fixture.detectChanges();

    const nombres = Array.from(fixture.nativeElement.querySelectorAll('.carta-nombre')).map((el: any) => el.textContent.trim());
    expect(nombres).toEqual(['Carta de temporada']);
  });

  it('la columna Vigencia muestra "General" para una carta sin franja asignada explícitamente', () => {
    const id = cartaService.crear('Carta nueva');
    fixture.detectChanges();

    const fila = fixture.componentInstance.filas().find((f) => f.carta.id === id);
    expect(fila?.carta.franjaId).toBe(FRANJA_GENERAL_ID);
    expect(fila?.vigencia).toBe('General');
  });

  it('no muestra acción de clonar — clonar una carta rompe la fuente única de verdad (Módulo 0, anti-patrón #1)', () => {
    const botones = Array.from(fixture.nativeElement.querySelectorAll('button, p-button')).map((b: any) => b.textContent?.trim());
    expect(botones.some((t: string) => t?.toLowerCase().includes('clonar'))).toBe(false);
  });
});
