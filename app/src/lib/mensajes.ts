/**
 * Textos que ve el usuario. Los de errores y advertencias son EXACTAMENTE los de
 * la Especificación v1, sección "Advertencias y errores". Si cambia un texto,
 * se cambia primero en la especificación.
 */
import { RANGOS, type Advertencia, type CampoError, type CodigoError, type Regimen } from "@dw/core";
import { formatearInterpretado } from "./formato";

/** Nombre del campo tal como aparece en los mensajes ("{campo}"). */
export const NOMBRE_CAMPO: Readonly<Record<CampoError, string>> = {
  tabla: "Tabla de diámetros",
  di_manual: "DI manual",
  dn_pn: "Diámetro nominal y presión nominal",
  material: "Material",
  k_manual: "K manual",
  c_manual: "C de Hazen-Williams manual",
  L: "Longitud L",
  T: "Temperatura del agua T",
  Q_m3s: "Caudal Q",
  Q_unidad: "Unidad de caudal",
  cantidad: "Cantidad",
  extra_max: "Singularidades propias",
  extra_nombre: "Nombre de la singularidad",
  extra_k: "K de la singularidad",
  extra_cantidad: "Cantidad de la singularidad",
};

/** Campos con rango numérico: mínimo, máximo y unidad para el mensaje E-RANGO. */
const RANGO_CAMPO: Partial<Record<CampoError, { readonly min: number; readonly max: number; readonly unidad: string }>> = {
  di_manual: { ...RANGOS.di_manual, unidad: "mm" },
  k_manual: { ...RANGOS.k_manual, unidad: "mm" },
  c_manual: { ...RANGOS.c_manual, unidad: "" },
  L: { ...RANGOS.L, unidad: "m" },
  T: { ...RANGOS.T, unidad: "°C" },
  // El motor valida el caudal ya convertido a m³/s.
  Q_m3s: { ...RANGOS.Q_m3s, unidad: "m³/s" },
  cantidad: { ...RANGOS.cantidad, unidad: "" },
  extra_k: { ...RANGOS.extra_k, unidad: "" },
  extra_cantidad: { ...RANGOS.cantidad, unidad: "" },
};

/**
 * E-RANGO en campos sin rango numérico (listas, cantidad de filas, largo del nombre).
 * La interfaz no permite llegar a estos casos; los textos son una PROPUESTA pendiente
 * de agregar a la especificación.
 */
const RANGO_SIN_NUMEROS: Partial<Record<CampoError, string>> = {
  tabla: "Elegí una tabla de diámetros de la lista.",
  dn_pn: "Elegí un diámetro nominal y una presión nominal de la lista.",
  material: "Elegí un material de la lista.",
  Q_unidad: "Elegí una unidad de caudal de la lista.",
  extra_max: "Podés agregar hasta 10 singularidades propias.",
  extra_nombre: "El nombre de la singularidad puede tener hasta 60 caracteres.",
};

export function textoError(codigo: CodigoError, campo: CampoError | null): string {
  if (codigo === "E-NOCONV") return "El cálculo del factor de fricción no convergió. Revisá los datos.";
  const nombre = campo === null ? "este campo" : NOMBRE_CAMPO[campo];
  switch (codigo) {
    case "E-VACIO":
      return `Ingresá un valor para ${nombre}.`;
    case "E-FORMATO":
      return `${nombre}: no es un número válido. Usá coma o punto decimal, sin separador de miles.`;
    case "E-RANGO": {
      const rango = campo === null ? undefined : RANGO_CAMPO[campo];
      if (rango === undefined) return (campo === null ? undefined : RANGO_SIN_NUMEROS[campo]) ?? `Revisá ${nombre}.`;
      const unidad = rango.unidad === "" ? "" : ` ${rango.unidad}`;
      return `${nombre} debe estar entre ${formatearInterpretado(rango.min)} y ${formatearInterpretado(rango.max)}${unidad}.`;
    }
  }
}

export const TEXTO_ADVERTENCIA: Readonly<Record<Advertencia, string>> = {
  "A-LAMINAR": "Régimen laminar: se usa f = 64/Re.",
  "A-TRANSICION": "Régimen de transición: el resultado es incierto (Colebrook no es válido en esta zona).",
  "A-VEL-ALTA": "Velocidad alta (> 2,5 m/s): riesgo de golpe de ariete y desgaste.",
  "A-VEL-BAJA": "Velocidad baja (< 0,6 m/s): riesgo de sedimentación.",
  "A-KD": "Rugosidad relativa fuera del rango del diagrama de Moody (K/D > 0,05).",
  "A-HW": "Hazen-Williams es empírica y pierde precisión con estos datos; usar Darcy-Weisbach.",
};

export const TEXTO_REGIMEN: Readonly<Record<Regimen, string>> = {
  laminar: "Laminar",
  transicion: "Transición",
  turbulento: "Turbulento",
};

export type ControlVelocidad = "OK" | "BAJA" | "ALTA";

/** Control de velocidad a partir de las advertencias del motor (no recalcula nada). */
export function controlVelocidad(advertencias: readonly Advertencia[]): ControlVelocidad {
  if (advertencias.includes("A-VEL-ALTA")) return "ALTA";
  if (advertencias.includes("A-VEL-BAJA")) return "BAJA";
  return "OK";
}
