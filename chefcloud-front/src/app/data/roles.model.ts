export type Rol = 'administrador' | 'marketing' | 'operaciones' | 'cocina-pos' | 'consultor';

/** Dueño de estado+precio por canal (tab Estructura de Carta). Brief v3 sección 3. */
export function puedeEditarOperacion(rol: Rol): boolean {
  return rol === 'administrador' || rol === 'operaciones';
}

/** Dueño de nombre+descripción por canal (Catálogo → Producto). Brief v3 sección 3.
 *  El permiso bloquea el campo, no la pantalla — aplica igual si el rol llega a Producto por cualquier vía. */
export function puedeEditarMarketing(rol: Rol): boolean {
  return rol === 'administrador' || rol === 'marketing';
}
