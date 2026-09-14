import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../services/sesion.service';

export const soloAdministradorHoldingGuard: CanActivateFn = () => {
  const sesionService = inject(SesionService);
  const router = inject(Router);
  return sesionService.puedeCrearAccesoExterno() ? true : router.parseUrl('/giftcards');
};
