import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeTemplate } from 'primeng/api';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { GiftcardService } from '../../../services/giftcard.service';
import { CampanaService } from '../../../services/campana.service';
import { SesionService } from '../../../services/sesion.service';
import { ActivarGiftcardPayload, BloquearGiftcardPayload, CrearGiftcardPayload, Giftcard, GiftcardEstado, ReiniciarActivacionPayload, calcularEstadoGiftcard } from '../../../data/giftcard.model';
import { GiftcardCreateModal } from '../giftcard-create-modal/giftcard-create-modal';
import { GiftcardDetailDrawer } from '../giftcard-detail-drawer/giftcard-detail-drawer';
import { GiftcardInformePanel } from '../giftcard-informe-panel/giftcard-informe-panel';
import { CampanaCardGrid } from '../campana-card-grid/campana-card-grid';
import { PageHeader } from '../../shared/page-header/page-header';

type FiltroEstado = GiftcardEstado | 'todos';
type Vista = 'lista' | 'campanas';

const OPCIONES_VISTA: { label: string; value: Vista }[] = [
  { label: 'Códigos', value: 'lista' },
  { label: 'Campañas', value: 'campanas' },
];

interface GiftcardFila extends Giftcard {
  estadoCalculado: GiftcardEstado;
  estadoEtiqueta: string;
  estadoSeveridad: 'success' | 'warn' | 'secondary';
  campanaNombre: string | null;
}

type FilaTabla =
  | { id: string; tipo: 'campana'; campanaId: string; nombre: string; cantidad: number; expandida: boolean }
  | { id: string; tipo: 'giftcard'; anidada: boolean; giftcard: GiftcardFila };

const ESTADO_INFO: Record<GiftcardEstado, { etiqueta: string; severidad: GiftcardFila['estadoSeveridad'] }> = {
  'sin-activar': { etiqueta: 'Sin activar', severidad: 'secondary' },
  activa: { etiqueta: 'Activa', severidad: 'success' },
  agotada: { etiqueta: 'Agotada', severidad: 'secondary' },
  inactiva: { etiqueta: 'Inactiva', severidad: 'warn' },
};

const OPCIONES_ESTADO: { label: string; value: FiltroEstado }[] = [
  { label: 'Todos los estados', value: 'todos' },
  { label: 'Sin activar', value: 'sin-activar' },
  { label: 'Activa', value: 'activa' },
  { label: 'Agotada', value: 'agotada' },
  { label: 'Inactiva', value: 'inactiva' },
];

