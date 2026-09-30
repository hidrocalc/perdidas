# Plan de desarrollo — App Darcy-Weisbach

Copia en el repo del plan (original en claude.ai). Estado al 2026-09-27.

## Resumen

La app es una **PWA (web instalable y offline) en TypeScript**, con costo USD 0, para Windows, macOS, Linux, Android e iOS desde un mismo código. El núcleo es un motor de cálculo aislado y verificado contra el Excel corregido. El desarrollo avanza en 7 etapas, cada una con un criterio de salida (gate).

Fuera de alcance en la v1: varios tramos en serie, dimensionamiento automático, gráficos, exportación a PDF y cuentas de usuario. Futuro opcional: empaquetar como app nativa (Capacitor o Tauri) reutilizando el motor y los tests.

## Requisitos (criterios verificables)

| Requisito | Criterio |
| --- | --- |
| Offline total | Después de la primera carga no hay llamadas de red (service worker con precache) |
| Peso | Carga inicial ≤ 500 KB comprimida |
| Precisión | hf coincide con el Excel con error relativo ≤ 1E-9 en todos los vectores |
| Validación | No se calcula con datos fuera de rango; cada campo muestra el motivo |
| Separador decimal | Coma y punto, sin ambigüedad con los miles |
| Rendimiento | Resultado en < 100 ms en un Android de gama baja (2 GB de RAM) |
| Navegadores | Chrome/Edge, Safari (macOS, iOS 16.4 o superior) y Firefox, en sus dos últimas versiones mayores |
| Actualizaciones | Aviso de versión nueva; nunca cambia el resultado en medio de un cálculo |
| Pantallas | De 360 px (celular) a 1920 px (proyector) |
| Accesibilidad | WCAG 2.1 AA, teclado completo, lectores de pantalla |
| Idioma | Español rioplatense con voseo; textos preparados para traducir |
| Didáctica | Muestra los valores intermedios (paso a paso) |
| Privacidad | Sin cuentas, sin cookies, sin analítica |

## Stack

TypeScript estricto · Vite + vite-plugin-pwa (Workbox) · interfaz en **Svelte 5** (decidido al inicio de la etapa 4, D-01) · Vitest + fast-check + Playwright (Chromium, Firefox, WebKit) · GitHub Pages · oráculo de referencia en Python.

## Etapas

| Etapa | Gate | Estado |
| --- | --- | --- |
| 0. Especificación | Validada por la docente (8 decisiones) | ✅ Cerrada |
| 1. Oráculo y vectores | Oráculo = Excel en el 100 % de los casos (≤ 1E-9) | ✅ 309 casos, 0 diferencias |
| 2. Motor `@dw/core` | Vectores 100 % OK, cobertura ≥ 95 %, tsc strict y ESLint sin avisos | ✅ 400 pruebas, CI en verde |
| 3. Datos y unidades | Tablas = Excel; conversiones de ida y vuelta sin pérdida | ✅ Cerrada (27/09/2026, resuelta dentro del motor, D-23) |
| 4. Interfaz, PWA y offline | Playwright en verde en 3 motores; Lighthouse accesibilidad ≥ 95 (la categoría PWA ya no existe, D-21); funciona en modo avión; aprobado por 2 docentes | ✅ Cerrada (27/09/2026, aprobada por las 2 docentes, D-23) |
| 5. Dispositivos y piloto | Resultados del piloto = Excel; SUS ≥ 70; 0 errores críticos o mayores reportados en el piloto. Piloto con alumnos del curso de la docente. Sin pruebas en equipos físicos: celulares emulados en la CI (D-26) | 🟡 En curso |
| 6. Publicación | Instalación y offline probados desde cero en las 5 plataformas; publicación y reversión documentadas | Pendiente |

## Estrategia de pruebas

| Nivel | Cómo | Cuándo |
| --- | --- | --- |
| Vectores de referencia | Excel = oráculo = TypeScript, relativo ≤ 1E-9 | Cada commit |
| Casos de libro | 5–10 ejercicios resueltos del curso (los aporta la docente) | Cada commit (pendiente de recibirlos) |
| Propiedades (fast-check) | hf crece con Q, L y K; baja con D; lineal en L; invariante a la unidad | Cada commit |
| Bordes y errores | Límites de régimen, T = 0 y 60, K = 0, DN/PN inexistente, entradas inválidas | Cada commit |
| End-to-end (Playwright) | 3 motores × 360/768/1920 px | Cada commit |
| Offline | Carga, calcula y consulta tablas sin red; una actualización no rompe la sesión abierta | Cada commit |
| Accesibilidad y peso | axe-core; presupuesto de Lighthouse en la CI | Cada commit |
| Regresión visual | Capturas en tema claro y oscuro | Cada release |
| Celulares emulados | iPhone 13 y Pixel 7 en Playwright, toda la suite (reemplaza las pruebas en equipos físicos, D-26) | Cada commit |
| Piloto | Práctico guiado: app vs Excel, encuesta SUS | Etapa 5 |

Regla de regresión: cada error encontrado se convierte primero en un test que falla y después se corrige. Nada se publica con la CI en rojo.

## Distribución

- Canal principal: `https://hidrocalc.github.io/perdidas/` (GitHub Pages, gratis), con QR y enlace en el EVA del curso.
- URL de staging para el piloto.
- Opcional: la misma PWA en Microsoft Store (registro gratis).
- Fuera de alcance mientras el costo sea cero: Google Play (USD 25), App Store (USD 99 por año; hay exención posible para instituciones educativas).

## Riesgos principales

| Riesgo | Mitigación |
| --- | --- |
| Resultado incorrecto que parece correcto | Especificación validada, triple implementación, vectores, mutación |
| La app no coincide con lo que se enseña | Tablas validadas por la cátedra; valores editables |
| Coma y punto mal interpretados | Parser propio con tests; valor interpretado visible |
| Primera visita sin señal en el campo | Instalar en la primera clase (QR); indicador de "Lista para usar sin conexión" |
| Una versión con error llega a todos | CI obligatoria, staging, piloto y reversión rápida |
| Safari borra la caché de PWAs poco usadas | La app no guarda datos críticos; recarga la caché al volver la conexión |
| Depender de una sola persona | Organización con dos propietarios, MIT, documentación, CI reproducible |
