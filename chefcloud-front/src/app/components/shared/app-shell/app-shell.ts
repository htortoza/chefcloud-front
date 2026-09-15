import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { Toast } from 'primeng/toast';
import { Menu } from 'primeng/menu';
import type { MenuItem } from 'primeng/api';
import { ITEMS_NAVEGACION } from '../../../data/shell.model';
import { MarcaContextService } from '../../../services/marca-context.service';
import { SesionService } from '../../../services/sesion.service';
import { SesionSwitcher } from '../sesion-switcher/sesion-switcher';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, SesionSwitcher, Toast, Menu],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShell {
  private readonly router = inject(Router);
  readonly marcaContextService = inject(MarcaContextService);
  readonly sesionService = inject(SesionService);
  readonly itemsNavegacion = ITEMS_NAVEGACION;

  readonly itemsMenuCuenta: MenuItem[] = [
    { label: 'Cerrar sesión', icon: 'pi pi-sign-out', command: () => this.cerrarSesion() },
    { label: 'Mi perfil (Próximamente)', icon: 'pi pi-user', disabled: true },
    { label: 'Preferencias (Próximamente)', icon: 'pi pi-cog', disabled: true },
  ];

  /**
   * autenticado() se pone en true antes de que termine la navegación fuera de /login (lo necesita el
   * guard para dejar pasar). Si la sidebar dependiera solo de autenticado(), aparecería un instante con
   * el login todavía en pantalla. Por eso también exige que la URL ya haya cambiado de ruta.
   */
  private readonly urlActual = toSignal(
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      map((evento) => evento.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly mostrarSidebar = computed(() => this.sesionService.autenticado() && !this.urlActual().startsWith('/login'));

  private cerrarSesion(): void {
    this.sesionService.cerrarSesion();
    this.router.navigateByUrl('/login');
  }
}
