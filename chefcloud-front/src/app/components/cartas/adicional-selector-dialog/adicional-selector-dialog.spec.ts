import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdicionalSelectorDialog } from './adicional-selector-dialog';
import { AdicionalService } from '../../../services/adicional.service';

describe('AdicionalSelectorDialog', () => {
  let fixture: ComponentFixture<AdicionalSelectorDialog>;
  let adicionalService: AdicionalService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AdicionalSelectorDialog], providers: [provideRouter([])] }).compileComponents();
    adicionalService = TestBed.inject(AdicionalService);
    fixture = TestBed.createComponent(AdicionalSelectorDialog);
    fixture.componentRef.setInput('gruposYaAsociados', new Set<string>());
    fixture.detectChanges();
  });

  it('lista todos los grupos por defecto, sin necesidad de escribir', () => {
    expect(fixture.componentInstance.gruposFiltrados().length).toBe(adicionalService.grupos().length);
  });

  it('el filtro de texto busca por nombre o título', () => {
    const [grupo] = adicionalService.grupos();
    fixture.componentInstance.textoBusqueda.set(grupo.nombre.slice(0, 3));

    expect(fixture.componentInstance.gruposFiltrados().some((g) => g.id === grupo.id)).toBe(true);
  });

  it('confirmarSeleccion emite los ids seleccionados y los limpia', () => {
    const [grupoA, grupoB] = adicionalService.grupos();
    let emitido: string[] | undefined;
    fixture.componentInstance.agregar.subscribe((ids: string[]) => (emitido = ids));

    fixture.componentInstance.seleccionados.set([grupoA, grupoB]);
    fixture.componentInstance.confirmarSeleccion();

    expect(emitido).toEqual([grupoA.id, grupoB.id]);
    expect(fixture.componentInstance.seleccionados()).toEqual([]);
  });

  it('estaYaAsociado refleja el input gruposYaAsociados', () => {
    const [grupo] = adicionalService.grupos();
    fixture.componentRef.setInput('gruposYaAsociados', new Set([grupo.id]));
    fixture.detectChanges();

    expect(fixture.componentInstance.estaYaAsociado(grupo)).toBe(true);
  });

  it('nombresOpciones lista los nombres de las opciones del grupo, separados por coma', () => {
    const [grupo] = adicionalService.grupos();

    expect(fixture.componentInstance.nombresOpciones(grupo)).toBe(grupo.opciones.map((o) => o.nombre).join(', '));
  });

  it('nombresOpciones avisa cuando el grupo todavía no tiene opciones', () => {
    const vacioId = adicionalService.crear();
    const vacio = adicionalService.obtenerPorId(vacioId)!;

    expect(fixture.componentInstance.nombresOpciones(vacio)).toBe('Sin opciones todavía');
  });

  it('catalogoVacio es false cuando hay grupos creados', () => {
    expect(fixture.componentInstance.catalogoVacio()).toBe(false);
  });

  it('cerrarDialog emite cerrar', () => {
    let cerrado = false;
    fixture.componentInstance.cerrar.subscribe(() => (cerrado = true));

    fixture.componentInstance.cerrarDialog();

    expect(cerrado).toBe(true);
    expect(fixture.componentInstance.visible()).toBe(false);
  });
});
