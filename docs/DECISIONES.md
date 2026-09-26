# Registro de decisiones

Decisiones técnicas tomadas durante el desarrollo, para poder auditarlas después. Cada entrada dice qué se decidió, por qué, qué alternativas se descartaron y qué impacto tiene. Las decisiones de cálculo (fórmulas, tablas, límites) viven en la [especificación](ESPECIFICACION.md); acá se registran las de implementación y las que llevaron a cambiarla.

Convención: la más reciente arriba. Si una decisión se revierte, no se borra: se agrega una nueva que la reemplaza y se marca la vieja como "Reemplazada por D-xx".

| ID | Fecha | Decisión | Estado |
| --- | --- | --- | --- |
| D-14 | 2026-09-25 | Regla `no-useless-default-assignment` apagada en `.svelte` | Vigente |
| D-13 | 2026-09-25 | Campos numéricos con `type="text"` e `inputmode`, no `type="number"` | Vigente |
| D-12 | 2026-09-25 | Cantidad de singularidad vacía = 0; se envían las 10 filas | Vigente |
| D-11 | 2026-09-25 | Cálculo en vivo, sin botón "Calcular" | Vigente |
| D-10 | 2026-09-25 | `tablas.json` no se toca si el Excel no cambió | Vigente |
| D-09 | 2026-09-25 | Especificación 1.1: el motor devuelve lo que la interfaz necesita mostrar | Vigente |
| D-08 | 2026-09-25 | Test offline apagando el servidor, no emulando la red | Vigente |
| D-07 | 2026-09-25 | Firefox de Playwright se omite solo en Windows local | Vigente |
| D-06 | 2026-09-25 | Redondeo visual igual al del Excel | Vigente |
| D-05 | 2026-09-25 | Formato de números sin `Intl.NumberFormat` | Vigente |
| D-04 | 2026-09-25 | Actualización de la PWA en modo "prompt" | Vigente |
| D-03 | 2026-09-25 | Los avisos de accesibilidad del compilador frenan el check | Vigente |
| D-02 | 2026-09-25 | Sin SvelteKit, router, librería de componentes ni framework CSS | Vigente |
| D-01 | 2026-09-25 | Interfaz en Svelte 5 | Vigente |

---

## D-14 · Regla `no-useless-default-assignment` apagada en `.svelte`

**Contexto.** En Svelte 5 una prop enlazable se declara `let { valor = $bindable() } = $props()`. La regla de typescript-eslint lo toma como un valor por defecto inútil.

**Decisión.** Se apaga solo para `**/*.svelte` y `**/*.svelte.ts`. El resto del lint `strictTypeChecked` sigue igual.

## D-13 · Campos numéricos con `type="text"` e `inputmode`, no `type="number"`

**Decisión.** `<input type="text" inputmode="decimal">` (o `numeric` para cantidades enteras). El texto lo interpreta `parseNumero()` del motor.

**Por qué.**

| Problema de `type="number"` | Consecuencia |
| --- | --- |
| Según el navegador y el idioma, rechaza la coma o el punto | "0,02" podría llegar vacío, en contra de la especificación |
| Si el texto no es un número, el navegador entrega `""` | No se puede mostrar "no es un número válido" ni el valor interpretado |
| La rueda del mouse cambia el valor sin querer | Resultados alterados sin que el usuario lo note |

`inputmode` sigue mostrando el teclado numérico en el celular.

## D-12 · Cantidad de singularidad vacía = 0; se envían las 10 filas

**Decisión.** En las singularidades de tabla, un campo vacío cuenta como 0 (el valor por defecto de la especificación). El formulario manda al motor las 10 cantidades, en el orden de la tabla, incluidos los ceros.

**Verificación.** Sumar `0·K` no cambia la suma en IEEE 754. Un test confirma que los valores por defecto del formulario dan **exactamente** (`toEqual`, sin tolerancia) los mismos resultados que `ENTRADA_POR_DEFECTO` del motor, que solo trae las 2 filas con cantidad 1.

**Por qué.** Así el índice `fila` de un error del motor coincide con la fila en pantalla.

## D-11 · Cálculo en vivo, sin botón "Calcular"

**Decisión.** Cada cambio en un campo vuelve a leer el formulario y llama a `calcular()` (tarda menos de 1 ms). Si hay errores, el panel de resultados muestra "Corregí N datos para ver el resultado" con un enlace a cada campo; nunca quedan a la vista resultados viejos junto a datos nuevos.

**Por qué.** Para enseñar, ver cómo cambia la pérdida al tocar L, Q o el material vale más que un botón. El riesgo de un resultado desactualizado desaparece.

