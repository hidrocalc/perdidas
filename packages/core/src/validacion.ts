/** Validación de entradas (Especificación v1, sección Entradas). */
import type { Material } from "@dw/data";
import { buscarMaterial, diTablaMm, factorCaudal, kSingularidad } from "./tablas";
import type { CampoError, Entrada, ErrorEntrada } from "./tipos";

interface Rango {
  readonly min: number;
  readonly max: number;
  /** true: el mínimo no está incluido (0 < x). */
  readonly minExclusivo: boolean;
}

export const RANGOS = {
  di_manual: { min: 1, max: 5000, minExclusivo: false },
  k_manual: { min: 0, max: 50, minExclusivo: false },
  c_manual: { min: 50, max: 160, minExclusivo: false },
  L: { min: 0, max: 100000, minExclusivo: true },
  T: { min: 0, max: 60, minExclusivo: false },
  Q_m3s: { min: 0, max: 10, minExclusivo: true },
  cantidad: { min: 0, max: 999, minExclusivo: false },
  extra_k: { min: 0, max: 100, minExclusivo: false },
} as const satisfies Record<string, Rango>;

export const MAX_SINGULARIDADES_EXTRA = 10;
export const MAX_NOMBRE_EXTRA = 60;

function fueraDeRango(v: number, r: Rango): boolean {
  if (!Number.isFinite(v)) return true;
  const bajo = r.minExclusivo ? v <= r.min : v < r.min;
  return bajo || v > r.max;
}

declare const marcaValidada: unique symbol;

/**
 * Entrada validada y con todas las búsquedas en tablas ya resueltas.
 * Solo `validar()` puede producirla (tipo con marca): el cálculo nunca
 * recibe datos inválidos ni necesita volver a consultar tablas.
 */
export interface EntradaValidada {
  readonly [marcaValidada]: true;
  readonly entrada: Entrada;
  readonly di_mm: number;
  readonly material: Material;
  readonly factor_caudal: number;
  /** En el orden de `entrada.cantidades` (orden de suma, igual que el oráculo). */
  readonly singularidades: readonly { readonly n: number; readonly k: number }[];
}

export type Validacion =
  | { readonly ok: true; readonly validada: EntradaValidada }
  | { readonly ok: false; readonly errores: readonly ErrorEntrada[] };

/** Mismo orden de verificación que el oráculo: el orden de los errores es parte del contrato. */
export function validar(e: Entrada): Validacion {
  const errores: ErrorEntrada[] = [];
  const rango = (campo: CampoError, v: number, r: Rango): void => {
    if (fueraDeRango(v, r)) errores.push({ codigo: "E-RANGO", campo });
  };

  let di: number | undefined;
  if (e.tabla !== "PVC" && e.tabla !== "PE" && e.tabla !== "Manual") {
    errores.push({ codigo: "E-RANGO", campo: "tabla" });
  } else if (e.tabla === "Manual") {
    if (e.di_manual === null) errores.push({ codigo: "E-VACIO", campo: "di_manual" });
    else {
      rango("di_manual", e.di_manual, RANGOS.di_manual);
      di = e.di_manual;
    }
  } else {
    di = e.dn === null || e.pn === null ? undefined : diTablaMm(e.tabla, e.dn, e.pn);
    if (di === undefined) errores.push({ codigo: "E-RANGO", campo: "dn_pn" });
  }

  const material = buscarMaterial(e.material);
  if (material === undefined) errores.push({ codigo: "E-RANGO", campo: "material" });
  if (e.k_manual !== null) rango("k_manual", e.k_manual, RANGOS.k_manual);
  if (e.c_manual !== null) rango("c_manual", e.c_manual, RANGOS.c_manual);
  rango("L", e.L, RANGOS.L);
  rango("T", e.T, RANGOS.T);

  const factor = factorCaudal(e.Q_unidad);
  if (factor === undefined) errores.push({ codigo: "E-RANGO", campo: "Q_unidad" });
  else rango("Q_m3s", e.Q_valor * factor, RANGOS.Q_m3s);

  const singularidades: { n: number; k: number }[] = [];
  for (const [nombre, n] of Object.entries(e.cantidades)) {
    const k = kSingularidad(nombre);
    if (k === undefined || !Number.isInteger(n)) {
      errores.push({ codigo: "E-RANGO", campo: "cantidad" });
    } else {
      rango("cantidad", n, RANGOS.cantidad);
      singularidades.push({ n, k });
    }
  }

  if (e.singularidades_extra.length > MAX_SINGULARIDADES_EXTRA) errores.push({ codigo: "E-RANGO", campo: "extra_max" });
  for (const x of e.singularidades_extra) {
    if (typeof x.nombre !== "string" || x.nombre.length > MAX_NOMBRE_EXTRA) {
      errores.push({ codigo: "E-RANGO", campo: "extra_nombre" });
    }
    if (x.k === null) errores.push({ codigo: "E-VACIO", campo: "extra_k" });
    else rango("extra_k", x.k, RANGOS.extra_k);
    if (x.cantidad === null || !Number.isInteger(x.cantidad)) errores.push({ codigo: "E-RANGO", campo: "extra_cantidad" });
    else rango("extra_cantidad", x.cantidad, RANGOS.cantidad);
    if (x.k !== null && x.cantidad !== null) singularidades.push({ n: x.cantidad, k: x.k });
  }

  if (errores.length > 0 || di === undefined || material === undefined || factor === undefined) {
    return { ok: false, errores };
  }
  const validada = { entrada: e, di_mm: di, material, factor_caudal: factor, singularidades };
  // Único punto del código donde se aplica la marca de "validada".
  return { ok: true, validada: validada as unknown as EntradaValidada };
}

/** Valores por defecto (Especificación v1, columna "Por defecto"). */
export const ENTRADA_POR_DEFECTO: Entrada = {
  tabla: "PVC",
  dn: 180,
  pn: 6,
  di_manual: null,
  material: "Cloruro de polivinilo (PVC)",
  k_manual: null,
  c_manual: null,
  L: 50,
  T: 20,
  Q_valor: 280000,
  Q_unidad: "l/h",
  cantidades: {
    "Entrada de tubería proyectada (reentrante)": 1,
    "Salida de tubería (a depósito)": 1,
  },
  singularidades_extra: [],
};
