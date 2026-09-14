import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { CartaService } from '../../../services/carta.service';
import { Carta, FranjaEspecial, TipoVigenciaCarta } from '../../../data/cartas.model';
import { EditableTextField } from '../../shared/editable-text-field/editable-text-field';

const OPCIONES_TIPO_VIGENCIA: { label: string; value: TipoVigenciaCarta }[] = [
  { label: 'Regular', value: 'regular' },
  { label: 'Fecha especial', value: 'fecha-especial' },
];

const OPCIONES_FRANJA_ESPECIAL: { label: string; value: FranjaEspecial }[] = [
  { label: 'Todo el día', value: 'todo-dia' },
  { label: 'Desayuno', value: 'desayuno' },
  { label: 'Brunch', value: 'brunch' },
  { label: 'Almuerzo', value: 'almuerzo' },
  { label: 'Cena', value: 'cena' },
];

@Component({
  selector: 'app-carta-detail-header',
  imports: [FormsModule, Select, Button, InputText, EditableTextField],
  templateUrl: './carta-detail-header.html',
  styleUrl: './carta-detail-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartaDetailHeader {
  private readonly cartaService = inject(CartaService);

  readonly carta = input.required<Carta>();
  readonly opcionesTipoVigencia = OPCIONES_TIPO_VIGENCIA;
  readonly opcionesFranjaEspecial = OPCIONES_FRANJA_ESPECIAL;

  readonly editandoVigencia = signal(false);
  readonly tipoVigenciaBorrador = signal<TipoVigenciaCarta>('regular');
  readonly rangoDesdeBorrador = signal('');
  readonly rangoHastaBorrador = signal('');
  readonly franjaEspecialBorrador = signal<FranjaEspecial>('todo-dia');

  readonly resumenVigencia = computed(() => {
    const c = this.carta();
    if (c.tipoVigencia === 'regular') return 'Regular';
    const franja = this.opcionesFranjaEspecial.find((f) => f.value === c.franjaEspecial)?.label ?? '';
    return `Fecha especial · ${c.rangoFechas?.desde ?? ''} – ${c.rangoFechas?.hasta ?? ''} · ${franja}`;
  });

  guardarNombre(valor: string): void {
    this.cartaService.actualizarGeneral(this.carta().id, { nombre: valor });
  }

  guardarDescripcion(valor: string): void {
    this.cartaService.actualizarGeneral(this.carta().id, { descripcionInterna: valor });
  }

  iniciarEdicionVigencia(): void {
    const c = this.carta();
    this.tipoVigenciaBorrador.set(c.tipoVigencia);
    this.rangoDesdeBorrador.set(c.rangoFechas?.desde ?? '');
    this.rangoHastaBorrador.set(c.rangoFechas?.hasta ?? '');
    this.franjaEspecialBorrador.set(c.franjaEspecial ?? 'todo-dia');
    this.editandoVigencia.set(true);
  }

  confirmarVigencia(): void {
    if (!this.editandoVigencia()) return;
    const esFechaEspecial = this.tipoVigenciaBorrador() === 'fecha-especial';
    this.cartaService.actualizarGeneral(this.carta().id, {
      tipoVigencia: this.tipoVigenciaBorrador(),
      rangoFechas: esFechaEspecial ? { desde: this.rangoDesdeBorrador(), hasta: this.rangoHastaBorrador() } : undefined,
      franjaEspecial: esFechaEspecial ? this.franjaEspecialBorrador() : undefined,
    });
    this.editandoVigencia.set(false);
  }

  publicar(): void {
    this.cartaService.publicar(this.carta().id);
  }
}
