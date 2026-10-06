import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MarcaContextService } from './marca-context.service';

describe('MarcaContextService', () => {
  let marcaContextService: MarcaContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    marcaContextService = TestBed.inject(MarcaContextService);
  });

  it('expone una marca activa con nombre y dominio', () => {
    const marca = marcaContextService.marcaActiva();
    expect(marca.nombre.length).toBeGreaterThan(0);
    expect(marca.dominio.length).toBeGreaterThan(0);
  });
});
