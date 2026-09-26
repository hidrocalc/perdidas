/**
 * Tipos del motor. Los nombres de campos coinciden 1:1 con los vectores de
 * prueba (test_vectors/*.json) generados por el oráculo en Python.
 */
export type TablaEntrada = "PVC" | "PE" | "Manual";

export interface Entrada {
  readonly tabla: string;
  readonly dn: number | null;
  readonly pn: number | null;
  readonly di_manual: number | null;
  readonly material: string;
  readonly k_manual: number | null;
  readonly c_manual: number | null;
  readonly L: number;
  readonly T: number;
  readonly Q_valor: number;
  readonly Q_unidad: string;
  /** nombre de singularidad -> cantidad. El orden de las claves es el orden de suma. */
  readonly cantidades: Readonly<Record<string, number>>;
  /** Singularidades definidas por el usuario (máximo 10). Se suman después de las de tabla. */
  readonly singularidades_extra: readonly SingularidadExtra[];
}

export interface SingularidadExtra {
  readonly nombre: string;
  readonly k: number | null;
  readonly cantidad: number | null;
}

export type CodigoError = "E-VACIO" | "E-FORMATO" | "E-RANGO" | "E-NOCONV";

export type CampoError =
  | "tabla" | "di_manual" | "dn_pn" | "material" | "k_manual" | "c_manual"
  | "L" | "T" | "Q_m3s" | "Q_unidad" | "cantidad"
  | "extra_max" | "extra_nombre" | "extra_k" | "extra_cantidad";

export interface ErrorEntrada {
  readonly codigo: CodigoError;
  readonly campo: CampoError | null;
  /**
   * Posición (desde 0) de la singularidad con el error: en `cantidades` para el campo
   * `cantidad`, en `singularidades_extra` para `extra_nombre`, `extra_k` y `extra_cantidad`.
   * null en los demás campos (Especificación 1.1).
   */
  readonly fila: number | null;
}

export type Advertencia = "A-LAMINAR" | "A-TRANSICION" | "A-VEL-ALTA" | "A-VEL-BAJA" | "A-KD" | "A-HW";

export type Regimen = "laminar" | "transicion" | "turbulento";

export interface FilaIteracion {
  readonly i: number;
  readonly f_in: number;
  readonly f_out: number;
  readonly delta: number;
}

export interface Intermedios {
  readonly D_m: number;
  readonly K_m: number;
  readonly C: number;
  readonly nu_m2s: number;
  readonly Q_m3s: number;
  readonly A_m2: number;
  readonly K_sobre_D: number;
  readonly f0: number | null;
  readonly hv_m: number;
  readonly suma_K: number;
  /** Caudal equivalente para mostrar, con las fórmulas del Excel (Especificación 1.1, paso 3). */
  readonly Q_m3h: number;
  readonly Q_ls: number;
  readonly Q_lh: number;
}

export interface Resultados {
  readonly V: number;
  readonly Re: number;
  readonly regimen: Regimen;
  readonly f: number;
  readonly iteraciones: number;
  readonly f_sj: number;
  /** f_SJ/f − 1 (Especificación 1.1, paso 8). */
  readonly dif_sj: number;
  readonly hf_dw: number;
  readonly hf_hw: number;
  readonly dif_hw_dw: number;
  readonly h_loc: number;
  readonly h_total: number;
  readonly J: number;
  readonly hf_100m: number;
}

export type Calculo =
  | {
      readonly ok: true;
      readonly intermedios: Intermedios;
      readonly resultados: Resultados;
      readonly advertencias: readonly Advertencia[];
      readonly iteraciones_detalle: readonly FilaIteracion[];
    }
  | { readonly ok: false; readonly errores: readonly ErrorEntrada[] };
