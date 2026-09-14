import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../services/sesion.service';

export const soloCompradorExternoGuard: CanActivateFn = () => {
  const sesionService = inject(SesionService);
  const router = inject(Router);
  return sesionService.esCompradorExterno() ? true : router.parseUrl('/giftcards');
};
