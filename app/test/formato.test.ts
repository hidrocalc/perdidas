import { calcular, ENTRADA_POR_DEFECTO } from "@dw/core";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  ESPACIO_DURO, ESPACIO_FINO, formatearEntero, formatearInterpretado, formatearNumero, formatearPorcentaje,
  formatearSignificativas, MENOS, SIN_VALOR,
} from "../src/lib/formato";

/** Escribe los ejemplos con espacios y "-" comunes; el formato real usa los tipográficos. */
const tip = (s: string): string => s.replace(/ (?=\d)/g, ESPACIO_FINO).replace(/ %/g, `${ESPACIO_DURO}%`).replace(/^-/, MENOS);

describe("ejemplos de la especificación (datos por defecto)", () => {
  const r = calcular(ENTRADA_POR_DEFECTO);
  if (!r.ok) throw new Error("los datos por defecto tienen que calcular");
  const x = r.resultados;

  it.each([
    ["Velocidad V", formatearNumero(x.V, 3), "3,451"],
    ["Reynolds Re", formatearEntero(x.Re), "582 262"],
    ["Factor de fricción f", formatearNumero(x.f, 5), "0,01438"],
    ["Iteraciones", formatearEntero(x.iteraciones), "4"],
    ["f de Swamee-Jain", formatearNumero(x.f_sj, 5), "0,01444"],
    ["hf por fricción (DW)", formatearNumero(x.hf_dw, 3), "2,577"],
    ["hf de Hazen-Williams", formatearNumero(x.hf_hw, 3), "2,503"],
    ["Diferencia HW vs DW", formatearPorcentaje(x.dif_hw_dw, 1), "-2,9 %"],
    ["Pérdidas localizadas", formatearNumero(x.h_loc, 3), "1,080"],
    ["Pérdida total (DW)", formatearNumero(x.h_total, 3), "3,657"],
    ["Pendiente J", formatearNumero(x.J, 4), "0,0515"],
    ["Pérdida cada 100 m", formatearNumero(x.hf_100m, 3), "5,154"],
  ])("%s", (_, obtenido, esperado) => {
    expect(obtenido).toBe(tip(esperado));
  });
});

describe("formatearNumero", () => {
  it.each([
    [0, 3, "0,000"],
    [1, 0, "1"],
    [999, 0, "999"],
    [1000, 0, "1 000"],
    [100000, 0, "100 000"],
    [1234567.891, 2, "1 234 567,89"],
    [0.5, 0, "1"],
    [2.5, 0, "3"],
    [0.0006, 3, "0,001"],
    [0.0004, 3, "0,000"],
    [9.9996, 3, "10,000"],
    [999.9996, 3, "1 000,000"],
    [1e-7, 3, "0,000"],
    [1e21, 0, "1 000 000 000 000 000 000 000"],
    [-3.14159, 2, "-3,14"],
    [-0.0004, 3, "0,000"],
    [-0, 1, "0,0"],
  ])("%d con %i decimales → %s", (x, dec, esperado) => {
    expect(formatearNumero(x, dec)).toBe(tip(esperado));
  });

  it("redondea como Excel (mitad hacia arriba sobre 15 cifras), no como toFixed", () => {
    expect((1.0005).toFixed(3)).toBe("1.000"); // el problema que se evita
    expect(formatearNumero(1.0005, 3)).toBe("1,001");
    expect(formatearNumero(1.005, 2)).toBe("1,01");
    expect(formatearNumero(0.1 + 0.2, 16)).toBe("0,3000000000000000");
  });

  it("signo explícito solo si se pide y solo si no redondea a cero", () => {
    expect(formatearNumero(0.4, 2, { signo: true })).toBe("+0,40");
    expect(formatearNumero(-0.4, 2, { signo: true })).toBe(`${MENOS}0,40`);
    expect(formatearNumero(0.0001, 2, { signo: true })).toBe("0,00");
  });

  it("nunca muestra NaN ni Infinity", () => {
    expect(formatearNumero(Number.NaN, 3)).toBe(SIN_VALOR);
    expect(formatearNumero(Number.POSITIVE_INFINITY, 3)).toBe(SIN_VALOR);
    expect(formatearPorcentaje(Number.NaN, 1)).toBe(SIN_VALOR);
    expect(formatearInterpretado(Number.NEGATIVE_INFINITY)).toBe(SIN_VALOR);
  });

  it("propiedad: al volver a leer el texto se recupera el valor redondeado", () => {
    fc.assert(
      fc.property(fc.double({ min: -1e12, max: 1e12, noNaN: true }), fc.integer({ min: 0, max: 6 }), (x, dec) => {
        const texto = formatearNumero(x, dec).replaceAll(ESPACIO_FINO, "").replace(MENOS, "-").replace(",", ".");
        expect(Math.abs(Number(texto) - x)).toBeLessThanOrEqual(0.5 * 10 ** -dec * (1 + 1e-9) + Math.abs(x) * 1e-14);
      }),
    );
  });
});

describe("formatearPorcentaje", () => {
  it("fracción a porcentaje con espacio duro antes de %", () => {
    expect(formatearPorcentaje(0.004, 2, { signo: true })).toBe(tip("+0,40 %"));
    expect(formatearPorcentaje(-0.029, 1)).toBe(tip("-2,9 %"));
  });
});

describe("formatearInterpretado (valor que la app entendió)", () => {
  it.each([
    [280, "280"],
    [280000, "280 000"],
    [0.02, "0,02"],
    [0.1 + 0.2, "0,3"],
    [1e-7, "0,0000001"],
    [169.4, "169,4"],
    [-5, "-5"],
    [100000, "100 000"],
  ])("%d → %s", (x, esperado) => {
    expect(formatearInterpretado(x)).toBe(tip(esperado));
  });
});

describe("formatearSignificativas (paso a paso)", () => {
  it.each([
    [1.004e-6, 4, "1,004E-6"],
    [0.1694, 6, "0,169400"],
    [582262.28, 6, "582 262"],
    [1.18e-5, 5, "1,1800E-5"],
    [0.0001, 4, "0,0001000"],
    [12345678, 3, "1,23E7"],
    [0, 6, "0,00000"],
    [9.999996, 6, "10,0000"],
    [9.9999996e-6, 3, "1,00E-5"],
    [-2.5e-8, 2, "-2,5E-8"],
    [0.0224, 6, "0,0224000"],
  ])("%d con %i cifras → %s", (x, cifras, esperado) => {
    expect(formatearSignificativas(x, cifras)).toBe(tip(esperado));
  });

  it("nunca muestra NaN", () => {
    expect(formatearSignificativas(Number.NaN, 3)).toBe(SIN_VALOR);
  });
});
