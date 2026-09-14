import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { LoginScreen } from './login-screen';
import { SesionService } from '../../../services/sesion.service';
import { AccesoExternoService } from '../../../services/acceso-externo.service';

describe('LoginScreen', () => {
  let fixture: ComponentFixture<LoginScreen>;
  let component: LoginScreen;
  let sesionService: SesionService;
  let accesoExternoService: AccesoExternoService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LoginScreen], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(LoginScreen);
    component = fixture.componentInstance;
    sesionService = TestBed.inject(SesionService);
    accesoExternoService = TestBed.inject(AccesoExternoService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('ingresar() marca la sesión como autenticada y navega a la raíz', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');
    component.ingresar();
    expect(sesionService.autenticado()).toBe(true);
    expect(navigateSpy).toHaveBeenCalledWith('/');
  });

  it('ingresar() funciona sin importar el contenido de los campos (decorativo, sin validación)', () => {
    component.usuario.set('');
    component.clave.set('');
    component.ingresar();
    expect(sesionService.autenticado()).toBe(true);
  });

  it('ingresar() con el correo de una cuenta externa entra como esa cuenta específica', () => {
    accesoExternoService.crear({
      nombre: 'DOT Solutions',
      email: 'compras@dotsolutions.io',
      recurso: { tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2099-01-01' },
    });

    component.usuario.set('  COMPRAS@DotSolutions.io  ');
    component.ingresar();

    expect(sesionService.esCompradorExterno()).toBe(true);
    expect(sesionService.nombreUsuarioActual()).toBe('DOT Solutions');
  });

  it('ingresar() con un correo que no matchea ninguna cuenta mantiene el rol interno ya seleccionado', () => {
    sesionService.entrarComoInterno('usuario-pos', 'empresa-1a', 'Vendedor Providencia');
    component.usuario.set('no-existe@ejemplo.com');

    component.ingresar();

    expect(sesionService.rol()).toBe('usuario-pos');
  });

  it('muestra los 5 niveles de acceso como chips', () => {
    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Master');
    expect(texto).toContain('Administrador Holding');
    expect(texto).toContain('Administrador Tienda');
    expect(texto).toContain('Usuario POS');
    expect(texto).toContain('Comprador Externo');
  });
});
