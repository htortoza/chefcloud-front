import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter, map } from 'rxjs';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { EmpresaService } from '../../../services/empresa.service';
import { SesionService } from '../../../services/sesion.service';
import { SesionSwitcher } from '../sesion-switcher/sesion-switcher';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, FormsModule, Select, SesionSwitcher, Toast],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShell {
  private readonly router = inject(Router);
  readonly empresaService = inject(EmpresaService);
  readonly sesionService = inject(SesionService);

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
}