**Accesibilidad.** Los resultados no son una región `aria-live`: un lector de pantalla no anuncia cada tecla. Cada error está vinculado a su campo con `aria-describedby` y `aria-invalid`.

## D-10 · `tablas.json` no se toca si el Excel no cambió

**Contexto.** Al correr `oracle/export_tables.py` durante el cambio D-09, `packages/data/tablas.json` quedó modificado aunque el Excel no había cambiado.

**Decisión.** Se restauró la versión del repo. Se regeneraron los vectores con ella y resultaron **idénticos byte a byte** (SHA-256) a los generados con el archivo modificado: la diferencia no afectaba ningún valor (probablemente fines de línea de Windows).

**Regla desde ahora.** Solo se exporta y commitea `tablas.json` cuando cambia el Excel. Si al exportar aparece un diff sin cambios en el Excel, se descarta.

**Pendiente.** Hacer que el exportador escriba siempre con fin de línea `\n`, para que la exportación sea reproducible en Windows y en Linux.

## D-09 · Especificación 1.1: el motor devuelve lo que la interfaz necesita mostrar

**Contexto.** Regla del proyecto: la interfaz nunca calcula. La especificación v1 pedía mostrar tres cosas que el motor no devolvía:

| Qué | Problema |
| --- | --- |
| Diferencia de Swamee-Jain en % ("0,01444 (+0,40 %)") | La interfaz tendría que calcular f_SJ/f − 1 |
| Caudal equivalente en m³/h, l/s y l/h | La interfaz tendría que multiplicar Q por un factor |
| Errores de singularidades (qué fila) | El error decía `extra_k` pero no de qué fila: no se podía marcar el campo correcto |

**Decisión.** Revisión 1.1 de la especificación, con el flujo obligatorio de CLAUDE.md:

- `resultados.dif_sj = f_sj / f − 1`, igual que la celda "Calculo de f"!B20 del Excel. Se compara con error absoluto (es una resta de valores casi iguales).
- `intermedios.Q_m3h = Q·3600`, `Q_ls = Q·1000`, `Q_lh = Q·3 600 000`, con las mismas fórmulas que "Datos de entrada"!B28, B29 y B31.
- `fila` en cada error: la posición de la singularidad (desde 0), o `null`.
- Textos de E-RANGO para listas, `extra_max` y `extra_nombre`, que la especificación no tenía.

**Por qué así.** El Excel ya tenía esas celdas: no hay fórmulas nuevas, solo se exponen. Poner el cálculo en el motor lo deja cubierto por el oráculo y los vectores.

**Verificación.**

| Paso | Resultado |
| --- | --- |
| Excel | Sin cambios (ya tenía las celdas) |
| Vectores | 343 casos (3 nuevos: error en una fila que no es la primera); `--verificar` OK |
| Oráculo | 22 pruebas OK |
| Motor | 470 pruebas, 100 % de líneas |
| Oráculo vs valores guardados en el Excel | dif_sj, f_sj, f, Q equivalentes y h_total: error relativo ≤ 3,3E-15 |
| Cruce completo con LibreOffice (309 casos) | **Pendiente**: LibreOffice no está instalado en la máquina de desarrollo |

**Alternativa descartada.** Calcular esos valores en la interfaz: rompe la regla "la interfaz nunca calcula" y quedarían sin verificar contra el oráculo.

## D-08 · Test offline apagando el servidor, no emulando la red

**Contexto.** El primer test offline usaba `context.setOffline(true)` y recargaba. En WebKit falló ("WebKit encountered an internal error") en Windows y en la CI (Linux), aunque el service worker estaba instalado. Chromium y Firefox pasaban.

**Decisión.** El test levanta su propio `vite preview` (en un puerto libre), carga la app, espera "Lista para usar sin conexión", **apaga el servidor** y recarga. Si la página vuelve a aparecer, salió de la caché del service worker.

**Por qué.** Es un corte real, no depende de cómo emula la red cada motor, y funciona igual en los tres. Además se agregó un test que revisa el contenido del precache (index.html, manifiesto, JS y CSS).

**Alternativa descartada.** Omitir el test en WebKit: dejaba sin probar el motor de Safari.

## D-07 · Firefox de Playwright se omite solo en Windows local

**Contexto.** En la máquina de desarrollo (Windows 11 build 26200), el Firefox que descarga Playwright no arranca: "no se encontró el ensamblado dependiente mozglue", aunque `mozglue.dll` está en la carpeta. Reinstalarlo no lo resolvió.

**Decisión.** `playwright.config.ts` omite Firefox cuando corre en Windows, salvo con `E2E_FIREFOX=1`. **La CI (Linux) corre siempre los tres motores**, así que Firefox queda cubierto en cada push.

