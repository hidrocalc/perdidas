// Presupuesto de peso (CLAUDE.md: carga inicial ≤ 500 KB comprimida; D-21).
// El service worker precachea todo el build en la primera visita, así que la
// "carga inicial" real es el build completo: se suma cada archivo comprimido con gzip.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const LIMITE_KB = 500;
const DIST = fileURLToPath(new URL("../dist", import.meta.url));

function archivos(dir) {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}

const filas = archivos(DIST)
  .map((ruta) => ({ archivo: relative(DIST, ruta).replaceAll("\\", "/"), bytes: gzipSync(readFileSync(ruta), { level: 9 }).length }))
  .sort((a, b) => b.bytes - a.bytes);

const kb = (b) => (b / 1024).toFixed(1).padStart(7);
const total = filas.reduce((s, f) => s + f.bytes, 0);

console.log("Peso del build (gzip):");
for (const f of filas) console.log(`${kb(f.bytes)} KB  ${f.archivo}`);
console.log(`${kb(total)} KB  TOTAL (límite ${LIMITE_KB} KB, ${((100 * total) / (LIMITE_KB * 1024)).toFixed(0)} % usado)`);

if (total > LIMITE_KB * 1024) {
  console.error(`\nSe superó el presupuesto de ${LIMITE_KB} KB. Revisá qué creció en la lista de arriba.`);
  process.exit(1);
}
