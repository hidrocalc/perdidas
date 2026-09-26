/**
 * Parseo de números ingresados por el usuario
 * (Especificación v1, "Reglas comunes a los campos numéricos").
 */
export type CodigoParseo = "E-VACIO" | "E-FORMATO";

export type ResultadoParseo =
  | { readonly ok: true; readonly valor: number }
  | { readonly ok: false; readonly error: CodigoParseo };

const PATRON = /^[+-]?(\d+([.,]\d*)?|[.,]\d+)([eE][+-]?\d+)?$/;

export function parseNumero(texto: string | null | undefined): ResultadoParseo {
  if (texto === null || texto === undefined) return { ok: false, error: "E-VACIO" };
  const s = texto.trim();
  if (s === "") return { ok: false, error: "E-VACIO" };
  // El patrón admite un único separador decimal: "1.000,5" o "1,000.5" (ambiguos) no pasan,
  // igual que texto, NaN o Infinity.
  if (!PATRON.test(s)) return { ok: false, error: "E-FORMATO" };
  const valor = Number(s.replace(",", "."));
  if (!Number.isFinite(valor)) return { ok: false, error: "E-FORMATO" }; // p. ej. 1e400
  return { ok: true, valor };
}
