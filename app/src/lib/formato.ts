/**
 * Formato de números para mostrar (Especificación v1, "Resultados y formato"):
 * coma decimal, espacio fino como separador de miles y signo menos tipográfico.
 *
 * Solo presentación: el cálculo y las pruebas usan siempre la precisión completa.
 * No se usa Intl.NumberFormat porque cada navegador formatea "es-AR" distinto
 * (punto de miles en unos, espacio en otros).
 */

/** Espacio fino no separable (U+202F): separador de miles que no corta la línea. */
export const ESPACIO_FINO = " ";
/** Espacio no separable (U+00A0): entre el número y "%" o la unidad. */
export const ESPACIO_DURO = " ";
/** Signo menos (U+2212), como en el ejemplo "−2,9 %" de la especificación. */
export const MENOS = "−";
/** Lo que se muestra si llega un valor no finito: nunca "NaN" ni "Infinity". */
export const SIN_VALOR = "—";

/** Dígitos decimales de |x| con 15 cifras significativas, como muestra Excel. */
interface Digitos {
  /** Dígitos sin punto ni signo, p. ej. "345100000000000". */
  readonly digitos: string;
  /** Cantidad de dígitos a la izquierda de la coma (puede ser ≤ 0 o mayor que el largo). */
  readonly enteros: number;
}

function digitosDe(x: number): Digitos {
  const [mantisa = "", exp = "0"] = Math.abs(x).toPrecision(15).split("e");
  const punto = mantisa.indexOf(".");
  const enterosMantisa = punto === -1 ? mantisa.length : punto;
  return { digitos: mantisa.replace(".", ""), enteros: enterosMantisa + Number(exp) };
}

function agruparMiles(entero: string): string {
  return entero.replace(/\B(?=(\d{3})+(?!\d))/g, ESPACIO_FINO);
}

export interface OpcionesNumero {
  /** Muestra "+" en los positivos (para diferencias). */
  readonly signo?: boolean;
}

/**
 * Redondea a `decimales` y formatea. El redondeo es "mitad hacia arriba" sobre la
 * representación de 15 cifras significativas, igual que la celda del Excel:
 * 1,0005 con 3 decimales da "1,001" (toFixed daría "1,000").
 */
export function formatearNumero(x: number, decimales: number, opciones: OpcionesNumero = {}): string {
  if (!Number.isFinite(x)) return SIN_VALOR;
  const { digitos, enteros } = digitosDe(x);

  // Entero N = redondeo de |x|·10^decimales, armado dígito a dígito.
  const n = enteros + decimales;
  const prefijo = n <= 0 ? "0" : digitos.slice(0, n).padEnd(n, "0");
  const siguiente = n < 0 ? "0" : (digitos[n] ?? "0");
  const N = BigInt(prefijo) + (siguiente >= "5" ? 1n : 0n);

  const s = N.toString().padStart(decimales + 1, "0");
  const parteEntera = s.slice(0, s.length - decimales);
  const parteDecimal = s.slice(s.length - decimales);

  let texto = agruparMiles(parteEntera);
  if (decimales > 0) texto += `,${parteDecimal}`;

  // Un valor que redondea a cero se muestra sin signo ("0,000", no "−0,000").
  if (N === 0n) return texto;
  if (x < 0) return MENOS + texto;
  return opciones.signo === true ? `+${texto}` : texto;
}

/** Entero con separador de miles, p. ej. "582 262". */
export function formatearEntero(x: number): string {
  return formatearNumero(x, 0);
}

/**
 * Fracción como porcentaje: −0,029 → "−2,9 %". Multiplicar por 100 es solo
 * cambio de escala para mostrar.
 */
export function formatearPorcentaje(fraccion: number, decimales: number, opciones: OpcionesNumero = {}): string {
  if (!Number.isFinite(fraccion)) return SIN_VALOR;
  return `${formatearNumero(fraccion * 100, decimales, opciones)}${ESPACIO_DURO}%`;
}

/**
 * Valor con `cifras` cifras significativas, para los intermedios del paso a paso.
 * Entre 1E-4 y 1E7 se escribe en decimal ("0,169400", "582 262"); fuera de ese rango,
 * en notación E como el Excel y la especificación ("1,00400E-6").
 */
export function formatearSignificativas(x: number, cifras: number): string {
  if (!Number.isFinite(x)) return SIN_VALOR;
  if (x === 0) return formatearNumero(0, cifras - 1);
  const { digitos, enteros } = digitosDe(x);
  const primero = digitos.search(/[1-9]/);
  const exponente = enteros - 1 - primero;
  if (exponente >= -4 && exponente < 7) {
    const texto = formatearNumero(x, Math.max(0, cifras - 1 - exponente));
    // Si el redondeo sumó una cifra (9,99996 → 10,0000), se saca un decimal.
    const cifrasTexto = texto.replace(/[^\d]/g, "").replace(/^0+/, "").length;
    return cifrasTexto > cifras && texto.includes(",") ? formatearNumero(x, Math.max(0, cifras - 2 - exponente)) : texto;
  }
  const [mantisa = "", exp = "0"] = x.toExponential(14).split("e");
  let m = formatearNumero(Number(mantisa), cifras - 1);
  let e = Number(exp);
  if (/^−?10/.test(m)) {
    // 9,9999996E-6 redondeado da "10,00…": se normaliza a "1,00…E-5".
    m = formatearNumero(Number(mantisa) / 10, cifras - 1);
    e += 1;
  }
  return `${m}E${e < 0 ? "-" : ""}${Math.abs(e)}`;
}

/**
 * Valor interpretado de un campo, con todos sus decimales significativos:
 * "280.000" se interpreta como 280 y se muestra "280"; "280000" se muestra "280 000".
 */
export function formatearInterpretado(x: number): string {
  if (!Number.isFinite(x)) return SIN_VALOR;
  const { digitos, enteros } = digitosDe(x);
  const significativos = digitos.replace(/0+$/, "").length;
  return formatearNumero(x, Math.max(0, significativos - enteros));
}
