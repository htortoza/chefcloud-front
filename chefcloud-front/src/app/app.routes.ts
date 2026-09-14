import { Routes } from '@angular/router';
import { autenticadoGuard } from './guards/autenticado.guard';
import { yaAutenticadoGuard } from './guards/ya-autenticado.guard';
import { rolRedirectGuard } from './guards/rol-redirect.guard';
import { soloInternoGuard } from './guards/solo-interno.guard';
import { soloAdministradorHoldingGuard } from './guards/solo-administrador-holding.guard';
import { soloCompradorExternoGuard } from './guards/solo-comprador-externo.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [yaAutenticadoGuard],
    loadComponent: () => import('./components/login/login-screen/login-screen').then((m) => m.LoginScreen),
  },
  { path: '', pathMatch: 'full', canActivate: [autenticadoGuard, rolRedirectGuard], children: [] },
  {
    path: 'giftcards',
    canActivate: [autenticadoGuard, soloInternoGuard],
    loadComponent: () => import('./components/giftcard/giftcard-list/giftcard-list').then((m) => m.GiftcardList),
  },
  {
    path: 'accesos-externos',
    canActivate: [autenticadoGuard, soloInternoGuard, soloAdministradorHoldingGuard],
    loadComponent: () => import('./components/giftcard/acceso-externo-list/acceso-externo-list').then((m) => m.AccesoExternoList),
  },
  {
    path: 'mi-lote',
    canActivate: [autenticadoGuard, soloCompradorExternoGuard],
    loadComponent: () => import('./components/giftcard/portal-externo/portal-externo').then((m) => m.PortalExterno),
  },
];
