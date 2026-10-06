import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { SesionService } from '../../../services/sesion.service';

const NIVELES_ACCESO: string[] = ['Administrador', 'Marketing', 'Operaciones', 'Cocina / POS', 'Consultor'];

const CARACTERISTICAS: { icono: string; texto: string }[] = [
  { icono: 'pi pi-book', texto: 'Una carta única, gobernada desde un centro' },
  { icono: 'pi pi-share-alt', texto: 'Publicación a canal WEB propio y a agregadores conectados' },
  { icono: 'pi pi-shield', texto: 'Roles claros: quién edita la oferta, quién publica, quién opera' },
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
  private readonly router = inject(Router);

  readonly nivelesAcceso = NIVELES_ACCESO;
  readonly caracteristicas = CARACTERISTICAS;
  readonly usuario = signal('');
  readonly clave = signal('');

  // Sin backend real: cualquier click en "Ingresar" entra con el rol ya elegido en el selector de sesión del sidebar.
  ingresar(): void {
    this.sesionService.iniciarSesion();
    this.router.navigateByUrl('/');
  }
}
