/**
 * @dw/data — tablas de la app, generadas desde el Excel corregido por
 * oracle/export_tables.py. Este archivo solo agrega tipos: los datos viven
 * en tablas.json y nunca se editan a mano.
 */
import datos from "./tablas.json";

export interface Material {
  readonly material: string;
  readonly k_min_mm: number;
  readonly k_max_mm: number;
  readonly c_hw: number;
  readonly grupo: string;
}

export interface PuntoViscosidad {
  readonly t_c: number;
  readonly nu_m2s: number;
}

export interface Diametro {
  readonly dn: number;
  readonly pn: number;
  readonly di_mm: number;
}

export interface Singularidad {
  readonly singularidad: string;
  readonly k: number;
  readonly nota: string;
}

export interface FactorCaudal {
  readonly unidad: string;
  readonly num: number;
  readonly den: number;
}

export interface Constantes {
  readonly g: number;
  readonly tolerancia: number;
  readonly re_laminar: number;
  readonly re_turbulento: number;
  readonly v_min: number;
  readonly v_max: number;
  readonly max_iter: number;
  readonly f0_liso: number;
  readonly colebrook_a: number;
  readonly colebrook_b: number;
}

export interface Tablas {
  readonly version_tablas: string;
  readonly fuente: string;
  readonly constantes: Constantes;
  readonly materiales: readonly Material[];
  readonly viscosidad: readonly PuntoViscosidad[];
  readonly diametros: { readonly PVC: readonly Diametro[]; readonly PE: readonly Diametro[] };
  readonly singularidades: readonly Singularidad[];
  readonly caudal: readonly FactorCaudal[];
}

export const TABLAS: Tablas = datos;
