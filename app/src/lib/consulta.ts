/**
 * Tablas de consulta: los mismos datos que usa el motor (@dw/data, exportados del Excel),
 * ordenados para leer. Nada se copia a mano.
 */
import { TABLAS, type Diametro } from "@dw/data";
import { formatearInterpretado } from "./formato";

export interface TablaDiametrosTexto {
  /** Presiones nominales (columnas), de menor a mayor. */
  readonly pns: readonly number[];
  /** Una fila por DN: el DI de cada PN, o null si esa combinación no existe. */
  readonly filas: readonly { readonly dn: number; readonly di: readonly (number | null)[] }[];
}

/** Tabla de diámetros interiores como en el Excel: DN en filas, PN en columnas. */
export function tablaDiametros(diametros: readonly Diametro[]): TablaDiametrosTexto {
  const pns = [...new Set(diametros.map((d) => d.pn))].sort((a, b) => a - b);
  const dns = [...new Set(diametros.map((d) => d.dn))].sort((a, b) => a - b);
  return {
    pns,
    filas: dns.map((dn) => ({
      dn,
      di: pns.map((pn) => diametros.find((d) => d.dn === dn && d.pn === pn)?.di_mm ?? null),
    })),
  };
}

/**
 * Factor de cada unidad de caudal a m³/s, escrito como en la especificación
 * ("1 / 3 600 000"), a partir del numerador y denominador exactos de la tabla.
 */
export function factoresCaudal(): { readonly unidad: string; readonly factor: string }[] {
  return TABLAS.caudal.map((c) => ({
    unidad: c.unidad,
    factor: c.den === 1 ? formatearInterpretado(c.num) : `${formatearInterpretado(c.num)} / ${formatearInterpretado(c.den)}`,
  }));
}

/** Viscosidad en unidades de 10⁻⁶ m²/s (solo cambio de escala para mostrar, como en la especificación). */
export function viscosidadEnMicro(nu_m2s: number): number {
  return nu_m2s * 1e6;
}
