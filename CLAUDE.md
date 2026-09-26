# CLAUDE.md — App Darcy-Weisbach (hidrocalc/perdidas)

Contexto para continuar el desarrollo con Claude Code. Leer entero antes de tocar código.

## Qué es

Calculadora de pérdidas de carga en tuberías (Darcy-Weisbach con Colebrook-White, Hazen-Williams y pérdidas localizadas) para docentes y estudiantes de la Facultad de Agronomía. Migra el Excel `Darcy Weisbach - corregido.xlsx`, que está en la carpeta padre (`..\`) y es la fuente de verdad de las tablas.

- Repo: https://github.com/hidrocalc/perdidas (público, licencia MIT, titular Takeshi; su madre, docente usuaria, es co-propietaria de la organización).
- Especificación técnica v1 (congelada): https://claude.ai/code/artifact/70c3d3cb-e28b-4f01-b4ee-1ca7243a3f87
- Plan de desarrollo: https://claude.ai/code/artifact/b9d0e5ec-c7f9-4aed-b05e-a059f9492976

## Restricciones del proyecto (no negociables)

| Restricción | Detalle |
| --- | --- |
| Costo cero | Sin tiendas ni cuentas pagas. Se distribuye como **PWA** en GitHub Pages |
| Plataformas | Windows, macOS, Linux, Android e iOS, desde el navegador con la opción "Instalar" |
| Offline total | Después de la primera carga no hay llamadas de red (service worker con precache) |
| Peso | Carga inicial ≤ 500 KB comprimida |
| Rigor | Ninguna fórmula nueva sin pasar por la especificación, el oráculo y los vectores |
| Idioma | Español rioplatense con voseo, en mensajes que digan qué hacer |
| Accesibilidad | WCAG 2.1 AA, uso completo con teclado, desde 360 px hasta 1920 px |
| Privacidad | Sin cuentas, sin cookies, sin analítica |

## Estado

| Etapa | Estado |
| --- | --- |
| 0. Especificación | Cerrada y validada (8 decisiones, ver abajo) |
| 1. Oráculo y vectores | Hecha: 340 casos de cálculo y 34 de parseo; oráculo = Excel en 309 casos, error máximo 1,2E-13 |
| 2. Motor `@dw/core` | Hecha: 400 pruebas, 100 % de líneas, 99 % de ramas, 25/25 mutantes detectados, CI en verde |
| 3. Datos y unidades | Casi resuelta dentro del motor (tablas exportadas del Excel, 7 unidades de caudal) |
| **4. Interfaz PWA** | **Siguiente** |
| 5. Pruebas en dispositivos y piloto | Pendiente: piloto con alumnos del curso de la docente |
| 6. Publicación | Pendiente: GitHub Pages + QR en el EVA |

## Decisiones de validación (ya aplicadas en todo)

- **K adoptado:** máximo del rango de la tabla si el usuario no carga K manual.
- **C de Hazen-Williams:** valores de tabla, con C manual opcional (50–160).
- **Singularidades:** las 10 de tabla, más hasta 10 propias (nombre ≤ 60 caracteres, 0 ≤ K ≤ 100, cantidad entera 0–999).
- **Colebrook:** coeficiente 3,71; tolerancia |Δf| < 1E-6; máximo 30 iteraciones; f₀ del régimen rugoso, o 0,02 si K = 0.
- **Régimen:** laminar si Re < 2000 (f = 64/Re); transición si 2000 ≤ Re ≤ 4000; turbulento si Re > 4000.
- **Velocidad recomendada:** 0,6–2,5 m/s (solo avisa). g = 9,81.

## Estructura y reglas del código

- `packages/core` (`@dw/core`): motor en TypeScript puro, sin DOM. **La interfaz nunca calcula**: solo llama a `calcular()` y `parseNumero()`.
- `packages/data`: `tablas.json`, generado por `oracle/export_tables.py` desde el Excel. **Nunca se edita a mano.**
- `oracle/`: implementación de referencia en Python. Es el que genera `test_vectors/`.
- Contrato: el motor reproduce los vectores con error relativo ≤ 1E-9 (las restas, con absoluto ≤ 1E-12).
- Solo `validar()` produce `EntradaValidada`, un tipo con marca: no se calcula nada sin validar.
- `calcular()` nunca lanza excepciones: devuelve `{ ok, resultados, advertencias }` o `{ ok: false, errores }`.
- La interfaz tiene que ofrecer solo las combinaciones DN/PN existentes: usar `combinacionesDisponibles()`.
- Cada campo numérico muestra el valor interpretado con separador de miles, para que un tipeo como "280.000" se detecte.

## Flujo obligatorio para cambiar una fórmula o una tabla

1. Actualizar la especificación.
2. Actualizar el Excel.
3. `python oracle/export_tables.py "..\Darcy Weisbach - corregido.xlsx"`.
4. `python oracle/generar_vectores.py`.
5. `pnpm check`.
6. `python oracle/cruzar_con_excel.py "..\Darcy Weisbach - corregido.xlsx"` (requiere LibreOffice).

## Comandos

```bash
pnpm install
pnpm check                                    # typecheck + lint (strictTypeChecked) + tests con cobertura
python -m pytest oracle -q
python oracle/generar_vectores.py --verificar # lo mismo que corre la CI
```

La CI (`.github/workflows/ci.yml`) corre en cada push: oráculo en Python 3.12, vectores verificados con tolerancia, typecheck, lint y cobertura ≥ 95 %. No commitear con la CI en rojo.

## Lecciones ya aprendidas

- No usar `sum()` en el oráculo: desde Python 3.12 usa suma compensada y cambia el último decimal. Sumar explícito de izquierda a derecha, igual que el motor y el Excel.
- No comparar vectores bit a bit entre plataformas: usar `oracle/comparar.py` (1E-12).
- Excel compara con 15 cifras significativas y la app compara exacto en IEEE 754. Por eso los vectores no se ubican justo sobre los límites (por ejemplo Re = 4000); los límites exactos se prueban con tests unitarios de `regimenDe` y `advertenciasDe`.
- Las restas de valores casi iguales (`delta`, `dif_hw_dw`) se comparan con error absoluto.

## Etapa 4: qué construir

Gate: tests end-to-end con Playwright en verde en Chromium, Firefox y WebKit; Lighthouse PWA y accesibilidad ≥ 95; funciona en modo avión; prototipo aprobado por 2 docentes.

1. **Decidir entre Svelte y Preact** (pendiente desde la etapa 0). El criterio es el presupuesto de 500 KB y la accesibilidad.
2. **`app/`**: Vite + vite-plugin-pwa (Workbox precache), manifiesto, íconos y un aviso de "Lista para usar sin conexión".
3. **Pantallas:**
    - Formulario de entradas E1–E12, con el orden y los valores por defecto de la especificación.
    - Resultados: los 14 de la especificación, con sus formatos (coma decimal, espacio fino como separador de miles).
    - Advertencias visibles.
    - Vista "paso a paso" (A, V, Re, K/D, f₀, tabla de iteraciones, hv).
    - Tablas de consulta.
    - "Acerca de", con la versión de la app, la de las tablas y las fórmulas.
4. **Mensajes de error y advertencia:** exactamente los textos de la sección "Advertencias y errores" de la especificación.
5. **Tests:** Playwright en 3 motores × 3 viewports (360, 768 y 1920 px), modo offline, axe-core y regresión visual. Agregarlos a la CI.
6. **Despliegue:** GitHub Pages desde la CI (rama `main`), con URL `https://hidrocalc.github.io/perdidas/`.

## Sobre la carpeta

El repo está dentro de OneDrive. Si aparecen bloqueos de archivos o conflictos en `.git` o `node_modules`, mover el repo a una carpeta fuera de OneDrive (por ejemplo `C:\dev\perdidas`).
