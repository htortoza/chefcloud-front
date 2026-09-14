import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionService } from '../services/sesion.service';

/** Aislamiento estricto: el comprador externo nunca navega a pantallas internas, ni por URL directa. */
export const soloInternoGuard: CanActivateFn = () => {
  const sesionService = inject(SesionService);
  const router = inject(Router);
  return sesionService.esCompradorExterno() ? router.parseUrl('/mi-lote') : true;
};
