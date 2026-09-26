/** Propiedades físicas verificadas sobre miles de entradas aleatorias (fast-check). */
import { TABLAS } from "@dw/data";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { calcular, colebrook, factorCaudal, kTablaMm, viscosidad, type Entrada, type Resultados } from "../src";

const NUM_RUNS = 500;
const MATERIALES = TABLAS.materiales.map((m) => m.material);
const UNIDADES = TABLAS.caudal.map((u) => u.unidad);

const arbEntrada: fc.Arbitrary<Entrada> = fc.record({
  tabla: fc.constant("Manual"),
  dn: fc.constant(null),
  pn: fc.constant(null),
  di_manual: fc.double({ min: 20, max: 800, noNaN: true }),
  material: fc.constantFrom(...MATERIALES),
  k_manual: fc.constant(null),
  c_manual: fc.constant(null),
  L: fc.double({ min: 1, max: 5000, noNaN: true }),
  T: fc.double({ min: 0, max: 60, noNaN: true }),
  Q_valor: fc.double({ min: 0.5, max: 400, noNaN: true }),
  Q_unidad: fc.constant("l/s"),
  cantidades: fc.constant({}),
  singularidades_extra: fc.constant([]),
});

function r(e: Entrada): Resultados {
  const c = calcular(e);
  if (!c.ok) throw new Error(JSON.stringify(c.errores));
  return c.resultados;
}

const turbulento = (e: Entrada): boolean => r(e).regimen === "turbulento";

describe("propiedades físicas", () => {
  it("hf crece con Q, L y K; baja con D (régimen turbulento)", () => {
    fc.assert(
      fc.property(arbEntrada.filter(turbulento), (e) => {
        const h = r(e).hf_dw;
        const kMas = kTablaMm(TABLAS.materiales.find((m) => m.material === e.material)!) * 1.5 + 0.001;
        expect(r({ ...e, Q_valor: e.Q_valor * 1.1 }).hf_dw).toBeGreaterThan(h);
        expect(r({ ...e, L: e.L * 1.1 }).hf_dw).toBeGreaterThan(h);
        expect(r({ ...e, k_manual: kMas }).hf_dw).toBeGreaterThan(h);
        expect(r({ ...e, di_manual: e.di_manual! * 1.1 }).hf_dw).toBeLessThan(h);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("hf es lineal en L", () => {
    fc.assert(
      fc.property(arbEntrada, (e) => {
        const a = r({ ...e, L: 2 * e.L }).hf_dw;
        const b = 2 * r(e).hf_dw;
        expect(Math.abs(a / b - 1)).toBeLessThan(1e-12);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("el resultado no depende de la unidad de caudal", () => {
    fc.assert(
      fc.property(arbEntrada, fc.constantFrom(...UNIDADES), (e, u) => {
        const q = e.Q_valor * factorCaudal("l/s")!;
        const alt = r({ ...e, Q_valor: q / factorCaudal(u)!, Q_unidad: u }).hf_dw;
        expect(Math.abs(alt / r(e).hf_dw - 1)).toBeLessThan(1e-12);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("f > 0 y satisface Colebrook (residuo < 1E-4) fuera del laminar", () => {
    fc.assert(
      fc.property(arbEntrada, (e) => {
        const c = calcular(e);
        if (!c.ok) throw new Error("inválido");
        const { f, Re, regimen } = c.resultados;
        expect(f).toBeGreaterThan(0);
        if (regimen !== "laminar") {
          const { D_m: D, K_m: K } = c.intermedios;
          const residuo = 1 / Math.sqrt(f) + 2 * Math.log10(2.51 / (Re * Math.sqrt(f)) + K / (3.71 * D));
          expect(Math.abs(residuo)).toBeLessThan(1e-4);
        }
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("nunca devuelve NaN ni infinito", () => {
    fc.assert(
      fc.property(arbEntrada, (e) => {
        for (const v of Object.values(r(e))) if (typeof v === "number") expect(Number.isFinite(v)).toBe(true);
      }),
      { numRuns: NUM_RUNS },
    );
  });

  it("nunca lanza excepciones, ni con entradas arbitrarias", () => {
    const arbCualquiera = fc.record({
      tabla: fc.constantFrom("PVC", "PE", "Manual", "otra"),
      dn: fc.option(fc.double(), { nil: null }),
      pn: fc.option(fc.double(), { nil: null }),
      di_manual: fc.option(fc.double(), { nil: null }),
      material: fc.oneof(fc.constantFrom(...MATERIALES), fc.string()),
      k_manual: fc.option(fc.double(), { nil: null }),
      c_manual: fc.option(fc.double(), { nil: null }),
      L: fc.double(),
      T: fc.double(),
      Q_valor: fc.double(),
      Q_unidad: fc.oneof(fc.constantFrom(...UNIDADES), fc.string()),
      cantidades: fc.dictionary(fc.string(), fc.double()),
      singularidades_extra: fc.array(
        fc.record({
          nombre: fc.string({ maxLength: 80 }),
          k: fc.option(fc.double(), { nil: null }),
          cantidad: fc.option(fc.oneof(fc.integer({ min: -5, max: 1200 }), fc.double()), { nil: null }),
        }),
        { maxLength: 12 },
      ),
    });
    fc.assert(
      fc.property(arbCualquiera, (e) => {
        const c = calcular(e);
        if (c.ok) for (const v of Object.values(c.resultados)) if (typeof v === "number") expect(Number.isFinite(v)).toBe(true);
      }),
      { numRuns: 3000 },
    );
  });
});

describe("Colebrook y viscosidad", () => {
  it("converge en <= 30 iteraciones en Re 4E3–1E8 y K/D 0–0,05", () => {
    fc.assert(
      fc.property(
        fc.double({ min: Math.log10(4000), max: 8, noNaN: true }),
        fc.oneof(fc.constant(0), fc.double({ min: -7, max: Math.log10(0.05), noNaN: true }).map((x) => 10 ** x)),
        (logRe, KD) => {
          const c = colebrook(10 ** logRe, KD * 0.1, 0.1);
          expect(c.ok).toBe(true);
          if (c.ok) {
            expect(c.f).toBeGreaterThan(0);
            expect(c.f).toBeLessThan(0.1);
            expect(c.iteraciones).toBeLessThanOrEqual(30);
          }
        },
      ),
      { numRuns: 2000 },
    );
  });

  it("Swamee-Jain queda dentro de ±3 % en su rango de validez", () => {
    fc.assert(
      fc.property(
        fc.double({ min: Math.log10(5000), max: 8, noNaN: true }),
        fc.double({ min: -6, max: -2, noNaN: true }),
        (logRe, logKD) => {
          const Re = 10 ** logRe;
          const KD = 10 ** logKD;
          const c = colebrook(Re, KD * 0.1, 0.1);
          if (!c.ok) throw new Error("no convergió");
          const fsj = 0.25 / Math.log10(KD / 3.7 + 5.74 / Re ** 0.9) ** 2;
          expect(Math.abs(fsj / c.f - 1)).toBeLessThan(0.03);
        },
      ),
      { numRuns: 2000 },
    );
  });

  it("la viscosidad es exacta en los puntos de la tabla y estrictamente decreciente", () => {
    for (const p of TABLAS.viscosidad) expect(viscosidad(p.t_c)).toBe(p.nu_m2s);
    let prev = Infinity;
    for (let t = 0; t <= 60.0001; t += 0.1) {
      const nu = viscosidad(Math.min(t, 60));
      expect(nu).toBeLessThan(prev);
      prev = nu;
    }
  });
});
