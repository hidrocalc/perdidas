/** Secciones de la app, elegidas con el #hash de la URL (sin router: D-02). */
export type Seccion = "calcular" | "tablas" | "acerca";

export const SECCIONES: readonly { readonly id: Seccion; readonly titulo: string }[] = [
  { id: "calcular", titulo: "Calcular" },
  { id: "tablas", titulo: "Tablas" },
  { id: "acerca", titulo: "Acerca de" },
];

/** "#tablas" → "tablas". Cualquier otro valor (vacío, "#L", basura) vuelve a la calculadora. */
export function seccionDeHash(hash: string): Seccion {
  const id = hash.replace(/^#/, "");
  return SECCIONES.find((s) => s.id === id)?.id ?? "calcular";
}
