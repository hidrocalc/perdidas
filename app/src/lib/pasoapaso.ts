/**
 * Vista "paso a paso" (uso didáctico): los 10 pasos del algoritmo de la especificación,
 * con su fórmula y el valor intermedio que devolvió el motor. No se recalcula nada.
 */
import type { Entrada, FilaIteracion, Intermedios, Resultados } from "@dw/core";
import { TABLAS } from "@dw/data";
import { formatearEntero, formatearInterpretado, formatearNumero, formatearPorcentaje, formatearSignificativas } from "./formato";
import { TEXTO_REGIMEN } from "./mensajes";

export interface Linea {
  /** Qué se calcula, con su fórmula (p. ej. "V = Q / A"). */
  readonly formula: string;
  /** Valor con unidad. */
  readonly valor: string;
}

export interface Paso {
  readonly numero: number;
  readonly titulo: string;
  readonly lineas: readonly Linea[];
}

export interface FilaIteracionTexto {
  readonly i: string;
  readonly f_in: string;
  readonly f_out: string;
  readonly delta: string;
}

/** Cifras significativas de los intermedios. */
const CIFRAS = 6;
const sig = (x: number): string => formatearSignificativas(x, CIFRAS);
const u = (valor: string, unidad: string): string => `${valor} ${unidad}`;

export function pasos(e: Entrada, i: Intermedios, r: Resultados): Paso[] {
  const ct = TABLAS.constantes;
  const reLam = formatearEntero(ct.re_laminar);
  const reTur = formatearEntero(ct.re_turbulento);
  const colebrookA = formatearInterpretado(ct.colebrook_a);
  const colebrookB = formatearInterpretado(ct.colebrook_b);
  const g = formatearInterpretado(ct.g);

  const criterioRegimen =
    r.regimen === "laminar" ? `Re < ${reLam}` : r.regimen === "transicion" ? `${reLam} ≤ Re ≤ ${reTur}` : `Re > ${reTur}`;

  const paso7: Linea[] = [{ formula: "Rugosidad relativa K/D", valor: sig(i.K_sobre_D) }];
  if (r.regimen === "laminar") {
    paso7.push({ formula: "f = 64 / Re (laminar, sin iterar)", valor: formatearNumero(r.f, 5) });
  } else {
    paso7.push(
      i.K_m > 0
        ? { formula: `f₀ = [−2·log₁₀(K / (${colebrookB}·D))]⁻² (régimen rugoso)`, valor: sig(i.f0 ?? Number.NaN) }
        : { formula: "f₀ (K = 0)", valor: sig(i.f0 ?? Number.NaN) },
      {
        formula: `Colebrook: fᵢ₊₁ = [−2·log₁₀(${colebrookA} / (Re·√fᵢ) + K / (${colebrookB}·D))]⁻²`,
        valor: `${formatearEntero(r.iteraciones)} ${r.iteraciones === 1 ? "iteración" : "iteraciones"}`,
      },
      { formula: "f adoptado", valor: formatearNumero(r.f, 5) },
    );
  }

  return [
    {
      numero: 1,
      titulo: "Diámetro, rugosidad y C",
      lineas: [
        { formula: "D = DI / 1000", valor: u(sig(i.D_m), "m") },
        { formula: e.k_manual === null ? "K (máximo del rango de la tabla)" : "K (manual)", valor: u(sig(i.K_m), "m") },
        { formula: e.c_manual === null ? "C de Hazen-Williams (tabla)" : "C de Hazen-Williams (manual)", valor: formatearInterpretado(i.C) },
      ],
    },
    {
      numero: 2,
      titulo: "Viscosidad cinemática",
      lineas: [{ formula: `ν interpolada en la tabla para T = ${formatearInterpretado(e.T)} °C`, valor: u(sig(i.nu_m2s), "m²/s") }],
    },
    {
      numero: 3,
      titulo: "Caudal",
      lineas: [{ formula: `Q = ${formatearInterpretado(e.Q_valor)} ${e.Q_unidad} convertido a m³/s`, valor: u(sig(i.Q_m3s), "m³/s") }],
    },
    {
      numero: 4,
      titulo: "Área y velocidad",
      lineas: [
        { formula: "A = π·D² / 4", valor: u(sig(i.A_m2), "m²") },
        { formula: "V = Q / A", valor: u(sig(r.V), "m/s") },
      ],
    },
    {
      numero: 5,
      titulo: "Número de Reynolds",
      lineas: [{ formula: "Re = V·D / ν", valor: formatearEntero(r.Re) }],
    },
    {
      numero: 6,
      titulo: "Régimen",
      lineas: [{ formula: criterioRegimen, valor: TEXTO_REGIMEN[r.regimen] }],
    },
    { numero: 7, titulo: "Factor de fricción", lineas: paso7 },
    {
      numero: 8,
      titulo: "Control con Swamee-Jain",
      lineas: [
        { formula: "f_SJ = 0,25 / [log₁₀(K / (3,7·D) + 5,74 / Re^0,9)]²", valor: formatearNumero(r.f_sj, 5) },
        { formula: "Diferencia f_SJ / f − 1", valor: formatearPorcentaje(r.dif_sj, 2, { signo: true }) },
      ],
    },
    {
      numero: 9,
      titulo: "Pérdidas",
      lineas: [
        { formula: `hv = V² / (2·g), con g = ${g} m/s²`, valor: u(sig(i.hv_m), "m") },
        { formula: `hf = f·(L / D)·hv, con L = ${formatearInterpretado(e.L)} m`, valor: u(formatearNumero(r.hf_dw, 3), "m") },
        { formula: "ΣK = Σ nⱼ·Kⱼ (tabla y propias)", valor: sig(i.suma_K) },
        { formula: "h_loc = ΣK·hv", valor: u(formatearNumero(r.h_loc, 3), "m") },
        { formula: "h_total = hf + h_loc", valor: u(formatearNumero(r.h_total, 3), "m") },
      ],
    },
    {
      numero: 10,
      titulo: "Hazen-Williams (comparación)",
      lineas: [
        { formula: "hf_HW = 10,679·L·Q^1,852 / (C^1,852·D^4,87)", valor: u(formatearNumero(r.hf_hw, 3), "m") },
        { formula: "Diferencia hf_HW / hf − 1", valor: formatearPorcentaje(r.dif_hw_dw, 1, { signo: true }) },
        { formula: "J = hf / L", valor: u(formatearNumero(r.J, 4), "m/m") },
        { formula: "Pérdida cada 100 m = 100·J", valor: u(formatearNumero(r.hf_100m, 3), "m/100 m") },
      ],
    },
  ];
}

/** Tabla de iteraciones de Colebrook: f con 8 decimales, |Δf| en notación E. */
export function filasIteracion(filas: readonly FilaIteracion[]): FilaIteracionTexto[] {
  return filas.map((f) => ({
    i: formatearEntero(f.i),
    f_in: formatearNumero(f.f_in, 8),
    f_out: formatearNumero(f.f_out, 8),
    delta: formatearSignificativas(f.delta, 3),
  }));
}
