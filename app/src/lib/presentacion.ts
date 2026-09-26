/**
 * Qué se muestra de un cálculo y con qué formato (Especificación, "Resultados y formato").
 * Solo toma valores que devuelve el motor y les da formato: no calcula nada.
 */
import type { Advertencia, Intermedios, Resultados } from "@dw/core";
import { TABLAS } from "@dw/data";
import { formatearEntero, formatearNumero, formatearPorcentaje } from "./formato";
import { controlVelocidad, TEXTO_REGIMEN } from "./mensajes";

export interface Fila {
  readonly id: keyof Resultados | "control_velocidad";
  readonly etiqueta: string;
  /** Valor ya formateado, con su unidad. */
  readonly valor: string;
  readonly destacada?: boolean;
}

const conUnidad = (valor: string, unidad: string): string => `${valor} ${unidad}`;

export function textoControlVelocidad(advertencias: readonly Advertencia[]): string {
  const { v_min, v_max } = TABLAS.constantes;
  switch (controlVelocidad(advertencias)) {
    case "ALTA":
      return `ALTA (> ${conUnidad(formatearNumero(v_max, 1), "m/s")})`;
    case "BAJA":
      return `BAJA (< ${conUnidad(formatearNumero(v_min, 1), "m/s")})`;
    case "OK":
      return "OK";
  }
}

/** Los 14 resultados de la especificación, en su orden y con su formato. */
export function filasResultados(r: Resultados, advertencias: readonly Advertencia[]): Fila[] {
  return [
    { id: "V", etiqueta: "Velocidad V", valor: conUnidad(formatearNumero(r.V, 3), "m/s") },
    { id: "control_velocidad", etiqueta: "Control de velocidad", valor: textoControlVelocidad(advertencias) },
    { id: "Re", etiqueta: "Reynolds Re", valor: formatearEntero(r.Re) },
    { id: "regimen", etiqueta: "Régimen", valor: TEXTO_REGIMEN[r.regimen] },
    { id: "f", etiqueta: "Factor de fricción f", valor: formatearNumero(r.f, 5) },
    { id: "iteraciones", etiqueta: "Iteraciones", valor: formatearEntero(r.iteraciones) },
    {
      id: "f_sj",
      etiqueta: "f de Swamee-Jain (control)",
      valor: `${formatearNumero(r.f_sj, 5)} (${formatearPorcentaje(r.dif_sj, 2, { signo: true })})`,
    },
    { id: "hf_dw", etiqueta: "hf por fricción (DW)", valor: conUnidad(formatearNumero(r.hf_dw, 3), "m") },
    { id: "hf_hw", etiqueta: "hf de Hazen-Williams", valor: conUnidad(formatearNumero(r.hf_hw, 3), "m") },
    { id: "dif_hw_dw", etiqueta: "Diferencia HW vs DW", valor: formatearPorcentaje(r.dif_hw_dw, 1, { signo: true }) },
    { id: "h_loc", etiqueta: "Pérdidas localizadas", valor: conUnidad(formatearNumero(r.h_loc, 3), "m") },
    { id: "h_total", etiqueta: "Pérdida total (DW)", valor: conUnidad(formatearNumero(r.h_total, 3), "m"), destacada: true },
    { id: "J", etiqueta: "Pendiente J", valor: conUnidad(formatearNumero(r.J, 4), "m/m") },
    { id: "hf_100m", etiqueta: "Pérdida cada 100 m", valor: conUnidad(formatearNumero(r.hf_100m, 3), "m/100 m") },
  ];
}

/** Caudal equivalente (lo devuelve el motor; acá solo se formatea). */
export function textoCaudales(i: Intermedios): string[] {
  return [
    conUnidad(formatearNumero(i.Q_m3h, 3), "m³/h"),
    conUnidad(formatearNumero(i.Q_ls, 3), "l/s"),
    conUnidad(formatearNumero(i.Q_m3s, 6), "m³/s"),
    conUnidad(formatearNumero(i.Q_lh, 1), "l/h"),
  ];
}
