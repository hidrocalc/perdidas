/** Consultas a las tablas (Especificación v1, secciones Unidades y Tablas de datos). */
import { TABLAS, type Material, type PuntoViscosidad } from "@dw/data";

export type TablaDiametros = "PVC" | "PE";

export function buscarMaterial(nombre: string): Material | undefined {
  return TABLAS.materiales.find((m) => m.material === nombre);
}

/** K adoptado = máximo del rango (decisión validada: criterio conservador). */
export function kTablaMm(m: Material): number {
  return m.k_max_mm;
}

export function diTablaMm(tabla: TablaDiametros, dn: number, pn: number): number | undefined {
  return TABLAS.diametros[tabla].find((d) => d.dn === dn && d.pn === pn)?.di_mm;
}

/** Combinaciones DN/PN disponibles, para que la interfaz solo ofrezca las que existen. */
export function combinacionesDisponibles(tabla: TablaDiametros): readonly { dn: number; pn: number }[] {
  return TABLAS.diametros[tabla].map(({ dn, pn }) => ({ dn, pn }));
}

export function factorCaudal(unidad: string): number | undefined {
  const u = TABLAS.caudal.find((c) => c.unidad === unidad);
  return u === undefined ? undefined : u.num / u.den;
}

export function unidadesCaudal(): readonly string[] {
  return TABLAS.caudal.map((c) => c.unidad);
}

/** Tramos consecutivos (T_i, T_i+1) de la tabla de viscosidad; se arman una sola vez. */
const TRAMOS_VISCOSIDAD = armarTramos(TABLAS.viscosidad);

function armarTramos(tab: readonly PuntoViscosidad[]): readonly [Tramo, ...Tramo[]] {
  const tramos: Tramo[] = [];
  for (let i = 0; i + 1 < tab.length; i++) {
    const a = tab[i];
    const b = tab[i + 1];
    /* v8 ignore next */
    if (a !== undefined && b !== undefined) tramos.push([a, b]);
  }
  const [primero, ...resto] = tramos;
  /* v8 ignore next */
  if (primero === undefined) throw new Error("La tabla de viscosidad necesita al menos 2 puntos");
  return [primero, ...resto];
}

type Tramo = readonly [PuntoViscosidad, PuntoViscosidad];

/**
 * Paso 2: interpolación lineal. i = mayor índice con T_i <= T, limitado al
 * penúltimo punto. Precondición: T dentro del rango de la tabla (validado antes).
 */
export function viscosidad(T: number): number {
  let [p0, p1] = TRAMOS_VISCOSIDAD[0];
  for (const tramo of TRAMOS_VISCOSIDAD) if (tramo[0].t_c <= T) [p0, p1] = tramo;
  return p0.nu_m2s + ((T - p0.t_c) * (p1.nu_m2s - p0.nu_m2s)) / (p1.t_c - p0.t_c);
}

export function kSingularidad(nombre: string): number | undefined {
  return TABLAS.singularidades.find((s) => s.singularidad === nombre)?.k;
}
