import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CanalTarjeta } from './canal-tarjeta';
import { CartaService } from '../../../services/carta.service';
import { ProductoService } from '../../../services/producto.service';
import { SesionService } from '../../../services/sesion.service';

describe('CanalTarjeta', () => {
  let fixture: ComponentFixture<CanalTarjeta>;
  let cartaService: CartaService;
  let productoService: ProductoService;
  let sesionService: SesionService;
  let cartaId: string;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CanalTarjeta] }).compileComponents();
    cartaService = TestBed.inject(CartaService);
    productoService = TestBed.inject(ProductoService);
    sesionService = TestBed.inject(SesionService);
    cartaId = cartaService.crear('Carta de prueba');
    fixture = TestBed.createComponent(CanalTarjeta);
  });

  function montar(productoId: string, canalId: string) {
    fixture.componentRef.setInput('producto', productoService.todos().find((p) => p.id === productoId));
    fixture.componentRef.setInput('canal', cartaService.canales().find((c) => c.id === canalId));
    fixture.componentRef.setInput('cartaId', cartaId);
    fixture.detectChanges();
  }

  it('editar el precio igual al precio base limpia el override', () => {
    const [producto] = productoService.todos();
    const [canal] = cartaService.canales();
    montar(producto.id, canal.id);

    fixture.componentInstance.actualizarPrecio(9999);
    expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.precio).toBe(9999);

    fixture.componentInstance.actualizarPrecio(producto.precioVenta);
    expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.precio).toBeUndefined();
  });

  it('reintentar limpia el error del diagnóstico', () => {
    const [producto] = productoService.todos();
    const [canal] = cartaService.canales();
    cartaService.simularErrorCanal(cartaId, canal.id, producto.id, 'Actualizar precio', 'Timeout');
    montar(producto.id, canal.id);

    fixture.componentInstance.reintentar();

    expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.estado).toBe('activo');
  });

  it('rol marketing no puede editar precio — el permiso bloquea el campo', () => {
    const [producto] = productoService.todos();
    const [canal] = cartaService.canales();
    sesionService.entrarComo('marketing', 'Marketing Demo');
    montar(producto.id, canal.id);

    fixture.componentInstance.actualizarPrecio(5000);

    expect(cartaService.estadoCanal(cartaId, canal.id, producto.id)?.precio).toBeUndefined();
  });
});
