import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmationService } from 'primeng/api';
import { ProductoList } from './producto-list';
import { ProductoService } from '../../../services/producto.service';

describe('ProductoList', () => {
  let fixture: ComponentFixture<ProductoList>;
  let productoService: ProductoService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProductoList], providers: [ConfirmationService] }).compileComponents();
    fixture = TestBed.createComponent(ProductoList);
    productoService = TestBed.inject(ProductoService);
    fixture.detectChanges();
  });

  it('lista una fila por producto existente', () => {
    const filas = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(filas.length).toBe(productoService.todos().length);
  });

  it('archivar un producto lo muestra con el tag "Archivado"', () => {
    const [primero] = productoService.todos();
    productoService.archivar(primero.id);
    fixture.detectChanges();
    const tags = Array.from(fixture.nativeElement.querySelectorAll('.productos-estado-tag')) as HTMLElement[];
    expect(tags.some((t) => t.textContent?.includes('Archivado'))).toBe(true);
  });

  it('llegar con productoId + cartaId por query param abre el drawer de ese producto con contexto de carta', () => {
    const [producto] = productoService.todos();
    fixture.componentRef.setInput('productoId', producto.id);
    fixture.componentRef.setInput('cartaId', 'carta-1');
    fixture.detectChanges();

    expect(fixture.componentInstance.productoEnEdicion()?.id).toBe(producto.id);
    expect(fixture.componentInstance.cartaIdEnEdicion()).toBe('carta-1');
  });

  it('abrir un producto haciendo clic en la fila (manual) no arrastra un cartaId previo', () => {
    const [productoA, productoB] = productoService.todos();
    fixture.componentRef.setInput('productoId', productoA.id);
    fixture.componentRef.setInput('cartaId', 'carta-1');
    fixture.detectChanges();

    fixture.componentInstance.abrirEdicion(productoB);

    expect(fixture.componentInstance.cartaIdEnEdicion()).toBeNull();
  });
});
