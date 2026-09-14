import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { EmpresaService } from './empresa.service';
import { SesionService } from './sesion.service';

describe('EmpresaService', () => {
  let empresaService: EmpresaService;
  let sesionService: SesionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    empresaService = TestBed.inject(EmpresaService);
    sesionService = TestBed.inject(SesionService);
  });

  it('administrador-holding ve el holding y sus tiendas, activo por defecto el holding (vista agregada)', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    expect(empresaService.empresasVisibles().map((e) => e.id)).toEqual(['empresa-1', 'empresa-1a', 'empresa-1b']);
    expect(empresaService.empresaActiva()?.id).toBe('empresa-1');
    expect(empresaService.empresasIncluidasEnVistaActiva()).toEqual(['empresa-1', 'empresa-1a', 'empresa-1b']);
  });

  it('al cambiar a una tienda puntual, la vista se acota solo a esa tienda', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    empresaService.cambiarEmpresa('empresa-1a');
    expect(empresaService.empresaActiva()?.id).toBe('empresa-1a');
    expect(empresaService.empresasIncluidasEnVistaActiva()).toEqual(['empresa-1a']);
  });

  it('administrador-tienda solo ve su propia tienda, sin agregado de holding', () => {
    sesionService.entrarComoInterno('administrador-tienda', 'empresa-1a', 'Admin Providencia');
    expect(empresaService.empresasVisibles().map((e) => e.id)).toEqual(['empresa-1a']);
    expect(empresaService.empresasIncluidasEnVistaActiva()).toEqual(['empresa-1a']);
  });

  it('master ve todas las empresas, incluidas todas las tiendas', () => {
    sesionService.entrarComoInterno('master', 'empresa-1', 'Master');
    expect(empresaService.empresasVisibles().map((e) => e.id)).toEqual(['empresa-1', 'empresa-1a', 'empresa-1b', 'empresa-2']);
  });

  it('comprador-externo no tiene empresas visibles ni empresa activa', () => {
    sesionService.entrarComoCompradorExterno('acceso-1', 'DOT Solutions');
    expect(empresaService.empresasVisibles()).toEqual([]);
    expect(empresaService.empresaActiva()).toBeNull();
    expect(empresaService.empresasIncluidasEnVistaActiva()).toEqual([]);
  });
});
