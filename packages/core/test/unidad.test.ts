/** Casos puntuales: API pública, ramas de validación y valores por defecto del Excel. */
import { TABLAS } from "@dw/data";
import { describe, expect, it } from "vitest";
import {
  ENTRADA_POR_DEFECTO, advertenciasDe, calcular, colebrook, regimenDe, combinacionesDisponibles, diTablaMm, factorCaudal,
  parseNumero, unidadesCaudal, validar, type Entrada,
} from "../src";

const base = ENTRADA_POR_DEFECTO;
const errores = (e: Entrada) => {
  const c = calcular(e);
  return c.ok ? [] : c.errores.map((x) => `${x.codigo}:${String(x.campo)}`);
};

describe("datos por defecto = Excel corregido", () => {
  it("reproduce los resultados de la hoja (redondeo de la especificación)", () => {
    const c = calcular(base);
    expect(c.ok).toBe(true);
    if (!c.ok) return;
    const r = c.resultados;
    expect(r.V.toFixed(3)).toBe("3.451");
    expect(Math.round(r.Re)).toBe(582262);
    expect(r.f.toFixed(5)).toBe("0.01438");
    expect(r.iteraciones).toBe(4);
    expect(r.hf_dw.toFixed(3)).toBe("2.577");
    expect(r.hf_hw.toFixed(3)).toBe("2.503");
    expect(r.h_loc.toFixed(3)).toBe("1.080");
    expect(r.h_total.toFixed(3)).toBe("3.657");
    expect(c.advertencias).toEqual(["A-VEL-ALTA"]);
  });
});

describe("validación", () => {
  it("tabla desconocida", () => {
    expect(errores({ ...base, tabla: "Acero" })).toEqual(["E-RANGO:tabla"]);
  });
  it("DN o PN nulos con tabla PVC", () => {
    expect(errores({ ...base, dn: null })).toEqual(["E-RANGO:dn_pn"]);
    expect(errores({ ...base, pn: null })).toEqual(["E-RANGO:dn_pn"]);
  });
  it("singularidad desconocida o cantidad no entera", () => {
    expect(errores({ ...base, cantidades: { Inexistente: 1 } })).toEqual(["E-RANGO:cantidad"]);
    expect(errores({ ...base, cantidades: { [TABLAS.singularidades[4]!.singularidad]: 0.5 } })).toEqual(["E-RANGO:cantidad"]);
  });
  it("valores no finitos se rechazan", () => {
    expect(errores({ ...base, L: Number.NaN })).toEqual(["E-RANGO:L"]);
    expect(errores({ ...base, T: Number.POSITIVE_INFINITY })).toEqual(["E-RANGO:T"]);
  });
  it("una entrada válida queda marcada como validada", () => {
    const v = validar(base);
    expect(v.ok).toBe(true);
  });
  it("E-NOCONV no se da en el dominio válido, pero colebrook informa si no converge", () => {
    // Re negativo fuera del dominio: la iteración produce NaN y nunca cumple la tolerancia.
    expect(colebrook(-1, 0.00002, 0.1).ok).toBe(false);
  });
});

describe("tablas", () => {
  it("expone las 7 unidades de caudal con factores correctos", () => {
    expect(unidadesCaudal()).toHaveLength(7);
    expect(factorCaudal("m³/s")).toBe(1);
    expect(factorCaudal("l/s")).toBe(0.001);
    expect(factorCaudal("xx")).toBeUndefined();
  });
  it("ofrece solo combinaciones DN/PN existentes", () => {
    for (const t of ["PVC", "PE"] as const) {
      for (const { dn, pn } of combinacionesDisponibles(t)) expect(diTablaMm(t, dn, pn)).toBeTypeOf("number");
    }
    expect(combinacionesDisponibles("PVC")).toHaveLength(56);
    expect(combinacionesDisponibles("PE")).toHaveLength(19);
  });
});

describe("parseo", () => {
  it("null y undefined son vacío", () => {
    expect(parseNumero(null)).toEqual({ ok: false, error: "E-VACIO" });
    expect(parseNumero(undefined)).toEqual({ ok: false, error: "E-VACIO" });
  });
});

describe("límites exactos (valores que los vectores no alcanzan justo)", () => {
  it("régimen validado: < 2000 laminar, 2000–4000 transición, > 4000 turbulento", () => {
    expect(regimenDe(1999.999999)).toBe("laminar");
    expect(regimenDe(2000)).toBe("transicion");
    expect(regimenDe(4000)).toBe("transicion");
    expect(regimenDe(4000.000001)).toBe("turbulento");
  });
  it("advertencias: los límites son estrictos", () => {
    const x = { regimen: "turbulento" as const, V: 1, KD: 0.001, T: 20, D: 0.1 };
    expect(advertenciasDe(x)).toEqual([]);
    expect(advertenciasDe({ ...x, V: 2.5 })).toEqual([]);
    expect(advertenciasDe({ ...x, V: 2.5000001 })).toEqual(["A-VEL-ALTA"]);
    expect(advertenciasDe({ ...x, V: 0.6 })).toEqual([]);
    expect(advertenciasDe({ ...x, V: 0.5999999 })).toEqual(["A-VEL-BAJA"]);
    expect(advertenciasDe({ ...x, KD: 0.05 })).toEqual([]);
    expect(advertenciasDe({ ...x, KD: 0.0500001 })).toEqual(["A-KD"]);
    expect(advertenciasDe({ ...x, T: 5 })).toEqual([]);
    expect(advertenciasDe({ ...x, T: 25 })).toEqual([]);
    expect(advertenciasDe({ ...x, T: 4.999 })).toEqual(["A-HW"]);
    expect(advertenciasDe({ ...x, D: 0.05 })).toEqual([]);
    expect(advertenciasDe({ ...x, D: 0.0499 })).toEqual(["A-HW"]);
    expect(advertenciasDe({ ...x, regimen: "laminar" })).toEqual(["A-LAMINAR"]);
    expect(advertenciasDe({ ...x, regimen: "transicion" })).toEqual(["A-TRANSICION"]);
  });
});
