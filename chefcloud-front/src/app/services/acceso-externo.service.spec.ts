import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AccesoExternoService } from './acceso-externo.service';
import { SesionService } from './sesion.service';

describe('AccesoExternoService', () => {
  let service: AccesoExternoService;
  let sesionService: SesionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccesoExternoService);
    sesionService = TestBed.inject(SesionService);
  });

  it('crea una cuenta externa vinculada al holding activo, con su correo de login', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    const cantidadInicial = service.accesosDeHoldingActivo().length;
    service.crear({ nombre: 'DOT Solutions', email: 'compras@dotsolutions.io', recurso: { tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2026-12-31' } });
    const creada = service.buscarPorEmail('compras@dotsolutions.io')!;

    expect(service.accesosDeHoldingActivo().length).toBe(cantidadInicial + 1);
    expect(creada.nombre).toBe('DOT Solutions');
    expect(creada.email).toBe('compras@dotsolutions.io');
    expect(creada.empresaVendedoraId).toBe('empresa-1');
  });

  it('otorga un recurso adicional a una cuenta existente en vez de crear una nueva', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    const cantidadInicial = service.accesosDeHoldingActivo().length;
    service.crear({ nombre: 'DOT Solutions', email: 'compras@dotsolutions.io', recurso: { tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2026-12-31' } });
    const acceso = service.buscarPorEmail('compras@dotsolutions.io')!;

    service.otorgarRecurso({ accesoExternoId: acceso.id, recurso: { tipoRecurso: 'lote_giftcard', idRecurso: 'campana-2', fechaExpiracion: '2027-01-31' } });

    expect(service.accesosDeHoldingActivo().length).toBe(cantidadInicial + 1);
    expect(service.buscarPorEmail('compras@dotsolutions.io')!.recursos.length).toBe(2);
  });

  it('crear() con un correo que ya existe otorga el recurso a la cuenta existente en vez de duplicar', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    const cantidadInicial = service.accesosDeHoldingActivo().length;
    service.crear({ nombre: 'DOT Solutions', email: 'compras@dotsolutions.io', recurso: { tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2026-12-31' } });

    service.crear({ nombre: 'DOT Solutions', email: 'COMPRAS@dotsolutions.io', recurso: { tipoRecurso: 'lote_giftcard', idRecurso: 'campana-2', fechaExpiracion: '2027-01-31' } });

    expect(service.accesosDeHoldingActivo().length).toBe(cantidadInicial + 1);
    expect(service.buscarPorEmail('compras@dotsolutions.io')!.recursos.length).toBe(2);
  });

  it('recursosVigentesDeSesion excluye recursos vencidos', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    service.crear({ nombre: 'DOT Solutions', email: 'compras@dotsolutions.io', recurso: { tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2000-01-01' } });
    const [acceso] = service.accesosDeHoldingActivo();

    sesionService.entrarComoCompradorExterno(acceso.id, 'DOT Solutions');

    expect(service.recursosVigentesDeSesion()).toEqual([]);
  });

  it('recursosVigentesDeSesion incluye recursos vigentes', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    service.crear({ nombre: 'DOT Solutions', email: 'compras@dotsolutions.io', recurso: { tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2099-01-01' } });
    const [acceso] = service.accesosDeHoldingActivo();

    sesionService.entrarComoCompradorExterno(acceso.id, 'DOT Solutions');

    expect(service.recursosVigentesDeSesion().map((r) => r.idRecurso)).toEqual(['campana-1']);
  });

  it('buscarPorEmail encuentra la cuenta sin importar mayúsculas/espacios', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    service.crear({ nombre: 'DOT Solutions', email: 'compras@dotsolutions.io', recurso: { tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2099-01-01' } });

    const encontrada = service.buscarPorEmail('  COMPRAS@DotSolutions.io  ');

    expect(encontrada?.nombre).toBe('DOT Solutions');
  });

  it('buscarPorEmail devuelve null si no hay ninguna cuenta con ese correo', () => {
    expect(service.buscarPorEmail('nadie@ejemplo.com')).toBeNull();
  });

  it('actualizar() cambia el nombre y el correo de la cuenta', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    service.crear({ nombre: 'DOT Solutions', email: 'compras@dotsolutions.io', recurso: { tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2026-12-31' } });
    const acceso = service.buscarPorEmail('compras@dotsolutions.io')!;

    service.actualizar({ id: acceso.id, nombre: 'DOT Solutions SpA', email: 'nuevo@dotsolutions.io' });

    expect(service.buscarPorEmail('compras@dotsolutions.io')).toBeNull();
    const actualizada = service.buscarPorEmail('nuevo@dotsolutions.io')!;
    expect(actualizada.nombre).toBe('DOT Solutions SpA');
    expect(actualizada.id).toBe(acceso.id);
  });

  it('actualizar() no permite tomar el correo de otra cuenta existente', () => {
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    service.crear({ nombre: 'DOT Solutions', email: 'compras@dotsolutions.io', recurso: { tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2026-12-31' } });
    service.crear({ nombre: 'Otra Empresa', email: 'otra@empresa.com', recurso: { tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2026-12-31' } });
    const acceso = service.buscarPorEmail('compras@dotsolutions.io')!;

    service.actualizar({ id: acceso.id, nombre: 'DOT Solutions', email: 'otra@empresa.com' });

    expect(service.buscarPorEmail('compras@dotsolutions.io')?.id).toBe(acceso.id);
    expect(service.buscarPorEmail('otra@empresa.com')?.nombre).toBe('Otra Empresa');
  });
});
