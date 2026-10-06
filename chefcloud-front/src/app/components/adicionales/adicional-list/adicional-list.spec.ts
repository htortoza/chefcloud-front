import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AdicionalList } from './adicional-list';
import { AdicionalService } from '../../../services/adicional.service';

describe('AdicionalList', () => {
  let fixture: ComponentFixture<AdicionalList>;
  let adicionalService: AdicionalService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdicionalList],
      providers: [provideRouter([{ path: 'adicionales/:id', children: [] }])],
    }).compileComponents();
    fixture = TestBed.createComponent(AdicionalList);
    adicionalService = TestBed.inject(AdicionalService);
    fixture.detectChanges();
  });

  it('crearGrupo crea el borrador y navega directo a su editor, sin pantalla intermedia', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');
    const antes = adicionalService.grupos().length;

    fixture.componentInstance.crearGrupo();

    expect(adicionalService.grupos().length).toBe(antes + 1);
    const creado = adicionalService.grupos().at(-1)!;
    expect(navigateSpy).toHaveBeenCalledWith(['/adicionales', creado.id]);
  });

  it('escribir en el buscador filtra la tabla en vivo por nombre', () => {
    fixture.componentInstance.termino.set('salsas');
    fixture.detectChanges();

    const nombres = Array.from(fixture.nativeElement.querySelectorAll('.adicional-nombre')).map((el: any) => el.textContent.trim());
    expect(nombres.every((n: string) => n.toLowerCase().includes('salsas'))).toBe(true);
    expect(nombres.length).toBeGreaterThan(0);
  });

  it('eliminarGrupo pide confirmación y respeta la respuesta', () => {
    const [grupo] = adicionalService.grupos();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    fixture.componentInstance.eliminarGrupo(grupo.id);

    expect(confirmSpy).toHaveBeenCalled();
    expect(adicionalService.obtenerPorId(grupo.id)).toBeDefined();
  });

  it('eliminarGrupo confirmado quita el grupo del catálogo', () => {
    const [grupo] = adicionalService.grupos();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    fixture.componentInstance.eliminarGrupo(grupo.id);

    expect(adicionalService.obtenerPorId(grupo.id)).toBeUndefined();
  });

  it('abrirGrupo navega a /adicionales/:id', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');
    const [grupo] = adicionalService.grupos();

    fixture.componentInstance.abrirGrupo(grupo.id);

    expect(navigateSpy).toHaveBeenCalledWith(['/adicionales', grupo.id]);
  });
});
