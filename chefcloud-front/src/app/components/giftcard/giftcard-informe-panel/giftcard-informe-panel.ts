import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Popover } from 'primeng/popover';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { Button } from 'primeng/button';
import { GiftcardService } from '../../../services/giftcard.service';
import { MovimientoTipo } from '../../../data/giftcard.model';

type FiltroTipo = MovimientoTipo | 'todos';

const OPCIONES_TIPO: { label: string; value: FiltroTipo }[] = [
  { label: 'Todos los movimientos', value: 'todos' },
  { label: 'Venta', value: 'venta' },
  { label: 'Uso', value: 'uso' },
  { label: 'Ajuste', value: 'ajuste' },
];

@Component({
  selector: 'app-giftcard-informe-panel',
  imports: [FormsModule, Popover, Select, DatePicker, Button],
  templateUrl: './giftcard-informe-panel.html',
  styleUrl: './giftcard-informe-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GiftcardInformePanel {
  private readonly giftcardService = inject(GiftcardService);
  private readonly hostElement = inject(ElementRef<HTMLElement>);

  readonly popover = viewChild.required<Popover>('op');

  readonly opcionesTipo = OPCIONES_TIPO;
  readonly filtroTipo = signal<FiltroTipo>('todos');
  readonly fechaDesde = signal<Date | null>(null);
  readonly fechaHasta = signal<Date | null>(null);

  abrir(): void {
    this.popover().toggle({ currentTarget: this.hostElement.nativeElement });
  }

  descargar(): void {
    const desde = this.fechaDesde() ? aIso(this.fechaDesde()!) : null;
    const hasta = this.fechaHasta() ? aIso(this.fechaHasta()!) : null;
    const tipo = this.filtroTipo();

    const filas = this.giftcardService
      .giftcardsDeEmpresaActiva()
      .flatMap((giftcard) =>
        giftcard.movimientos
          .filter((mov) => (tipo === 'todos' || mov.tipo === tipo) && (!desde || mov.fecha >= desde) && (!hasta || mov.fecha <= hasta))
          .map((mov) => [giftcard.codigo, mov.tipo, mov.fecha, String(mov.monto), String(mov.saldoResultante), mov.detalle]),
      );

    const encabezado = ['codigo', 'tipo', 'fecha', 'monto', 'saldo_resultante', 'detalle'];
    const csv = [encabezado, ...filas].map((fila) => fila.map((valor) => `"${valor}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'informe-giftcards.csv';
    enlace.click();
    URL.revokeObjectURL(url);

    this.popover().hide();
  }
}

function aIso(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}
