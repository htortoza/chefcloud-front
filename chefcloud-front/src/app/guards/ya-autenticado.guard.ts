import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../services/sesion.service';

/** Si ya hay sesión iniciada, /login nunca debe renderizarse (evita el sidebar fantasma al volver atrás con el browser). */
export const yaAutenticadoGuard: CanActivateFn = () => {
  const sesionService = inject(SesionService);
  const router = inject(Router);
  return sesionService.autenticado() ? router.parseUrl('/') : true;
};
