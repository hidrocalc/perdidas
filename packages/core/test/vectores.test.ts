/**
 * Contrato con el oráculo: el motor TypeScript reproduce cada vector de
 * test_vectors/ con error relativo <= 1E-9 en los números y coincidencia
 * exacta en enteros, textos, códigos y estructura.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { calcular, parseNumero, type Entrada } from "../src";

const DIR = join(import.meta.dirname, "..", "..", "..", "test_vectors");
const TOL = 1e-9;
const TOL_ABS_DIFERENCIAS = 1e-12;

interface Caso { id: string; descripcion: string; entrada: Entrada; esperado: unknown }
interface Archivo { meta: { tolerancia_relativa: number }; casos: Caso[] }

function leer(nombre: string): Archivo {
  return JSON.parse(readFileSync(join(DIR, nombre), "utf-8")) as Archivo;
}

/** Devuelve la ruta de la primera diferencia, o null si coinciden. */
function diferencia(real: unknown, esperado: unknown, ruta = "$"): string | null {
  if (typeof esperado === "number") {
    if (typeof real !== "number") return `${ruta}: esperado número, llegó ${typeof real}`;
    if (Number.isInteger(esperado) && !ruta.endsWith("f0") && (ruta.endsWith("iteraciones") || ruta.endsWith(".i"))) {
      return real === esperado ? null : `${ruta}: ${real} != ${esperado}`;
    }
    // Campos que son una resta de valores casi iguales: el error relativo se amplifica por
    // cancelación, así que se comparan con error absoluto (Especificación, Criterios de aceptación).
    if (ruta.endsWith(".delta") || ruta.endsWith(".dif_hw_dw")) {
      const abs = Math.abs(real - esperado);
      return abs <= TOL_ABS_DIFERENCIAS ? null : `${ruta}: ${real} vs ${esperado} (abs ${abs.toExponential(2)})`;
    }
    const rel = Math.abs(real - esperado) / Math.max(Math.abs(esperado), Number.MIN_VALUE);
    return rel <= TOL || real === esperado ? null : `${ruta}: ${real} vs ${esperado} (rel ${rel.toExponential(2)})`;
  }
  if (esperado === null || typeof esperado !== "object") {
    return real === esperado ? null : `${ruta}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`;
  }
  if (Array.isArray(esperado)) {
    if (!Array.isArray(real) || real.length !== esperado.length) {
      return `${ruta}: longitud ${Array.isArray(real) ? real.length : "no-array"} != ${esperado.length}`;
    }
    for (let i = 0; i < esperado.length; i++) {
      const d = diferencia(real[i], esperado[i], `${ruta}[${i}]`);
      if (d) return d;
    }
    return null;
  }
  if (real === null || typeof real !== "object" || Array.isArray(real)) return `${ruta}: esperado objeto`;
  const kr = Object.keys(real).sort();
  const ke = Object.keys(esperado).sort();
  if (JSON.stringify(kr) !== JSON.stringify(ke)) return `${ruta}: claves ${kr.join(",")} != ${ke.join(",")}`;
  for (const k of ke) {
    const d = diferencia((real as Record<string, unknown>)[k], (esperado as Record<string, unknown>)[k], `${ruta}.${k}`);
    if (d) return d;
  }
  return null;
}

const archivos = readdirSync(DIR).filter((f) => f.startsWith("calculo_")).sort();

describe("tolerancia declarada en los vectores", () => {
  it.each(archivos)("%s usa 1E-9", (f) => {
    expect(leer(f).meta.tolerancia_relativa).toBe(TOL);
  });
});

for (const archivo of archivos) {
  describe(archivo, () => {
    it.each(leer(archivo).casos.map((c) => [c.id, c.descripcion, c] as const))("%s %s", (_id, _d, caso) => {
      expect(diferencia(calcular(caso.entrada), caso.esperado)).toBeNull();
    });
  });
}

describe("parseo.json", () => {
  const casos = (leer("parseo.json").casos as unknown as { texto: string; valor: number | null; error: string | null }[]);
  it.each(casos.map((c) => [JSON.stringify(c.texto), c] as const))("%s", (_t, c) => {
    const r = parseNumero(c.texto);
    expect(r.ok ? [r.valor, null] : [null, r.error]).toEqual([c.valor, c.error]);
  });
});

it("hay al menos 300 vectores de cálculo", () => {
  const total = archivos.reduce((n, f) => n + leer(f).casos.length, 0);
  expect(total).toBeGreaterThanOrEqual(300);
});
