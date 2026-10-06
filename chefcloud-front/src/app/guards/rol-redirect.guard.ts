import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/** Landing por defecto tras login. Un solo destino hoy porque Productos y Cartas son los únicos
 *  módulos activos y todos los roles los ven — vuelve a ramificar por rol cuando un segundo
 *  módulo (Tiendas/Canales) necesite un destino distinto según el rol. */
export const rolRedirectGuard: CanActivateFn = () => {
  const router = inject(Router);
  return router.parseUrl('/cartas');
};
