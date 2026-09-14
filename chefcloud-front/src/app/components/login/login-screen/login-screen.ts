import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { SesionService } from '../../../services/sesion.service';
import { AccesoExternoService } from '../../../services/acceso-externo.service';

const NIVELES_ACCESO: string[] = ['Master', 'Administrador Holding', 'Administrador Tienda', 'Usuario POS', 'Comprador Externo'];

const CARACTERISTICAS: { icono: string; texto: string }[] = [
  { icono: 'pi pi-bolt', texto: 'Un mismo motor para descuentos, giftcards, códigos QR y fidelización' },
  { icono: 'pi pi-sitemap', texto: 'Gobernanza por holding, tienda o comprador externo' },
  { icono: 'pi pi-shield', texto: 'Acceso B2B acotado a un lote, nunca al resto del sistema' },
];

@Component({
  selector: 'app-login-screen',
  imports: [FormsModule, InputText, Password, Button],
  templateUrl: './login-screen.html',
  styleUrl: './login-screen.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginScreen {
  private readonly sesionService = inject(SesionService);
  private readonly accesoExternoService = inject(AccesoExternoService);
  private readonly router = inject(Router);

  readonly nivelesAcceso = NIVELES_ACCESO;
  readonly caracteristicas = CARACTERISTICAS;
  readonly usuario = signal('');
  readonly clave = signal('');

  /**
   * Sin backend real: el correo se matchea contra las cuentas de Comprador Externo ya creadas
   * por un Administrador Holding. Si no matchea, sigue el comportamiento decorativo de siempre
   * (entra con el rol que ya esté elegido en el selector de sesión del sidebar).
   */
  ingresar(): void {
    const cuentaExterna = this.accesoExternoService.buscarPorEmail(this.usuario());
    if (cuentaExterna) {
      this.sesionService.entrarComoCompradorExterno(cuentaExterna.id, cuentaExterna.nombre);
    }
    this.sesionService.iniciarSesion();
    this.router.navigateByUrl('/');
  }
}
