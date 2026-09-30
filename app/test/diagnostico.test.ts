import { describe, expect, it } from "vitest";
import { estadoApp, medirCalculo } from "../src/lib/diagnostico";

describe("medirCalculo", () => {
  it("promedia y toma el máximo con el reloj que se le pase", () => {
    // Reloj falso: cada llamada avanza 1, 2, 3… ms → los tiempos medidos son 1, 1, 1…
    let t = 0;
    const m = medirCalculo(5, () => t++);
    expect(m).toEqual({ promedioMs: 1, maximoMs: 1, repeticiones: 5 });
  });

  it("con el reloj real, un cálculo tarda mucho menos que 100 ms", () => {
    const m = medirCalculo(50);
    expect(m.promedioMs).toBeGreaterThan(0);
    expect(m.maximoMs).toBeLessThan(100);
  });
});

describe("estadoApp", () => {
  const entorno = (o: { standalone?: boolean; displayStandalone?: boolean; sw?: "no" | "sin-control" | "con-control" }) => ({
    navigator: {
      userAgent: "Prueba/1.0",
      ...(o.standalone === undefined ? {} : { standalone: o.standalone }),
      ...(o.sw === undefined || o.sw === "no" ? {} : { serviceWorker: { controller: o.sw === "con-control" ? {} : null } }),
    },
    matchMedia: () => ({ matches: o.displayStandalone ?? false }),
  });

  it.each([
    [{}, { instalada: false, sinConexion: false }],
    [{ displayStandalone: true, sw: "con-control" as const }, { instalada: true, sinConexion: true }],
    [{ standalone: true, sw: "sin-control" as const }, { instalada: true, sinConexion: false }],
    [{ standalone: false, sw: "no" as const }, { instalada: false, sinConexion: false }],
  ])("%j → %j", (o, esperado) => {
    expect(estadoApp(entorno(o))).toEqual({ ...esperado, navegador: "Prueba/1.0" });
  });
});
