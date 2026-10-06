import { Routes } from '@angular/router';
import { autenticadoGuard } from './guards/autenticado.guard';
import { yaAutenticadoGuard } from './guards/ya-autenticado.guard';
import { rolRedirectGuard } from './guards/rol-redirect.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [yaAutenticadoGuard],
    loadComponent: () => import('./components/login/login-screen/login-screen').then((m) => m.LoginScreen),
  },
  {
    path: 'productos',
    canActivate: [autenticadoGuard],
    loadComponent: () => import('./components/productos/producto-list/producto-list').then((m) => m.ProductoList),
  },
  {
    path: 'cartas',
    canActivate: [autenticadoGuard],
    loadComponent: () => import('./components/cartas/carta-list/carta-list').then((m) => m.CartaList),
  },
  {
    path: 'cartas/:id',
    canActivate: [autenticadoGuard],
    loadComponent: () => import('./components/cartas/carta-detail/carta-detail').then((m) => m.CartaDetail),
  },
  {
    path: 'adicionales',
    canActivate: [autenticadoGuard],
    loadComponent: () => import('./components/adicionales/adicional-list/adicional-list').then((m) => m.AdicionalList),
  },
  {
    path: 'adicionales/:id',
    canActivate: [autenticadoGuard],
    loadComponent: () => import('./components/adicionales/adicional-detail/adicional-detail').then((m) => m.AdicionalDetail),
  },
  { path: '', pathMatch: 'full', canActivate: [autenticadoGuard, rolRedirectGuard], children: [] },
];
