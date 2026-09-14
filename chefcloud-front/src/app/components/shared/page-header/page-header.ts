import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Encabezado estándar de página: título a la izquierda, acciones (botones, toggles) a la derecha. */
@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.html',
  styleUrl: './page-header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  readonly titulo = input.required<string>();
}
