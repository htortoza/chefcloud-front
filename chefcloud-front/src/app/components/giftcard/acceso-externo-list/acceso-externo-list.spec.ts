import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { AccesoExternoList } from './acceso-externo-list';
import { SesionService } from '../../../services/sesion.service';
import { AccesoExternoService } from '../../../services/acceso-externo.service';

describe('AccesoExternoList', () => {
  let fixture: ComponentFixture<AccesoExternoList>;
  let component: AccesoExternoList;
  let sesionService: SesionService;
  let accesoExternoService: AccesoExternoService;
  let messageService: MessageService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AccesoExternoList], providers: [MessageService] }).compileComponents();
    fixture = TestBed.createComponent(AccesoExternoList);
    component = fixture.componentInstance;
    sesionService = TestBed.inject(SesionService);
    accesoExternoService = TestBed.inject(AccesoExternoService);
    messageService = TestBed.inject(MessageService);
    sesionService.entrarComoInterno('administrador-holding', 'empresa-1', 'Admin Italmod');
    fixture.detectChanges();
  });

  it('puedeCrear es false hasta completar nombre, correo válido, campaña y fecha', () => {
    expect(component.puedeCrear()).toBe(false);
    component.nombre.set('DOT Solutions');
    component.campanaId.set('campana-1');
    component.fechaExpiracion.set(new Date('2026-12-31'));
    expect(component.puedeCrear()).toBe(false);
    component.email.set('no-es-un-correo');
    expect(component.puedeCrear()).toBe(false);
    component.email.set('compras@dotsolutions.io');
    expect(component.puedeCrear()).toBe(true);
  });

  it('confirmarCreacion crea el acceso con su correo y cierra el modal', () => {
    const cantidadInicial = accesoExternoService.accesosDeHoldingActivo().length;
    component.nombre.set('DOT Solutions');
    component.email.set('compras@dotsolutions.io');
    component.campanaId.set('campana-1');
    component.fechaExpiracion.set(new Date('2026-12-31'));
    component.modalVisible.set(true);

    component.confirmarCreacion();

    expect(accesoExternoService.accesosDeHoldingActivo().length).toBe(cantidadInicial + 1);
    expect(accesoExternoService.buscarPorEmail('compras@dotsolutions.io')?.email).toBe('compras@dotsolutions.io');
    expect(component.modalVisible()).toBe(false);
  });

  it('confirmarCreacion no hace nada si falta un campo obligatorio', () => {
    const cantidadInicial = accesoExternoService.accesosDeHoldingActivo().length;
    component.nombre.set('DOT Solutions');
    component.confirmarCreacion();
    expect(accesoExternoService.accesosDeHoldingActivo().length).toBe(cantidadInicial);
  });

  it('crear con un correo ya existente otorga el recurso a la misma cuenta, no duplica', () => {
    const cantidadInicial = accesoExternoService.accesosDeHoldingActivo().length;
    component.nombre.set('DOT Solutions');
    component.email.set('compras@dotsolutions.io');
    component.campanaId.set('campana-1');
    component.fechaExpiracion.set(new Date('2026-12-31'));
    component.confirmarCreacion();

    component.nombre.set('DOT Solutions');
    component.email.set('compras@dotsolutions.io');
    component.campanaId.set('campana-1');
    component.fechaExpiracion.set(new Date('2027-06-30'));
    component.confirmarCreacion();

    expect(accesoExternoService.accesosDeHoldingActivo().length).toBe(cantidadInicial + 1);
    expect(accesoExternoService.buscarPorEmail('compras@dotsolutions.io')?.recursos.length).toBe(2);
  });

  it('abrirEdicion precarga nombre y correo de la cuenta y abre el modal', () => {
    accesoExternoService.crear({ nombre: 'DOT Solutions', email: 'compras@dotsolutions.io', recurso: { tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2026-12-31' } });
    const acceso = accesoExternoService.buscarPorEmail('compras@dotsolutions.io')!;

    component.abrirEdicion(acceso);

    expect(component.modalEditarVisible()).toBe(true);
    expect(component.editarNombre()).toBe('DOT Solutions');
    expect(component.editarEmail()).toBe('compras@dotsolutions.io');
  });

  it('confirmarEdicion actualiza la cuenta y cierra el modal', () => {
    accesoExternoService.crear({ nombre: 'DOT Solutions', email: 'compras@dotsolutions.io', recurso: { tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2026-12-31' } });
    const acceso = accesoExternoService.buscarPorEmail('compras@dotsolutions.io')!;

    component.abrirEdicion(acceso);
    component.editarNombre.set('DOT Solutions SpA');
    component.editarEmail.set('nuevo@dotsolutions.io');
    component.confirmarEdicion();

    expect(accesoExternoService.buscarPorEmail('nuevo@dotsolutions.io')?.nombre).toBe('DOT Solutions SpA');
    expect(component.modalEditarVisible()).toBe(false);
  });

  it('puedeEditar es false con nombre vacío o correo inválido', () => {
    component.editarNombre.set('');
    component.editarEmail.set('compras@dotsolutions.io');
    expect(component.puedeEditar()).toBe(false);

    component.editarNombre.set('DOT Solutions');
    component.editarEmail.set('no-es-un-correo');
    expect(component.puedeEditar()).toBe(false);

    component.editarEmail.set('compras@dotsolutions.io');
    expect(component.puedeEditar()).toBe(true);
  });

  it('confirmarCreacion de una cuenta nueva muestra el aviso de credenciales enviadas', () => {
    const addSpy = vi.spyOn(messageService, 'add');
    component.nombre.set('DOT Solutions');
    component.email.set('nueva@dotsolutions.io');
    component.campanaId.set('campana-1');
    component.fechaExpiracion.set(new Date('2026-12-31'));

    component.confirmarCreacion();

    expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Cuenta creada', detail: expect.stringContaining('nueva@dotsolutions.io') }));
  });

  it('confirmarCreacion sobre una cuenta existente avisa que se otorgó el acceso, no que se creó una cuenta', () => {
    accesoExternoService.crear({ nombre: 'DOT Solutions', email: 'compras@dotsolutions.io', recurso: { tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2026-12-31' } });
    const addSpy = vi.spyOn(messageService, 'add');

    component.nombre.set('DOT Solutions');
    component.email.set('compras@dotsolutions.io');
    component.campanaId.set('campana-1');
    component.fechaExpiracion.set(new Date('2027-06-30'));
    component.confirmarCreacion();

    expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Acceso otorgado' }));
  });

  it('enviarRestablecimiento muestra el aviso con el correo de la cuenta en edición', () => {
    accesoExternoService.crear({ nombre: 'DOT Solutions', email: 'compras@dotsolutions.io', recurso: { tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2026-12-31' } });
    const acceso = accesoExternoService.buscarPorEmail('compras@dotsolutions.io')!;
    component.abrirEdicion(acceso);
    const addSpy = vi.spyOn(messageService, 'add');

    component.enviarRestablecimiento();

    expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Enlace enviado', detail: expect.stringContaining('compras@dotsolutions.io') }));
  });

  it('enviarRestablecimiento no hace nada si el correo en edición no es válido', () => {
    component.editarEmail.set('no-es-un-correo');
    const addSpy = vi.spyOn(messageService, 'add');

    component.enviarRestablecimiento();

    expect(addSpy).not.toHaveBeenCalled();
  });

  it('campanasConInfo incluye el cupo disponible de cada campaña', () => {
    const info = component.campanasConInfo().find((c) => c.id === 'campana-1');
    expect(info?.nombre).toBe('Campaña Invierno');
    expect(info?.cupoMaximo).toBe(500);
    expect(info?.cupoDisponible).toBeLessThanOrEqual(500);
  });

  it('puedeEditar exige fecha de expiración si se eligió un lote nuevo', () => {
    component.editarNombre.set('DOT Solutions');
    component.editarEmail.set('compras@dotsolutions.io');
    component.editarCampanaId.set('campana-1');
    expect(component.puedeEditar()).toBe(false);

    component.editarFechaExpiracion.set(new Date('2026-12-31'));
    expect(component.puedeEditar()).toBe(true);
  });

  it('confirmarEdicion con un lote elegido otorga el recurso y avisa', () => {
    accesoExternoService.crear({ nombre: 'DOT Solutions', email: 'compras@dotsolutions.io', recurso: { tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2026-01-01' } });
    const acceso = accesoExternoService.buscarPorEmail('compras@dotsolutions.io')!;
    const addSpy = vi.spyOn(messageService, 'add');

    component.abrirEdicion(acceso);
    component.editarCampanaId.set('campana-1');
    component.editarFechaExpiracion.set(new Date('2027-12-31'));
    component.confirmarEdicion();

    expect(accesoExternoService.buscarPorEmail('compras@dotsolutions.io')?.recursos.length).toBe(2);
    expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Lote asignado' }));
  });

  it('confirmarEdicion sin elegir lote no otorga ningún recurso adicional', () => {
    accesoExternoService.crear({ nombre: 'DOT Solutions', email: 'compras@dotsolutions.io', recurso: { tipoRecurso: 'lote_giftcard', idRecurso: 'campana-1', fechaExpiracion: '2026-01-01' } });
    const acceso = accesoExternoService.buscarPorEmail('compras@dotsolutions.io')!;

    component.abrirEdicion(acceso);
    component.editarNombre.set('DOT Solutions SpA');
    component.confirmarEdicion();

    expect(accesoExternoService.buscarPorEmail('compras@dotsolutions.io')?.recursos.length).toBe(1);
  });

  it('crearCampana asigna la nueva campaña al formulario de creación cuando ese modal está abierto', () => {
    component.modalVisible.set(true);
    component.crearCampana({ nombre: 'Campaña Nueva', fechaInicio: '2026-01-01', fechaFin: '2026-02-01', cupoMaximo: 10, politicaMonto: { tipo: 'abierto' } });

    expect(component.campanaId()).not.toBeNull();
    expect(component.editarCampanaId()).toBeNull();
  });

  it('crearCampana asigna la nueva campaña al formulario de edición cuando ese modal está abierto', () => {
    component.modalEditarVisible.set(true);
    component.crearCampana({ nombre: 'Campaña Nueva', fechaInicio: '2026-01-01', fechaFin: '2026-02-01', cupoMaximo: 10, politicaMonto: { tipo: 'abierto' } });

    expect(component.editarCampanaId()).not.toBeNull();
    expect(component.campanaId()).toBeNull();
  });
});
