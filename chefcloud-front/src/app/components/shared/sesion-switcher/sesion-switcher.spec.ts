import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SesionSwitcher } from './sesion-switcher';
import { SesionService } from '../../../services/sesion.service';
import { AccesoExternoService } from '../../../services/acceso-externo.service';

describe('SesionSwitcher', () => {
  let fixture: ComponentFixture<SesionSwitcher>;
  let component: SesionSwitcher;
  let sesionService: SesionService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SesionSwitcher], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(SesionSwitcher);
    component = fixture.componentInstance;
    sesionService = TestBed.inject(SesionService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('cambiar a usuario-pos entra con la primera tienda disponible', () => {
    component.cambiarRol('usuario-pos');
    expect(sesionService.rol()).toBe('usuario-pos');
    expect(sesionService.empresaId()).toBe('empresa-1a');
  });

  it('cambiar a administrador-holding entra con el primer holding disponible', () => {
    component.cambiarRol('administrador-holding');
    expect(sesionService.rol()).toBe('administrador-holding');
    expect(sesionService.empresaId()).toBe('empresa-1');
  });

  it('cambiar a comprador-externo entra con la primera cuenta externa disponible', () => {
    const accesoExternoService = TestBed.inject(AccesoExternoService);
    component.cambiarRol('comprador-externo');
    expect(sesionService.rol()).toBe('comprador-externo');
    expect(sesionService.accesoExternoId()).toBe(accesoExternoService.todos()[0].id);
  });

  it('cambiar de rol renavega a la raíz para que el guard reubique según el nuevo rol', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');
    component.cambiarRol('comprador-externo');
    expect(navigateSpy).toHaveBeenCalledWith('/');
  });
});