@Component({
  selector: 'app-giftcard-list',
  imports: [
    CurrencyPipe,
    FormsModule,
    PrimeTemplate,
    Card,
    TableModule,
    Tag,
    Button,
    InputText,
    Select,
    SelectButton,
    IconField,
    InputIcon,
    GiftcardCreateModal,
    GiftcardDetailDrawer,
    GiftcardInformePanel,
    CampanaCardGrid,
    PageHeader,
  ],
  templateUrl: './giftcard-list.html',
  styleUrl: './giftcard-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GiftcardList {
  private readonly giftcardService = inject(GiftcardService);
  private readonly campanaService = inject(CampanaService);
  readonly sesionService = inject(SesionService);

  readonly opcionesEstado = OPCIONES_ESTADO;
  readonly opcionesVista = OPCIONES_VISTA;

  readonly vista = signal<Vista>('lista');
  readonly filtroCampanaId = signal<string | null>(null);
  readonly busqueda = signal('');
  readonly filtroEstado = signal<FiltroEstado>('todos');
  readonly modalCrearVisible = signal(false);
  readonly detalleVisible = signal(false);
  readonly giftcardSeleccionada = signal<Giftcard | null>(null);
  readonly campanasExpandidas = signal<ReadonlySet<string>>(new Set());

  readonly campanaFiltroNombre = computed(() => {
    const id = this.filtroCampanaId();
    return id ? this.campanaService.campanaPorId(id)?.nombre ?? null : null;
  });

  readonly metricas = computed(() => {
    const campanaId = this.filtroCampanaId();
    if (!campanaId) return this.giftcardService.metricas();

    const propias = this.giftcardService.giftcardsDeEmpresaActiva().filter((g) => g.campanaId === campanaId);
    const estados = propias.map((g) => calcularEstadoGiftcard(g));
    return {
      vigentesSinVender: estados.filter((e) => e === 'sin-activar').length,
      activas: estados.filter((e) => e === 'activa').length,
      saldoRealEmitido: propias.filter((g, i) => estados[i] === 'activa').reduce((total, g) => total + g.saldo, 0),
      inactivas: estados.filter((e) => e === 'agotada' || e === 'inactiva').length,
    };
  });

  readonly filas = computed<GiftcardFila[]>(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const filtro = this.filtroEstado();
    const filtroCampana = this.filtroCampanaId();
    const campanas = this.campanaService.campanasDeEmpresaActiva();

    return this.giftcardService
      .giftcardsDeEmpresaActiva()
      .map((giftcard) => ({ giftcard, estadoCalculado: calcularEstadoGiftcard(giftcard) }))
      .filter(({ giftcard, estadoCalculado }) => {
        const coincideTexto =
          !texto || giftcard.codigo.toLowerCase().includes(texto) || (giftcard.cliente?.toLowerCase().includes(texto) ?? false);
        const coincideEstado = filtro === 'todos' || estadoCalculado === filtro;
        const coincideCampana = !filtroCampana || giftcard.campanaId === filtroCampana;
        // Sin filtro explícito de campaña, los códigos de campañas archivadas no ensucian el listado general.
        const campana = giftcard.campanaId ? campanas.find((c) => c.id === giftcard.campanaId) : null;
        const ocultaPorArchivada = !filtroCampana && campana?.archivada === true;
        return coincideTexto && coincideEstado && coincideCampana && !ocultaPorArchivada;
      })
      .map(({ giftcard, estadoCalculado }) => ({
        ...giftcard,
        estadoCalculado,
        ...toEtiquetaEstado(estadoCalculado),
        campanaNombre: campanas.find((campana) => campana.id === giftcard.campanaId)?.nombre ?? null,
      }));
  });

  readonly filasTabla = computed<FilaTabla[]>(() => {
    const filas = this.filas();

    if (this.filtroCampanaId()) {
      return filas.map((giftcard) => ({ id: giftcard.id, tipo: 'giftcard' as const, anidada: false, giftcard }));
    }

    const expandidas = this.campanasExpandidas();
    const porCampana = new Map<string, GiftcardFila[]>();
    const sueltas: GiftcardFila[] = [];

    for (const fila of filas) {
      if (fila.campanaId) {
        const grupo = porCampana.get(fila.campanaId) ?? [];
        grupo.push(fila);
        porCampana.set(fila.campanaId, grupo);
      } else {
        sueltas.push(fila);
      }
    }

    const resultado: FilaTabla[] = [];
    for (const [campanaId, giftcards] of porCampana) {
      const expandida = expandidas.has(campanaId);
      resultado.push({
        id: `campana-fila-${campanaId}`,
        tipo: 'campana',
        campanaId,
        nombre: giftcards[0].campanaNombre ?? '—',
        cantidad: giftcards.length,
        expandida,
      });
      if (expandida) {
        for (const giftcard of giftcards) resultado.push({ id: giftcard.id, tipo: 'giftcard', anidada: true, giftcard });
      }
    }
    for (const giftcard of sueltas) resultado.push({ id: giftcard.id, tipo: 'giftcard', anidada: false, giftcard });

    return resultado;
  });

  toggleCampana(campanaId: string): void {
    this.campanasExpandidas.update((actual) => {
      const siguiente = new Set(actual);
      siguiente.has(campanaId) ? siguiente.delete(campanaId) : siguiente.add(campanaId);
      return siguiente;
    });
  }

  crearGiftcard(payload: CrearGiftcardPayload): void {
    this.giftcardService.crear(payload);
  }

  activarGiftcard(payload: ActivarGiftcardPayload): void {
    this.giftcardService.activar(payload);
  }

  bloquearGiftcard(payload: BloquearGiftcardPayload): void {
    this.giftcardService.bloquear(payload);
  }

  reiniciarActivacionGiftcard(payload: ReiniciarActivacionPayload): void {
    this.giftcardService.reiniciarActivacion(payload);
  }

  verDetalle(giftcard: Giftcard): void {
    this.giftcardSeleccionada.set(giftcard);
    this.detalleVisible.set(true);
  }

  abrirCampana(campanaId: string): void {
    this.filtroCampanaId.set(campanaId);
    this.busqueda.set('');
    this.filtroEstado.set('todos');
    this.vista.set('lista');
  }

  limpiarFiltroCampana(): void {
    this.filtroCampanaId.set(null);
    this.vista.set('campanas');
  }
}

function toEtiquetaEstado(estado: GiftcardEstado): { estadoEtiqueta: string; estadoSeveridad: GiftcardFila['estadoSeveridad'] } {
  const info = ESTADO_INFO[estado];
  return { estadoEtiqueta: info.etiqueta, estadoSeveridad: info.severidad };
}
