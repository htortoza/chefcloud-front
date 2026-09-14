import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CampanaService } from './campana.service';
import { EmpresaService } from './empresa.service';
import { SesionService } from './sesion.service';
import { GiftcardService } from './giftcard.service';

describe('CampanaService — campanasDelHoldingActivo', () => {
  let campanaService: CampanaService;
  let empresaService: EmpresaService;
  let sesionService: SesionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    campanaService = TestBed.inject(CampanaService);
    empresaService = TestBed.inject(EmpresaService);
    sesionService = TestBed.inject(SesionService);
  });

  it('devuelve las campañas del holding aunque la vista esté acotada a una tienda sin campañas propias', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    empresaService.cambiarEmpresa('empresa-1a');

    // La vista de giftcards queda acotada a la tienda (campanasDeEmpresaActiva vacío)...
    expect(campanaService.campanasDeEmpresaActiva()).toEqual([]);
    // ...pero otorgar un acceso externo sigue siendo una acción de holding completo.
    expect(campanaService.campanasDelHoldingActivo().map((c) => c.id)).toEqual(['campana-1']);
  });

  it('crear() incluye el cupoMaximo y la politicaMonto del payload en la campaña creada', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    campanaService.crear({
      nombre: 'Campaña Test',
      fechaInicio: '2026-01-01',
      fechaFin: '2026-02-01',
      cupoMaximo: 50,
      politicaMonto: { tipo: 'fijo-unico', monto: 10000 },
    });

    const creada = campanaService.campanasDelHoldingActivo()[0];
    expect(creada.cupoMaximo).toBe(50);
    expect(creada.politicaMonto).toEqual({ tipo: 'fijo-unico', monto: 10000 });
  });

  it('cupoDisponible descuenta las giftcards ya generadas para esa campaña, sin importar la vista de empresa activa', () => {
    const giftcardService = TestBed.inject(GiftcardService);
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');

    // campana-1 (mock) tiene cupoMaximo: 500 y ya tiene 2 giftcards mock con campanaId 'campana-1'.
    expect(campanaService.cantidadGiftcardsDeCampana('campana-1')).toBe(2);
    expect(campanaService.cupoDisponible('campana-1')).toBe(498);

    giftcardService.crear({ modo: 'lote', campanaId: 'campana-1', cantidad: 3, tipoMonto: 'fijo', canal: 'ambos', montoFijo: 1000 });

    expect(campanaService.cantidadGiftcardsDeCampana('campana-1')).toBe(5);
    expect(campanaService.cupoDisponible('campana-1')).toBe(495);
  });

  it('cupoDisponible nunca es negativo y es 0 para una campaña inexistente', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    expect(campanaService.cupoDisponible('campana-inexistente')).toBe(0);
  });

  it('cupoDisponibleTier descuenta solo las giftcards de esa denominación puntual', () => {
    const giftcardService = TestBed.inject(GiftcardService);
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    campanaService.crear({
      nombre: 'Campaña Denominaciones',
      fechaInicio: '2026-01-01',
      fechaFin: '2026-02-01',
      cupoMaximo: 45,
      politicaMonto: {
        tipo: 'fijo-tiers',
        tiers: [
          { monto: 10000, cantidad: 5 },
          { monto: 20000, cantidad: 10 },
          { monto: 5000, cantidad: 30 },
        ],
      },
    });
    const campanaId = campanaService.campanasDelHoldingActivo()[0].id;

    expect(campanaService.cupoDisponibleTier(campanaId, 10000)).toBe(5);
    expect(campanaService.cupoDisponibleTier(campanaId, 20000)).toBe(10);

    giftcardService.crear({ modo: 'lote', campanaId, cantidad: 3, tipoMonto: 'fijo', canal: 'ambos', montoFijo: 10000 });

    // Solo baja el sub-cupo de la denominación de 10.000 — las otras quedan intactas.
    expect(campanaService.cupoDisponibleTier(campanaId, 10000)).toBe(2);
    expect(campanaService.cupoDisponibleTier(campanaId, 20000)).toBe(10);
    // El cupo total de la campaña también baja, porque es el mismo conteo de giftcards.
    expect(campanaService.cupoDisponible(campanaId)).toBe(42);
  });

  it('cupoDisponibleTier es 0 para una campaña que no usa la política fijo-tiers', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    // campana-1 (mock) usa política 'abierto'.
    expect(campanaService.cupoDisponibleTier('campana-1', 10000)).toBe(0);
  });
});
