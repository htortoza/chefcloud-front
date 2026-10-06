export interface TiendaMock {
  id: string;
  nombre: string;
}

// Tiendas real (con dirección, horario, contacto) es un módulo aparte, fuera de este ciclo —
// esta lista fija alcanza para probar Asignación sin esa pantalla.
export const TIENDAS_MOCK: TiendaMock[] = [
  { id: 'tienda-1', nombre: 'Sucursal Providencia' },
  { id: 'tienda-2', nombre: 'Sucursal Ñuñoa' },
  { id: 'tienda-3', nombre: 'Sucursal Mall Plaza' },
];
