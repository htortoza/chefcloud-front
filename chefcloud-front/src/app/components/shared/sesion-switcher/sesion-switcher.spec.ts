import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SesionSwitcher } from './sesion-switcher';
import { SesionService } from '../../../services/sesion.service';

describe('SesionSwitcher', () => {
  let fixture: ComponentFixture<SesionSwitcher>;
  let sesionService: SesionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SesionSwitcher],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(SesionSwitcher);
    sesionService = TestBed.inject(SesionService);
    fixture.detectChanges();
  });

  it('cambiarRol actualiza el rol activo en SesionService', () => {
    fixture.componentInstance.cambiarRol('marketing');
    expect(sesionService.rol()).toBe('marketing');
  });
});
