/**
 * Del formulario al motor: lee los textos de los campos con parseNumero(), arma la
 * Entrada y ubica cada error (de parseo o del motor) en el campo que lo causó.
 * No calcula nada: el único cálculo es calcular() de @dw/core.
 */
import {
  calcular, combinacionesDisponibles, ENTRADA_POR_DEFECTO, parseNumero,
  type Calculo, type CampoError, type Entrada, type ErrorEntrada, type TablaDiametros,
} from "@dw/core";
import { TABLAS } from "@dw/data";
import { textoError } from "./mensajes";

export type Tabla = "PVC" | "PE" | "Manual";

export interface FilaPropiaTexto {
  nombre: string;
  k: string;
  cantidad: string;
}

/** Estado del formulario: lo que el usuario escribió, sin interpretar. */
export interface TextosEntrada {
  tabla: Tabla;
  dn: number;
  pn: number;
  di_manual: string;
  material: string;
  k_manual: string;
  c_manual: string;
  L: string;
  T: string;
  Q: string;
  Q_unidad: string;
  /** Una por cada fila de TABLAS.singularidades, en el mismo orden (E11). */
  cantidades: string[];
  /** Singularidades propias (E12), hasta MAX_PROPIAS. */
  propias: FilaPropiaTexto[];
}

export const MAX_PROPIAS = 10;

/** Identificador del campo en el formulario (también es el id del <input>). */
export type IdCampo = string;

export const idCantidad = (fila: number): IdCampo => `cantidad-${fila}`;
export const idPropia = (fila: number, parte: keyof FilaPropiaTexto): IdCampo => `propia-${fila}-${parte}`;
/** Errores que no son de un campo (E-NOCONV, más de 10 propias). */
export const ID_GENERAL = "general";

export interface Lectura {
  /** null si algún campo no se pudo leer: entonces no se llama al motor. */
  readonly entrada: Entrada | null;
  /** Valor interpretado de cada campo numérico que se pudo leer. */
  readonly interpretados: ReadonlyMap<IdCampo, number>;
  /** Mensaje de error de cada campo que no se pudo leer. */
  readonly errores: ReadonlyMap<IdCampo, string>;
}

export function textosPorDefecto(): TextosEntrada {
  const e = ENTRADA_POR_DEFECTO;
  return {
    tabla: "PVC",
    dn: e.dn ?? 180,
    pn: e.pn ?? 6,
    di_manual: "",
    material: e.material,
    k_manual: "",
    c_manual: "",
    L: String(e.L),
    T: String(e.T),
    Q: String(e.Q_valor),
    Q_unidad: e.Q_unidad,
    cantidades: TABLAS.singularidades.map((s) => String(e.cantidades[s.singularidad] ?? 0)),
    propias: [],
  };
}

/** Diámetros nominales disponibles en la tabla, de menor a mayor. */
export function dnsDisponibles(tabla: TablaDiametros): number[] {
  return [...new Set(combinacionesDisponibles(tabla).map((c) => c.dn))].sort((a, b) => a - b);
}

/** Presiones nominales que tienen DI definido para ese DN. */
export function pnsDisponibles(tabla: TablaDiametros, dn: number): number[] {
  return combinacionesDisponibles(tabla).filter((c) => c.dn === dn).map((c) => c.pn).sort((a, b) => a - b);
}

/**
 * Al cambiar de tabla o de DN, deja una combinación DN/PN que exista: conserva el DN
 * si está (si no, el más cercano) y la PN si está (si no, la primera disponible).
 */
export function ajustarDnPn(tabla: TablaDiametros, dn: number, pn: number): { dn: number; pn: number } {
  const dns = dnsDisponibles(tabla);
  const dnFinal = dns.reduce((mejor, x) => (Math.abs(x - dn) < Math.abs(mejor - dn) ? x : mejor), dns[0] ?? dn);
  const pns = pnsDisponibles(tabla, dnFinal);
  return { dn: dnFinal, pn: pns.includes(pn) ? pn : (pns[0] ?? pn) };
}

type Resultado = number | null | undefined;

