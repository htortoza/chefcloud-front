import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { PrimeTemplate } from 'primeng/api';
import { PageHeader } from '../../shared/page-header/page-header';
import { CartaService } from '../../../services/carta.service';
import { FranjaHorariaService } from '../../../services/franja-horaria.service';
import { Canal, Carta } from '../../../data/cartas.model';

type EstadoVisible = 'borrador' | 'publicada' | 'con-cambios';
type FiltroEstado = EstadoVisible | 'todas';

const SEVERIDAD_POR_ESTADO: Record<EstadoVisible, 'secondary' | 'success' | 'warn'> = {
  borrador: 'secondary',
  publicada: 'success',
  'con-cambios': 'warn',
};

interface FilaCarta {
  carta: Carta;
  estado: EstadoVisible;
  tiendasAsignadas: number;
  vigencia: string;
  totalProductos: number;
  totalSecciones: number;
  errores: number;
  canalesEstado: { canal: Canal; publicado: boolean }[];
}

@Component({
  selector: 'app-carta-list',
  imports: [FormsModule, DatePipe, TableModule, Tag, Button, InputText, PrimeTemplate, PageHeader],
  templateUrl: './carta-list.html',
  styleUrl: './carta-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartaList {
  private readonly cartaService = inject(CartaService);
  private readonly franjaHorariaService = inject(FranjaHorariaService);
  private readonly router = inject(Router);

  readonly termino = signal('');
  readonly filtroEstado = signal<FiltroEstado>('todas');
  readonly soloErrores = signal(false);

  private readonly filasBase = computed<FilaCarta[]>(() =>
    this.cartaService.cartas().map((carta) => {
      const idsProductos = carta.secciones.flatMap((s) => s.items.map((i) => i.productoId));
      return {
        carta,
        estado: this.cartaService.estadoDerivado(carta),
        tiendasAsignadas: this.cartaService.tiendasAsignadas(carta.id).length,
        vigencia: this.vigenciaDe(carta),
        totalProductos: idsProductos.length,
        totalSecciones: carta.secciones.length,
        errores: this.cartaService.erroresDeCarta(carta.id),
        canalesEstado: this.cartaService.canales().map((canal) => {
          const estados = idsProductos.map((pid) => this.cartaService.estadoCanal(carta.id, canal.id, pid)?.estado ?? 'activo');
          return { canal, publicado: estados.length > 0 && estados.every((e) => e === 'activo') };
        }),
      };
    }),
  );

  readonly filas = computed<FilaCarta[]>(() => {
    const termino = this.termino().trim().toLowerCase();
    const filtro = this.filtroEstado();
    const soloErrores = this.soloErrores();
    return this.filasBase().filter((fila) => {
      if (!fila.carta.nombre.toLowerCase().includes(termino)) return false;
      if (filtro !== 'todas' && fila.estado !== filtro) return false;
      if (soloErrores && fila.errores === 0) return false;
      return true;
    });
  });

  readonly totalCartas = computed(() => this.filasBase().length);
  readonly totalBorrador = computed(() => this.filasBase().filter((f) => f.estado === 'borrador').length);
  readonly totalPublicadas = computed(() => this.filasBase().filter((f) => f.estado === 'publicada').length);
  readonly totalConCambios = computed(() => this.filasBase().filter((f) => f.estado === 'con-cambios').length);
  readonly totalConErrores = computed(() => this.filasBase().filter((f) => f.errores > 0).length);

  readonly tiendasSinCarta = computed(() => this.cartaService.tiendasSinCarta());
  readonly nombresTiendasSinCarta = computed(() => this.tiendasSinCarta().map((t) => t.nombre).join(', '));

  readonly hayFiltrosActivos = computed(() => this.filtroEstado() !== 'todas' || this.soloErrores());

  severidad(estado: EstadoVisible): 'secondary' | 'success' | 'warn' {
    return SEVERIDAD_POR_ESTADO[estado];
  }

  seleccionarEstado(estado: FiltroEstado): void {
    this.filtroEstado.set(this.filtroEstado() === estado ? 'todas' : estado);
  }

  toggleSoloErrores(): void {
    this.soloErrores.update((v) => !v);
  }

  limpiarFiltros(): void {
    this.filtroEstado.set('todas');
    this.soloErrores.set(false);
  }

  private vigenciaDe(carta: Carta): string {
    return this.franjaHorariaService.obtenerPorId(carta.franjaId)?.nombre ?? 'General';
  }

  crearCarta(): void {
    const id = this.cartaService.crear('Nueva carta');
    this.router.navigate(['/cartas', id]);
  }

  abrirCarta(cartaId: string): void {
    this.router.navigate(['/cartas', cartaId]);
  }
}
