import { calcular, ENTRADA_POR_DEFECTO, type Advertencia } from "@dw/core";
import { describe, expect, it } from "vitest";
import { filasResultados, textoCaudales, textoControlVelocidad } from "../src/lib/presentacion";

/** Ejemplos con espacios comunes; la app usa los tipográficos. */
const tip = (s: string): string =>
  s.replace(/(\d) (?=\d)/g, "$1 ").replace(/ %/g, " %").replace(/(\d) (?=[a-zm])/g, "$1 ").replace(/100 m$/, "100 m").replace(/-(?=\d)/g, "−");

describe("los 14 resultados de la especificación, con los datos por defecto", () => {
  const r = calcular(ENTRADA_POR_DEFECTO);
  if (!r.ok) throw new Error("los datos por defecto tienen que calcular");
  const filas = filasResultados(r.resultados, r.advertencias);

  it("son 14, en el orden de la especificación", () => {
    expect(filas.map((f) => f.etiqueta)).toEqual([
      "Velocidad V", "Control de velocidad", "Reynolds Re", "Régimen", "Factor de fricción f", "Iteraciones",
      "f de Swamee-Jain (control)", "hf por fricción (DW)", "hf de Hazen-Williams", "Diferencia HW vs DW",
      "Pérdidas localizadas", "Pérdida total (DW)", "Pendiente J", "Pérdida cada 100 m",
    ]);
  });

  it.each([
    ["Velocidad V", "3,451 m/s"],
    ["Control de velocidad", "ALTA (> 2,5 m/s)"],
    ["Reynolds Re", "582 262"],
    ["Régimen", "Turbulento"],
    ["Factor de fricción f", "0,01438"],
    ["Iteraciones", "4"],
    ["f de Swamee-Jain (control)", "0,01444 (+0,40 %)"],
    ["hf por fricción (DW)", "2,577 m"],
    ["hf de Hazen-Williams", "2,503 m"],
    ["Diferencia HW vs DW", "-2,9 %"],
    ["Pérdidas localizadas", "1,080 m"],
    ["Pérdida total (DW)", "3,657 m"],
    ["Pendiente J", "0,0515 m/m"],
    ["Pérdida cada 100 m", "5,154 m/100 m"],
  ])("%s = %s", (etiqueta, esperado) => {
    expect(filas.find((f) => f.etiqueta === etiqueta)?.valor).toBe(tip(esperado));
  });

  it("solo la pérdida total va destacada", () => {
    expect(filas.filter((f) => f.destacada === true).map((f) => f.id)).toEqual(["h_total"]);
  });

  it("caudal equivalente", () => {
    expect(textoCaudales(r.intermedios)).toEqual([
      "280,000 m³/h", "77,778 l/s", "0,077778 m³/s", "280 000,0 l/h",
    ]);
  });
});

describe("control de velocidad", () => {
  it.each<[Advertencia[], string]>([
    [["A-VEL-ALTA"], "ALTA (> 2,5 m/s)"],
    [["A-VEL-BAJA", "A-LAMINAR"], "BAJA (< 0,6 m/s)"],
    [[], "OK"],
  ])("%j → %s", (advertencias, esperado) => {
    expect(textoControlVelocidad(advertencias)).toBe(esperado);
  });
});
