export interface ItemNavegacion {
  clave: string;
  etiqueta: string;
  icono: string;
  ruta: string;
  implementado: boolean;
}

export const ITEMS_NAVEGACION: ItemNavegacion[] = [
  { clave: 'cartas', etiqueta: 'Cartas', icono: 'pi pi-list', ruta: '/cartas', implementado: true },
  { clave: 'productos', etiqueta: 'Productos', icono: 'pi pi-box', ruta: '/productos', implementado: true },
  { clave: 'adicionales', etiqueta: 'Adicionales', icono: 'pi pi-tags', ruta: '/adicionales', implementado: true },
  { clave: 'tiendas', etiqueta: 'Tiendas', icono: 'pi pi-shop', ruta: '/tiendas', implementado: false },
  { clave: 'canales', etiqueta: 'Canales', icono: 'pi pi-share-alt', ruta: '/canales', implementado: false },
  { clave: 'pedidos', etiqueta: 'Pedidos', icono: 'pi pi-receipt', ruta: '/pedidos', implementado: false },
  { clave: 'usuarios', etiqueta: 'Usuarios', icono: 'pi pi-users', ruta: '/usuarios', implementado: false },
];
