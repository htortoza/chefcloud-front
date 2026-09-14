import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditableTextField } from './editable-text-field';

describe('EditableTextField', () => {
  let fixture: ComponentFixture<EditableTextField>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EditableTextField] }).compileComponents();
    fixture = TestBed.createComponent(EditableTextField);
    fixture.componentRef.setInput('valor', 'Menú Regular');
    fixture.detectChanges();
  });

  it('modo lectura muestra el valor actual', () => {
    expect(fixture.nativeElement.textContent).toContain('Menú Regular');
  });

  it('clic en el texto entra en modo edición', () => {
    fixture.componentInstance.iniciarEdicion();
    fixture.detectChanges();

    expect(fixture.componentInstance.editando()).toBe(true);
    expect(fixture.nativeElement.querySelector('input')).toBeTruthy();
  });

  it('confirmar emite el valor recortado y sale de modo edición', () => {
    let emitido: string | undefined;
    fixture.componentInstance.guardar.subscribe((valor: string) => (emitido = valor));

    fixture.componentInstance.iniciarEdicion();
    fixture.componentInstance.borrador.set('  Nuevo nombre  ');
    fixture.componentInstance.confirmar();

    expect(emitido).toBe('Nuevo nombre');
    expect(fixture.componentInstance.editando()).toBe(false);
  });

  it('confirmar no se dispara dos veces seguidas (blur + click del mismo guardado)', () => {
    let veces = 0;
    fixture.componentInstance.guardar.subscribe(() => veces++);

    fixture.componentInstance.iniciarEdicion();
    fixture.componentInstance.borrador.set('Valor');
    fixture.componentInstance.confirmar();
    fixture.componentInstance.confirmar();

    expect(veces).toBe(1);
  });

  it('con requerido=true, un valor vacío no se guarda y vuelve a modo lectura', () => {
    fixture.componentRef.setInput('requerido', true);
    let emitido = false;
    fixture.componentInstance.guardar.subscribe(() => (emitido = true));

    fixture.componentInstance.iniciarEdicion();
    fixture.componentInstance.borrador.set('   ');
    fixture.componentInstance.confirmar();

    expect(emitido).toBe(false);
    expect(fixture.componentInstance.editando()).toBe(false);
  });

  it('sin requerido, un valor vacío sí se guarda', () => {
    let emitido: string | undefined;
    fixture.componentInstance.guardar.subscribe((valor: string) => (emitido = valor));

    fixture.componentInstance.iniciarEdicion();
    fixture.componentInstance.borrador.set('   ');
    fixture.componentInstance.confirmar();

    expect(emitido).toBe('');
  });
});
