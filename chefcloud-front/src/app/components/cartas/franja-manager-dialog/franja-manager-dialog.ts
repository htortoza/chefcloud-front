import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { PrimeTemplate } from 'primeng/api';
import { FranjaHorariaService } from '../../../services/franja-horaria.service';
import { FRANJA_GENERAL_ID, FranjaHoraria } from '../../../data/cartas.model';
import { EditableTextField } from '../../shared/editable-text-field/editable-text-field';

@Component({
  selector: 'app-franja-manager-dialog',
  imports: [FormsModule, Dialog, InputText, Button, ToggleSwitch, PrimeTemplate, EditableTextField],
  templateUrl: './franja-manager-dialog.html',
  styleUrl: './franja-manager-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FranjaManagerDialog {
  private readonly franjaHorariaService = inject(FranjaHorariaService);

  readonly cerrar = output<void>();
  readonly visible = signal(true);
  readonly franjas = this.franjaHorariaService.franjas;

  esGeneral(id: string): boolean {
    return id === FRANJA_GENERAL_ID;
  }

  tieneHorario(franja: FranjaHoraria): boolean {
    return franja.horaInicio !== null && franja.horaFin !== null;
  }

  renombrar(id: string, nombre: string): void {
    this.franjaHorariaService.actualizar(id, { nombre });
  }

  toggleHorarioPersonalizado(id: string, activar: boolean): void {
    this.franjaHorariaService.actualizar(id, activar ? { horaInicio: '09:00', horaFin: '18:00' } : { horaInicio: null, horaFin: null });
  }

  actualizarHoraInicio(id: string, valor: string): void {
    this.franjaHorariaService.actualizar(id, { horaInicio: valor });
  }

  actualizarHoraFin(id: string, valor: string): void {
    this.franjaHorariaService.actualizar(id, { horaFin: valor });
  }

  agregarFranja(): void {
    this.franjaHorariaService.crear('Nueva franja');
  }

  eliminar(id: string): void {
    this.franjaHorariaService.eliminar(id);
  }

  cerrarDialog(): void {
    this.visible.set(false);
    this.cerrar.emit();
  }
}
