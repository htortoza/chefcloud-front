export interface Submodulo {
  clave: string;
  etiqueta: string;
  icono: string;
  ruta: string;
  implementado: boolean;
}

export interface Modulo {
  clave: string;
  etiqueta: string;
  empresasHabilitadas: string[];
  submodulos: Submodulo[];
}