/** Lee el formulario. Un campo vacío opcional es null; uno ilegible deja `entrada` en null. */
export function leer(t: TextosEntrada): Lectura {
  const interpretados = new Map<IdCampo, number>();
  const errores = new Map<IdCampo, string>();

  /** undefined = error (ya registrado); null = vacío en un campo opcional. */
  const numero = (id: IdCampo, campo: CampoError, texto: string, opcional = false): Resultado => {
    if (opcional && texto.trim() === "") return null;
    const r = parseNumero(texto);
    if (!r.ok) {
      errores.set(id, textoError(r.error, campo));
      return undefined;
    }
    interpretados.set(id, r.valor);
    return r.valor;
  };

  const manual = t.tabla === "Manual";
  const di = manual ? numero("di_manual", "di_manual", t.di_manual) : null;
  const k = numero("k_manual", "k_manual", t.k_manual, true);
  const c = numero("c_manual", "c_manual", t.c_manual, true);
  const L = numero("L", "L", t.L);
  const T = numero("T", "T", t.T);
  const Q = numero("Q", "Q_m3s", t.Q);

  // Cantidad vacía = 0 (la especificación da 0 por defecto a las singularidades de tabla).
  const cantidades: Record<string, number> = {};
  TABLAS.singularidades.forEach((s, fila) => {
    const n = numero(idCantidad(fila), "cantidad", t.cantidades[fila] ?? "", true);
    if (n !== undefined) cantidades[s.singularidad] = n ?? 0;
  });

  const propias = t.propias.map((p, fila) => ({
    nombre: p.nombre.trim(),
    k: numero(idPropia(fila, "k"), "extra_k", p.k),
    cantidad: numero(idPropia(fila, "cantidad"), "extra_cantidad", p.cantidad),
  }));

  const entrada: Entrada | null =
    errores.size > 0 || L == null || T == null || Q == null || (manual && di == null) || k === undefined || c === undefined
      ? null
      : {
          tabla: t.tabla,
          dn: manual ? null : t.dn,
          pn: manual ? null : t.pn,
          di_manual: di ?? null,
          material: t.material,
          k_manual: k,
          c_manual: c,
          L,
          T,
          Q_valor: Q,
          Q_unidad: t.Q_unidad,
          cantidades,
          singularidades_extra: propias.map((p) => ({ nombre: p.nombre, k: p.k ?? null, cantidad: p.cantidad ?? null })),
        };

  return { entrada, interpretados, errores };
}

/** Campo del formulario donde se muestra cada error del motor. */
export function idDeError(e: ErrorEntrada): IdCampo {
  switch (e.campo) {
    case null:
    case "extra_max":
      return ID_GENERAL;
    case "dn_pn":
      return "dn";
    case "Q_m3s":
      return "Q";
    case "cantidad":
      return idCantidad(e.fila ?? 0);
    case "extra_nombre":
      return idPropia(e.fila ?? 0, "nombre");
    case "extra_k":
      return idPropia(e.fila ?? 0, "k");
    case "extra_cantidad":
      return idPropia(e.fila ?? 0, "cantidad");
    default:
      return e.campo;
  }
}

export interface Evaluacion {
  readonly lectura: Lectura;
  /** null si el formulario tiene errores de lectura (no se llamó al motor). */
  readonly calculo: Calculo | null;
  /** Todos los errores a mostrar: de lectura y del motor, por campo. */
  readonly errores: ReadonlyMap<IdCampo, string>;
}

/** Lee el formulario y, si está completo, calcula. */
export function evaluar(t: TextosEntrada): Evaluacion {
  const lectura = leer(t);
  const calculo = lectura.entrada === null ? null : calcular(lectura.entrada);
  const errores = new Map(lectura.errores);
  if (calculo !== null && !calculo.ok) {
    for (const e of calculo.errores) {
      const id = idDeError(e);
      // Si un campo tiene más de un error, se muestra el primero (el orden lo fija el motor).
      if (!errores.has(id)) errores.set(id, textoError(e.codigo, e.campo));
    }
  }
  return { lectura, calculo, errores };
}
