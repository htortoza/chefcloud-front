import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { GiftcardService } from './giftcard.service';
import { EmpresaService } from './empresa.service';
import { SesionService } from './sesion.service';
import { AccesoExternoService } from './acceso-externo.service';

describe('GiftcardService — alcance por holding', () => {
  let giftcardService: GiftcardService;
  let empresaService: EmpresaService;
  let sesionService: SesionService;
  let accesoExternoService: AccesoExternoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    giftcardService = TestBed.inject(GiftcardService);
    empresaService = TestBed.inject(EmpresaService);
    sesionService = TestBed.inject(SesionService);
    accesoExternoService = TestBed.inject(AccesoExternoService);
  });

  it('administrador-holding con el holding activo ve las giftcards de empresa-1 (agregado)', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    expect(giftcardService.giftcardsDeEmpresaActiva().length).toBeGreaterThan(0);
    expect(giftcardService.giftcardsDeEmpresaActiva().every((g) => g.empresaId === 'empresa-1')).toBe(true);
  });

  it('al acotar a una tienda sin giftcards propias, la lista queda vacía', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    empresaService.cambiarEmpresa('empresa-1a');
    expect(giftcardService.giftcardsDeEmpresaActiva()).toEqual([]);
  });

  it('el movimiento de creación registra el usuario de la sesión activa, no una constante fija', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    giftcardService.crear({ modo: 'individual', tipoMonto: 'fijo', canal: 'ambos', montoFijo: 5000, crearSoloComoVigente: true });
    const nueva = giftcardService.giftcardsDeEmpresaActiva()[0];
    expect(nueva.movimientos[0].usuario).toBe('Admin Italmod');
  });

  it('crear() no falla si no hay empresa activa (sesión de comprador externo)', () => {
    sesionService.entrarComoCompradorExterno('acceso-1', 'DOT Solutions');
    const antes = giftcardService.giftcardsDeEmpresaActiva().length;
    giftcardService.crear({ modo: 'individual', tipoMonto: 'fijo', canal: 'ambos', montoFijo: 5000, crearSoloComoVigente: true });
    expect(giftcardService.giftcardsDeEmpresaActiva().length).toBe(antes);
  });

  it('giftcardsDelAccesoExterno solo muestra giftcards de campañas otorgadas y vigentes', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    // MOCK_GIFTCARDS trae 2 giftcards con campanaId: 'campana-1' (ids '1' y '2').
    accesoExternoService.crear({ nombre: 'DOT Solutions', email: 'compras@dotsolutions.io', recurso: { tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2099-01-01' } });
    const [acceso] = accesoExternoService.accesosDeHoldingActivo();

    sesionService.entrarComoCompradorExterno(acceso.id, 'DOT Solutions');

    const visibles = giftcardService.giftcardsDelAccesoExterno();
    expect(visibles.map((g) => g.id).sort()).toEqual(['1', '2']);
  });

  it('giftcardsDelAccesoExterno queda vacío si el recurso otorgado ya venció', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    accesoExternoService.crear({ nombre: 'DOT Solutions', email: 'compras@dotsolutions.io', recurso: { tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2000-01-01' } });
    const [acceso] = accesoExternoService.accesosDeHoldingActivo();

    sesionService.entrarComoCompradorExterno(acceso.id, 'DOT Solutions');

    expect(giftcardService.giftcardsDelAccesoExterno()).toEqual([]);
  });
});
