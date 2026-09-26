import { describe, expect, it } from "vitest";
import { seccionDeHash } from "../src/lib/navegacion";

describe("seccionDeHash", () => {
  it.each([
    ["", "calcular"],
    ["#", "calcular"],
    ["#calcular", "calcular"],
    ["#tablas", "tablas"],
    ["#acerca", "acerca"],
    ["tablas", "tablas"],
    ["#L", "calcular"],
    ["#<script>", "calcular"],
  ])("%j → %s", (hash, seccion) => {
    expect(seccionDeHash(hash)).toBe(seccion);
  });
});
