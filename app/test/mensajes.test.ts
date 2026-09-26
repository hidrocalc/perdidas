import type { Advertencia, CampoError } from "@dw/core";
import { describe, expect, it } from "vitest";
import { ESPACIO_FINO } from "../src/lib/formato";
import { controlVelocidad, NOMBRE_CAMPO, TEXTO_ADVERTENCIA, TEXTO_REGIMEN, textoError } from "../src/lib/mensajes";

describe("errores (textos exactos de la especificación)", () => {
  it("E-VACIO", () => {
    expect(textoError("E-VACIO", "di_manual")).toBe("Ingresá un valor para DI manual.");
  });

  it("E-FORMATO", () => {
    expect(textoError("E-FORMATO", "L")).toBe(
      "Longitud L: no es un número válido. Usá coma o punto decimal, sin separador de miles.",
    );
  });

  it("E-NOCONV", () => {
    expect(textoError("E-NOCONV", null)).toBe("El cálculo del factor de fricción no convergió. Revisá los datos.");
  });

  it.each<[CampoError, string]>([
    ["L", `Longitud L debe estar entre 0 y 100${ESPACIO_FINO}000 m.`],
    ["T", "Temperatura del agua T debe estar entre 0 y 60 °C."],
    ["di_manual", `DI manual debe estar entre 1 y 5${ESPACIO_FINO}000 mm.`],
    ["k_manual", "K manual debe estar entre 0 y 50 mm."],
    ["c_manual", "C de Hazen-Williams manual debe estar entre 50 y 160."],
    ["Q_m3s", "Caudal Q debe estar entre 0 y 10 m³/s."],
    ["cantidad", "Cantidad debe estar entre 0 y 999."],
    ["extra_k", "K de la singularidad debe estar entre 0 y 100."],
    ["extra_cantidad", "Cantidad de la singularidad debe estar entre 0 y 999."],
  ])("E-RANGO en %s", (campo, esperado) => {
    expect(textoError("E-RANGO", campo)).toBe(esperado);
  });

  it("todos los campos del motor tienen nombre y texto de E-RANGO", () => {
    for (const campo of Object.keys(NOMBRE_CAMPO) as CampoError[]) {
      const texto = textoError("E-RANGO", campo);
      expect(texto).toMatch(/\.$/);
      expect(texto).not.toMatch(/undefined|NaN/);
    }
  });

  it("sin campo, se nombra genéricamente", () => {
    expect(textoError("E-VACIO", null)).toBe("Ingresá un valor para este campo.");
    expect(textoError("E-RANGO", null)).toBe("Revisá este campo.");
  });
});

describe("advertencias (textos exactos de la especificación)", () => {
  it.each<[Advertencia, string]>([
    ["A-LAMINAR", "Régimen laminar: se usa f = 64/Re."],
    ["A-TRANSICION", "Régimen de transición: el resultado es incierto (Colebrook no es válido en esta zona)."],
    ["A-VEL-ALTA", "Velocidad alta (> 2,5 m/s): riesgo de golpe de ariete y desgaste."],
    ["A-VEL-BAJA", "Velocidad baja (< 0,6 m/s): riesgo de sedimentación."],
    ["A-KD", "Rugosidad relativa fuera del rango del diagrama de Moody (K/D > 0,05)."],
    ["A-HW", "Hazen-Williams es empírica y pierde precisión con estos datos; usar Darcy-Weisbach."],
  ])("%s", (codigo, esperado) => {
    expect(TEXTO_ADVERTENCIA[codigo]).toBe(esperado);
  });
});

describe("régimen y control de velocidad", () => {
  it("textos de régimen", () => {
    expect(TEXTO_REGIMEN).toEqual({ laminar: "Laminar", transicion: "Transición", turbulento: "Turbulento" });
  });

  it.each<[Advertencia[], string]>([
    [["A-VEL-ALTA"], "ALTA"],
    [["A-HW", "A-VEL-BAJA"], "BAJA"],
    [["A-HW"], "OK"],
    [[], "OK"],
  ])("%j → %s", (advertencias, esperado) => {
    expect(controlVelocidad(advertencias)).toBe(esperado);
  });
});
