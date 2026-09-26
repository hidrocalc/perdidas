import { calcular, ENTRADA_POR_DEFECTO, type Entrada } from "@dw/core";
import { describe, expect, it } from "vitest";
import { filasIteracion, pasos } from "../src/lib/pasoapaso";

const NB = " ";

function calcularOk(e: Entrada) {
  const r = calcular(e);
  if (!r.ok) throw new Error(JSON.stringify(r.errores));
  return r;
}

const valor = (ps: ReturnType<typeof pasos>, numero: number, formula: string): string | undefined =>
  ps.find((p) => p.numero === numero)?.lineas.find((l) => l.formula.startsWith(formula))?.valor;

describe("paso a paso con los datos por defecto", () => {
  const r = calcularOk(ENTRADA_POR_DEFECTO);
  const ps = pasos(ENTRADA_POR_DEFECTO, r.intermedios, r.resultados);

  it("tiene los 10 pasos de la especificación, en orden", () => {
    expect(ps.map((p) => p.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it.each([
    [1, "D = DI / 1000", `0,169400${NB}m`],
    [1, "K (máximo del rango", `2,00000E-5${NB}m`],
    [1, "C de Hazen-Williams (tabla)", "150"],
    [2, "ν interpolada", `1,00400E-6${NB}m²/s`],
    [3, "Q = 280", `0,0777778${NB}m³/s`],
    [4, "A = π·D² / 4", `0,0225381${NB}m²`],
    [4, "V = Q / A", `3,45095${NB}m/s`],
    [5, "Re = V·D / ν", "582 262"],
    [6, "Re > 4 000", "Turbulento"],
    [7, "Rugosidad relativa K/D", "0,000118064"],
    [7, "Colebrook", "4 iteraciones"],
    [7, "f adoptado", "0,01438"],
    [8, "Diferencia f_SJ", `+0,40${NB}%`],
    [9, "ΣK", "1,78000"],
    [9, "h_total", `3,657${NB}m`],
    [10, "Diferencia hf_HW", `−2,9${NB}%`],
  ])("paso %i, %s → %s", (numero, formula, esperado) => {
    expect(valor(ps, numero, formula)).toBe(esperado);
  });

  it("la tabla de iteraciones termina con |Δf| < 1E-6", () => {
    const filas = filasIteracion(r.iteraciones_detalle);
    expect(filas.map((f) => f.i)).toEqual(["1", "2", "3", "4"]);
    // Valores de referencia del oráculo en Python: f = 0,01438396; |Δf| = 3,95E-7.
    expect(filas.at(-1)).toEqual({ i: "4", f_in: filas.at(-1)?.f_in, f_out: "0,01438396", delta: "3,95E-7" });
  });
});

describe("casos especiales", () => {
  it("laminar: f = 64/Re, sin f₀ ni iteraciones", () => {
    const e = { ...ENTRADA_POR_DEFECTO, Q_valor: 100 };
    const r = calcularOk(e);
    const ps = pasos(e, r.intermedios, r.resultados);
    expect(valor(ps, 6, "Re < 2 000")).toBe("Laminar");
    expect(valor(ps, 7, "f = 64 / Re")).toBeDefined();
    expect(valor(ps, 7, "f₀")).toBeUndefined();
    expect(filasIteracion(r.iteraciones_detalle)).toEqual([]);
  });

  it("transición: muestra el criterio 2000 ≤ Re ≤ 4000", () => {
    const e = { ...ENTRADA_POR_DEFECTO, Q_valor: 1500 };
    const r = calcularOk(e);
    expect(r.resultados.regimen).toBe("transicion");
    expect(valor(pasos(e, r.intermedios, r.resultados), 6, "2 000 ≤ Re ≤ 4 000")).toBe("Transición");
  });

  it("K = 0: f₀ = 0,02 y el texto lo aclara", () => {
    const e = { ...ENTRADA_POR_DEFECTO, k_manual: 0, c_manual: 140 };
    const r = calcularOk(e);
    const ps = pasos(e, r.intermedios, r.resultados);
    expect(valor(ps, 7, "f₀ (K = 0)")).toBe("0,0200000");
    expect(valor(ps, 1, "K (manual)")).toBe(`0,00000${NB}m`);
    expect(valor(ps, 1, "C de Hazen-Williams (manual)")).toBe("140");
  });

  it("una sola iteración se escribe en singular", () => {
    const e = { ...ENTRADA_POR_DEFECTO };
    const r = calcularOk(e);
    const ps = pasos(e, r.intermedios, { ...r.resultados, iteraciones: 1 });
    expect(valor(ps, 7, "Colebrook")).toBe("1 iteración");
  });
});
