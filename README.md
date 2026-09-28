# App Darcy-Weisbach

App para calcular pérdidas de carga en tuberías (Darcy-Weisbach con Colebrook-White, Hazen-Williams y pérdidas localizadas), destinada a docentes y estudiantes de la Facultad de Agronomía. Todo el cálculo se deriva de la *Especificación técnica v1* y se verifica contra el Excel corregido.

Estado: etapas 0 a 4 cerradas (especificación, oráculo y vectores, motor, datos y unidades, interfaz PWA). La app está publicada en https://hidrocalc.github.io/perdidas/ y fue aprobada por 2 docentes. Sigue la etapa 5: pruebas en dispositivos y piloto con alumnos. Las decisiones técnicas se registran en [docs/DECISIONES.md](docs/DECISIONES.md).

## Decisiones de validación aplicadas

K adoptado = máximo del rango. C de Hazen-Williams: valores de tabla, con C manual opcional. Hasta 10 singularidades propias. Colebrook con 3,71. Velocidad recomendada entre 0,6 y 2,5 m/s. Régimen: laminar si Re < 2000, transición si 2000 ≤ Re ≤ 4000, turbulento si Re > 4000. g = 9,81. f₀ = 0,02 cuando K = 0.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `packages/data/tablas.json` | Tablas exportadas del Excel corregido (nunca se editan a mano) |
| `packages/data/index.ts` | Tipos de las tablas (`@dw/data`) |
| `packages/core/src/` | Motor de cálculo en TypeScript puro (`@dw/core`), sin DOM ni framework |
| `packages/core/test/` | Vectores del oráculo, propiedades físicas (fast-check) y casos puntuales |
| `oracle/` | Oráculo de referencia en Python, exportador de tablas, generador de vectores y cruce con el Excel |
| `test_vectors/` | 343 casos de cálculo y 34 de parseo: el contrato entre oráculo y motor |
| `app/` | Interfaz PWA (`@dw/app`): Svelte 5 + Vite + vite-plugin-pwa; tests unitarios en `app/test/` y Playwright en `app/e2e/` |
| `.github/workflows/ci.yml` | CI: oráculo, vectores sin cambios, typecheck, lint, cobertura, build y Playwright en 3 motores |

## API del motor

```ts
import { calcular, parseNumero, ENTRADA_POR_DEFECTO } from "@dw/core";

const r = calcular({ ...ENTRADA_POR_DEFECTO, Q_valor: 18, Q_unidad: "m³/h" });
if (r.ok) console.log(r.resultados.h_total, r.advertencias);
else console.log(r.errores); // [{ codigo: "E-RANGO", campo: "L" }, …]
```

- `calcular` nunca lanza excepciones: devuelve el resultado o la lista de errores.
- Solo `validar()` produce una `EntradaValidada`, un tipo con marca que ya trae resueltos el DI, el material, el factor de caudal y las singularidades. El cálculo no puede recibir datos sin validar.
- `combinacionesDisponibles("PVC")` devuelve solo las combinaciones DN/PN que existen, para que la interfaz no ofrezca otras.

## Comandos

```bash
# Motor (Node 22 o superior, pnpm)
pnpm install
pnpm check            # typecheck + lint + tests con cobertura

# Oráculo (Python 3.11 o superior)
pip install -r oracle/requirements.txt
python oracle/export_tables.py "Darcy Weisbach - corregido.xlsx"   # solo si cambia el Excel
python oracle/generar_vectores.py
python -m pytest oracle -q
python oracle/cruzar_con_excel.py "Darcy Weisbach - corregido.xlsx" # requiere LibreOffice
```

## Estado de la verificación (2026-09-25)

| Verificación | Resultado |
| --- | --- |
| Oráculo vs Excel (309 casos válidos, recalculados en LibreOffice) | 0 diferencias; error relativo máximo 1,2E-13 (tolerancia 1E-9) |
| Motor TS vs vectores (340 de cálculo y 34 de parseo) | 100 % coinciden (relativo ≤ 1E-9; las restas se comparan con absoluto ≤ 1E-12) |
| Pruebas del motor | 400 aprobadas, incluidas propiedades físicas con miles de entradas aleatorias |
| Cobertura del motor | 100 % de líneas y funciones, 99,1 % de ramas (solo queda E-NOCONV, que no ocurre con datos válidos) |
| Prueba de mutación (25 errores introducidos a mano) | 25 de 25 detectados |
| TypeScript `strict` y ESLint `strictTypeChecked` | Sin errores ni avisos |
| Pruebas del oráculo | 22 aprobadas |

Cuando cambia una tabla o una fórmula, primero se actualiza la especificación, después el Excel, y luego: exportar tablas, generar vectores, `pnpm check` y cruzar con el Excel.

Licencia: MIT.
