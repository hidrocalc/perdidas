/** Algoritmo de cálculo (Especificación v1, sección Algoritmo de cálculo, pasos 1 a 10). */
import { TABLAS } from "@dw/data";
import { kTablaMm, viscosidad } from "./tablas";
import type { Advertencia, Calculo, Entrada, FilaIteracion, Regimen } from "./tipos";
import { validar, type EntradaValidada } from "./validacion";

const CT = TABLAS.constantes;

export type Colebrook =
  | { readonly ok: true; readonly f: number; readonly iteraciones: number; readonly f0: number; readonly filas: readonly FilaIteracion[] }
  | { readonly ok: false };

/** Paso 7: iteración de Colebrook-White con arranque rugoso (o f0 = 0,02 si K = 0). */
export function colebrook(Re: number, K: number, D: number): Colebrook {
  const a = CT.colebrook_a;
  const b = CT.colebrook_b;
  const f0 = K > 0 ? (-2 * Math.log10(K / (b * D))) ** -2 : CT.f0_liso;
  const filas: FilaIteracion[] = [];
  let fi = f0;
  for (let i = 1; i <= CT.max_iter; i++) {
    const f1 = (-2 * Math.log10(a / (Re * Math.sqrt(fi)) + K / (b * D))) ** -2;
    const delta = Math.abs(f1 - fi);
    filas.push({ i, f_in: fi, f_out: f1, delta });
    if (delta < CT.tolerancia) return { ok: true, f: f1, iteraciones: i, f0, filas };
    fi = f1;
  }
  return { ok: false };
}

/** Paso 6 (validado). Laminar si Re < 2000; transición si 2000 <= Re <= 4000; turbulento si Re > 4000. */
export function regimenDe(Re: number): Regimen {
  if (Re < CT.re_laminar) return "laminar";
  if (Re <= CT.re_turbulento) return "transicion";
  return "turbulento";
}

/** Advertencias (Especificación v1, sección Advertencias y errores). Límites estrictos. */
export function advertenciasDe(x: {
  readonly regimen: Regimen; readonly V: number; readonly KD: number; readonly T: number; readonly D: number;
}): Advertencia[] {
  const a: Advertencia[] = [];
  if (x.regimen === "laminar") a.push("A-LAMINAR");
  if (x.regimen === "transicion") a.push("A-TRANSICION");
  if (x.V > CT.v_max) a.push("A-VEL-ALTA");
  if (x.V < CT.v_min) a.push("A-VEL-BAJA");
  if (x.KD > 0.05) a.push("A-KD");
  if (x.T < 5 || x.T > 25 || x.D < 0.05) a.push("A-HW");
  return a;
}

/** Calcula a partir de una entrada ya validada (los lookups no pueden fallar). */
export function calcularValidada(v: EntradaValidada): Calculo {
  const g = CT.g;
  const e = v.entrada;
  const material = v.material;
  // Paso 1
  const D = v.di_mm / 1000.0;
  const K = (e.k_manual ?? kTablaMm(material)) / 1000.0;
  const C = e.c_manual ?? material.c_hw;
  // Pasos 2 a 5
  const nu = viscosidad(e.T);
  const Q = e.Q_valor * v.factor_caudal;
  const A = (Math.PI * D ** 2) / 4;
  const V = Q / A;
  const Re = (V * D) / nu;
  // Paso 6
  const regimen = regimenDe(Re);
  // Paso 7
  let f: number;
  let iteraciones: number;
  let f0: number | null;
  let filas: readonly FilaIteracion[];
  if (regimen === "laminar") {
    f = 64.0 / Re;
    iteraciones = 0;
    f0 = null;
    filas = [];
  } else {
    const cb = colebrook(Re, K, D);
    if (!cb.ok) return { ok: false, errores: [{ codigo: "E-NOCONV", campo: null }] };
    ({ f, iteraciones, f0, filas } = cb);
  }
  // Paso 8
  const f_sj = 0.25 / Math.log10(K / (3.7 * D) + 5.74 / Re ** 0.9) ** 2;
  // Paso 9
  const hv = V ** 2 / (2 * g);
  const hf = f * (e.L / D) * hv;
  let sumaK = 0;
  for (const { n, k } of v.singularidades) sumaK += n * k;
  const hloc = sumaK * hv;
  const total = hf + hloc;
  // Paso 10
  const hf_hw = (10.679 * e.L * Q ** 1.852) / (C ** 1.852 * D ** 4.87);
  const J = hf / e.L;

  const advertencias = advertenciasDe({ regimen, V, KD: K / D, T: e.T, D });

  return {
    ok: true,
    intermedios: { D_m: D, K_m: K, C, nu_m2s: nu, Q_m3s: Q, A_m2: A, K_sobre_D: K / D, f0, hv_m: hv, suma_K: sumaK },
    resultados: {
      V, Re, regimen, f, iteraciones, f_sj, hf_dw: hf, hf_hw, dif_hw_dw: hf_hw / hf - 1,
      h_loc: hloc, h_total: total, J, hf_100m: J * 100,
    },
    advertencias,
    iteraciones_detalle: filas,
  };
}

/** Punto de entrada único: valida y calcula. Nunca lanza excepciones. */
export function calcular(e: Entrada): Calculo {
  const v = validar(e);
  return v.ok ? calcularValidada(v.validada) : { ok: false, errores: v.errores };
}