**Revisar.** Con una versión nueva de Playwright o de Windows: si Firefox arranca, se quita la omisión.

## D-06 · Redondeo visual igual al del Excel

**Contexto.** `toFixed` de JavaScript redondea sobre el valor binario: 1,0005 con 3 decimales da "1,000". El Excel muestra "1,001".

**Decisión.** `formatearNumero` redondea "mitad hacia arriba" sobre la representación de 15 cifras significativas, como el Excel.

**Por qué.** En el piloto (etapa 5) los alumnos comparan la app con el Excel: una diferencia en el último decimal mostrado generaría dudas sobre la precisión, aunque el cálculo sea idéntico.

## D-05 · Formato de números sin `Intl.NumberFormat`

**Decisión.** El formato es propio (`app/src/lib/formato.ts`):

| Elemento | Carácter | Motivo |
| --- | --- | --- |
| Separador decimal | `,` | Especificación |
| Separador de miles | espacio fino no separable (U+202F) | La especificación pide "espacio fino"; la variante no separable evita que "582 262" se corte en dos líneas |
| Signo negativo | `−` (U+2212) | Como el ejemplo "−2,9 %" de la especificación |
| Antes de `%` | espacio no separable (U+00A0) | Que "%" no quede solo en otra línea |
| Valor no finito | `—` | La especificación prohíbe mostrar NaN o Infinity |

Los grupos de miles se aplican desde 1 000 (4 cifras), para que el "valor interpretado" siempre muestre la separación.

**Alternativa descartada.** `Intl.NumberFormat("es-AR")`: cada navegador lo formatea distinto (punto de miles en unos, espacio en otros), y el punto de miles es justo la confusión que la especificación quiere evitar.

## D-04 · Actualización de la PWA en modo "prompt"

**Decisión.** `vite-plugin-pwa` con `registerType: "prompt"`: cuando hay una versión nueva, aparece un aviso con "Actualizar ahora" y "Más tarde". Nada cambia hasta que el usuario toca "Actualizar ahora".

**Por qué.** El plan pide que una actualización "nunca cambie el resultado en medio de un cálculo". Con actualización automática, la página podría recargarse mientras alguien copia resultados.

**Complemento.** El indicador "Lista para usar sin conexión" se muestra siempre que hay un service worker controlando la página, no solo la primera vez.

## D-03 · Los avisos de accesibilidad del compilador frenan el check

**Decisión.** `svelte-check --fail-on-warnings` forma parte de `pnpm typecheck`. Cualquier aviso de accesibilidad del compilador de Svelte (imagen sin `alt`, clic sin teclado, ARIA inválido, etc.) hace fallar `pnpm check` y la CI. Se probó con un componente con errores a propósito: detectó los 3.

**Complemento.** axe-core (WCAG 2.1 AA) corre en Playwright en los 3 motores y 3 anchos.

## D-02 · Sin SvelteKit, router, librería de componentes ni framework CSS

**Decisión.** Vite + Svelte puro. Una sola página con secciones; navegación con `#hash`. CSS propio con variables para tema claro y oscuro, y fuentes del sistema (0 KB de fuentes).

**Por qué.** La app es una sola pantalla de cálculo más tablas y "Acerca de". Cada dependencia suma peso, superficie de accesibilidad para auditar y actualizaciones para mantener. Tamaño actual: ~19 KB comprimidos de JS y CSS (el presupuesto es 500 KB).

## D-01 · Interfaz en Svelte 5

**Contexto.** Pendiente desde la etapa 0: Svelte o Preact.

**Decisión.** Svelte 5.

| Criterio | Resultado |
| --- | --- |
| Peso (≤ 500 KB) | Empate: los dos quedan en decenas de KB |
| Accesibilidad | Ventaja Svelte: el compilador trae unas 30 reglas de accesibilidad (ver D-03) |
| Offline (vite-plugin-pwa) | Empate: integración oficial para los dos |
| Playwright | Empate: prueba el DOM, no el framework |
| Formulario con muchos campos | Ventaja Svelte: `bind:value` |
| Mantenimiento por alguien que no es frontend | Ventaja Svelte: plantillas parecidas a HTML, reactividad explícita |
| Lint estricto con tipos | Ventaja Preact: `.tsx` es TypeScript puro |

**Costo aceptado.** El lint con tipos dentro de las plantillas `.svelte` es algo menos estricto que en `.tsx`. Se compensa con `svelte-check` y con que la lógica delicada vive en `@dw/core`, que mantiene el lint más estricto.

**Versiones al decidir:** svelte 5.57, vite 8.3, @sveltejs/vite-plugin-svelte 7.3, vite-plugin-pwa 1.3, @playwright/test 1.63.
