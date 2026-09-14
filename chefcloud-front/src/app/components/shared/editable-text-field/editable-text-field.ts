import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-editable-text-field',
  imports: [FormsModule, InputText, Button],
  templateUrl: './editable-text-field.html',
  styleUrl: './editable-text-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditableTextField {
  readonly valor = input.required<string>();
  readonly requerido = input(false);
  readonly guardar = output<string>();

  readonly editando = signal(false);
  readonly borrador = signal('');

  iniciarEdicion(): void {
    this.borrador.set(this.valor());
    this.editando.set(true);
  }

  confirmar(): void {
    if (!this.editando()) return;
    const valor = this.borrador().trim();
    if (this.requerido() && !valor) {
      this.editando.set(false);
      return;
    }
    this.guardar.emit(valor);
    this.editando.set(false);
  }
}
