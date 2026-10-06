import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { LoginScreen } from './login-screen';
import { SesionService } from '../../../services/sesion.service';

describe('LoginScreen', () => {
  let fixture: ComponentFixture<LoginScreen>;
  let component: LoginScreen;
  let sesionService: SesionService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LoginScreen], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(LoginScreen);
    component = fixture.componentInstance;
    sesionService = TestBed.inject(SesionService);
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

  it('muestra los 5 niveles de acceso como chips', () => {
    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Administrador');
    expect(texto).toContain('Marketing');
    expect(texto).toContain('Operaciones');
    expect(texto).toContain('Cocina / POS');
    expect(texto).toContain('Consultor');
  });
});
