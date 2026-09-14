import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../services/sesion.service';

export const rolRedirectGuard: CanActivateFn = () => {
  const sesionService = inject(SesionService);
  const router = inject(Router);
  return router.parseUrl(sesionService.esCompradorExterno() ? '/mi-lote' : '/giftcards');
};
