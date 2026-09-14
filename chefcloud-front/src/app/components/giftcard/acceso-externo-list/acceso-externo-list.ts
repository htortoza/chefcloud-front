import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService, PrimeTemplate } from 'primeng/api';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Fluid } from 'primeng/fluid';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { Tag } from 'primeng/tag';
import { AccesoExternoService } from '../../../services/acceso-externo.service';
import { CampanaService } from '../../../services/campana.service';
import { AccesoExterno, RecursoOtorgado, recursoVigente } from '../../../data/governance.model';
import { CrearCampanaPayload } from '../../../data/giftcard.model';
import { CampanaCreateModal } from '../campana-create-modal/campana-create-modal';
import { PageHeader } from '../../shared/page-header/page-header';

const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-acceso-externo-list',
  imports: [FormsModule, PrimeTemplate, Card, TableModule, Button, Dialog, Fluid, InputText, Select, DatePicker, Tag, CampanaCreateModal, PageHeader],
  templateUrl: './acceso-externo-list.html',
  styleUrl: './acceso-externo-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccesoExternoList {
  private readonly accesoExternoService = inject(AccesoExternoService);
  private readonly campanaService = inject(CampanaService);
  private readonly messageService = inject(MessageService);

  readonly accesos = this.accesoExternoService.accesosDeHoldingActivo;
  readonly campanasDisponibles = this.campanaService.campanasDelHoldingActivo;

  readonly modalVisible = signal(false);
  readonly modalCampanaVisible = signal(false);
  readonly nombre = signal('');
  readonly email = signal('');
  readonly campanaId = signal<string | null>(null);
  readonly fechaExpiracion = signal<Date | null>(null);

  readonly modalEditarVisible = signal(false);
  readonly editarId = signal<string | null>(null);
  readonly editarNombre = signal('');
  readonly editarEmail = signal('');
  readonly editarCampanaId = signal<string | null>(null);
  readonly editarFechaExpiracion = signal<Date | null>(null);

  /** Nombre + cupo disponible de cada campaña — para elegir un lote informadamente, no a ciegas por nombre. */
  readonly campanasConInfo = computed(() =>
    this.campanasDisponibles().map((c) => ({ id: c.id, nombre: c.nombre, cupoDisponible: this.campanaService.cupoDisponible(c.id), cupoMaximo: c.cupoMaximo })),
  );

  readonly puedeCrear = computed(
    () => this.nombre().trim().length > 0 && PATRON_EMAIL.test(this.email().trim()) && this.campanaId() !== null && this.fechaExpiracion() !== null,
  );

  readonly puedeEditar = computed(
    () =>
      this.editarNombre().trim().length > 0 &&
      PATRON_EMAIL.test(this.editarEmail().trim()) &&
      (!this.editarCampanaId() || this.editarFechaExpiracion() !== null),
  );

  esVigente(recurso: RecursoOtorgado): boolean {
    return recursoVigente(recurso, new Date().toISOString().slice(0, 10));
  }

  nombreRecurso(recurso: RecursoOtorgado): string {
    return this.campanaService.campanaPorId(recurso.idRecurso)?.nombre ?? recurso.idRecurso;
  }

  abrirModal(): void {
    this.modalVisible.set(true);
  }

  cerrarModal(): void {
    this.modalVisible.set(false);
    this.nombre.set('');
    this.email.set('');
    this.campanaId.set(null);
    this.fechaExpiracion.set(null);
  }

  crearCampana(payload: CrearCampanaPayload): void {
    this.campanaService.crear(payload);
    const nuevaId = this.campanasDisponibles()[0]?.id ?? null;
    if (this.modalVisible()) this.campanaId.set(nuevaId);
    if (this.modalEditarVisible()) this.editarCampanaId.set(nuevaId);
  }

  confirmarCreacion(): void {
    const campanaId = this.campanaId();
    const fecha = this.fechaExpiracion();
    if (!this.puedeCrear() || !campanaId || !fecha) return;

    const email = this.email().trim();
    const esCuentaNueva = !this.accesoExternoService.buscarPorEmail(email);

    this.accesoExternoService.crear({
      nombre: this.nombre().trim(),
      email,
      recurso: { tipoRecurso: 'lote_giftcard', idRecurso: campanaId, fechaExpiracion: fecha.toISOString().slice(0, 10) },
    });

    if (esCuentaNueva) {
      this.messageService.add({
        severity: 'success',
        summary: 'Cuenta creada',
        detail: `Se enviaron las credenciales de acceso a ${email}. (Simulado — no hay envío real de correo todavía)`,
      });
    } else {
      this.messageService.add({ severity: 'success', summary: 'Acceso otorgado', detail: `Se agregó el nuevo lote a la cuenta de ${email}.` });
    }

    this.cerrarModal();
  }

  abrirEdicion(acceso: AccesoExterno): void {
    this.editarId.set(acceso.id);
    this.editarNombre.set(acceso.nombre);
    this.editarEmail.set(acceso.email);
    this.editarCampanaId.set(null);
    this.editarFechaExpiracion.set(null);
    this.modalEditarVisible.set(true);
  }

  cerrarEdicion(): void {
    this.modalEditarVisible.set(false);
    this.editarId.set(null);
    this.editarNombre.set('');
    this.editarEmail.set('');
    this.editarCampanaId.set(null);
    this.editarFechaExpiracion.set(null);
  }

  confirmarEdicion(): void {
    const id = this.editarId();
    if (!this.puedeEditar() || !id) return;

    this.accesoExternoService.actualizar({ id, nombre: this.editarNombre().trim(), email: this.editarEmail().trim() });

    const campanaId = this.editarCampanaId();
    const fecha = this.editarFechaExpiracion();
    if (campanaId && fecha) {
      this.accesoExternoService.otorgarRecurso({
        accesoExternoId: id,
        recurso: { tipoRecurso: 'lote_giftcard', idRecurso: campanaId, fechaExpiracion: fecha.toISOString().slice(0, 10) },
      });
      this.messageService.add({ severity: 'success', summary: 'Lote asignado', detail: 'Se agregó el nuevo lote a la cuenta.' });
    }

    this.cerrarEdicion();
  }

  /** Simulado — todavía no hay backend ni servicio de correo real para enviar el enlace. */
  enviarRestablecimiento(): void {
    const email = this.editarEmail().trim();
    if (!PATRON_EMAIL.test(email)) return;

    this.messageService.add({
      severity: 'info',
      summary: 'Enlace enviado',
      detail: `Se envió un enlace de restablecimiento de contraseña a ${email}. (Simulado — no hay envío real de correo todavía)`,
    });
  }
}
