import { combinacionesDisponibles, diTablaMm } from "@dw/core";
import { TABLAS } from "@dw/data";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { factoresCaudal, tablaDiametros, viscosidadEnMicro } from "../src/lib/consulta";
import { VERSION_ESPECIFICACION } from "../src/lib/version";

describe("tabla de diámetros", () => {
  it.each(["PVC", "PE"] as const)("%s: cada celda es el DI del motor, y solo existen las combinaciones de la tabla", (tabla) => {
    const t = tablaDiametros(TABLAS.diametros[tabla]);
    let celdas = 0;
    for (const fila of t.filas) {
      t.pns.forEach((pn, j) => {
        expect(fila.di[j] ?? undefined).toBe(diTablaMm(tabla, fila.dn, pn));
        if (fila.di[j] !== null) celdas++;
      });
    }
    expect(celdas).toBe(combinacionesDisponibles(tabla).length);
  });

  it("PVC DN 180 PN 6 = 169,4 mm (ejemplo de la especificación)", () => {
    const t = tablaDiametros(TABLAS.diametros.PVC);
    expect(t.filas.find((f) => f.dn === 180)?.di[t.pns.indexOf(6)]).toBe(169.4);
  });
});

describe("factores de caudal", () => {
  it("como en la especificación", () => {
    const f = Object.fromEntries(factoresCaudal().map((x) => [x.unidad, x.factor]));
    expect(f["l/h"]).toBe("1 / 3 600 000");
    expect(f["m³/s"]).toBe("1");
    expect(f["gpm (US)"]).toBe("0,003785411784 / 60");
  });
});

describe("viscosidad", () => {
  it("se muestra en 10⁻⁶ m²/s: 20 °C → 1,004", () => {
    const p = TABLAS.viscosidad.find((v) => v.t_c === 20);
    expect(viscosidadEnMicro(p?.nu_m2s ?? 0)).toBeCloseTo(1.004, 12);
  });
});

describe("versión de la especificación", () => {
  it("coincide con la de los vectores de prueba", () => {
    const ruta = join(import.meta.dirname, "..", "..", "test_vectors", "calculo_normales.json");
    const meta = (JSON.parse(readFileSync(ruta, "utf-8")) as { meta: { version_especificacion: string } }).meta;
    expect(VERSION_ESPECIFICACION).toBe(meta.version_especificacion);
  });
});
