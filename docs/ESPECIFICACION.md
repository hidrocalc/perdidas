# Especificación técnica — App Darcy-Weisbach v1

Copia en el repo de la especificación validada (original en claude.ai, 2026-09-25). **Este archivo es la referencia para el código:** si algo cambia, se actualiza acá primero y después el Excel, el oráculo, los vectores y el motor.

## Propósito y alcance

Este documento fija exactamente qué calcula la app v1, con qué fórmulas, en qué rangos y con qué mensajes. Todo el código y las pruebas se derivan de acá.

- **Alcance:** pérdida de carga en un tramo de tubería a presión con agua: fricción por Darcy-Weisbach (f según Colebrook-White, o 64/Re en laminar), Hazen-Williams como comparación y pérdidas localizadas.
- **Fuente de verdad:** el archivo *Darcy Weisbach - corregido.xlsx*. Donde este documento lo cambia, el Excel se actualizó para que ambos coincidan.

## Entradas

La app tiene 12 entradas: las 11 celdas celestes del Excel más las singularidades propias. Una diferencia a propósito: la app solo ofrece las combinaciones DN/PN que existen en la tabla, así que el caso "No existe" del Excel no puede ocurrir.

| # | Campo | Unidad | Tipo | Rango válido | Por defecto |
| --- | --- | --- | --- | --- | --- |
| E1 | Tabla de diámetros | — | Lista | PVC, PE, Manual | PVC |
| E2 | Diámetro nominal DN | mm | Lista | PVC: 25–500; PE: 10–63 (según la tabla) | 180 |
| E3 | Presión nominal PN | kg/cm² | Lista | Solo las PN con DI definido para ese DN | 6 |
| E4 | DI manual (solo con "Manual") | mm | Número | 1 ≤ DI ≤ 5000; obligatorio si E1 = Manual | vacío |
| E5 | Material | — | Lista | Los 19 materiales de la tabla de rugosidad | Cloruro de polivinilo (PVC) |
| E6 | K manual (opcional) | mm | Número | 0 ≤ K ≤ 50; vacío = máximo del rango de la tabla | vacío |
| E7 | C de Hazen-Williams manual (opcional) | — | Número | 50 ≤ C ≤ 160; vacío = valor de la tabla | vacío |
| E8 | Longitud L | m | Número | 0 < L ≤ 100 000 | 50 |
| E9 | Temperatura del agua T | °C | Número | 0 ≤ T ≤ 60 | 20 |
| E10 | Caudal Q (valor y unidad) | ver Unidades | Número + lista | Q > 0 y Q ≤ 10 m³/s después de convertir | 280 000 l/h |
| E11 | Cantidad por singularidad de tabla | — | Entero | 0–999, una por cada fila de la tabla de singularidades | Entrada proyectada = 1, Salida = 1, resto = 0 |
| E12 | Singularidades propias | — | Lista de filas (nombre, K, cantidad) | Hasta 10 filas; nombre de hasta 60 caracteres (opcional); 0 ≤ K ≤ 100; cantidad entera 0–999 | ninguna |

Reglas comunes a los campos numéricos:

- Un único signo, "," o ".", se interpreta como separador decimal ("0,02" = "0.02"). Si hay más de un signo o se mezclan ("1.000,5", "1,000.5"), el valor se rechaza por ambiguo.
- Se aceptan notación científica ("1e-3") y espacios al inicio o al final. Texto, vacío (en los campos obligatorios), NaN e infinito se rechazan.
- Al lado de cada campo se muestra el valor que la app interpretó, con separación de miles. Así, quien escribe "280.000" pensando en 280 mil ve "280" y detecta el error.

## Unidades y conversiones

Todo el cálculo interno se hace en SI (m, m³/s, m²/s). El caudal se convierte a m³/s una sola vez, al entrar, con estos factores exactos:

| Unidad | Factor a m³/s |
| --- | --- |
| l/h | 1 / 3 600 000 |
| l/min | 1 / 60 000 |
| l/s | 1 / 1 000 |
| m³/h | 1 / 3 600 |
| m³/día | 1 / 86 400 |
| m³/s | 1 |
| gpm (US) | 0,003785411784 / 60 (galón US = 3,785411784 l, exacto por definición) |

DI [mm] / 1000 = D [m]; K [mm] / 1000 = K [m]. La app muestra además el caudal equivalente en m³/h, l/s, m³/s y l/h.

## Algoritmo de cálculo

10 pasos, en este orden, con π de doble precisión y g = 9,81 m/s².

1. **Diámetro, rugosidad y C.** D = DI/1000 (DI de la tabla E1–E3, o manual E4). K = K manual si se ingresó; si no, el **máximo** del rango de la tabla; K [m] = K [mm]/1000. C = C manual si se ingresó; si no, el de la tabla.
2. **Viscosidad.** Interpolación lineal en la tabla (Tᵢ, νᵢ); i = mayor índice con Tᵢ ≤ T, limitado al penúltimo punto (T = 60 °C usa el último tramo): ν = νᵢ + (T − Tᵢ)·(νᵢ₊₁ − νᵢ)/(Tᵢ₊₁ − Tᵢ).
3. **Caudal.** Q [m³/s] = valor × factor de la unidad.
4. **Velocidad.** A = πD²/4; V = Q/A.
5. **Reynolds.** Re = V·D/ν.
6. **Régimen.** Laminar si Re < 2000; transición si 2000 ≤ Re ≤ 4000; turbulento si Re > 4000.
7. **Factor de fricción f.**
    - Laminar: f = 64/Re, sin iterar (iteraciones = 0).
    - Transición y turbulento: Colebrook-White iterativo. f₀ = [−2·log₁₀(K/(3,71·D))]⁻² si K > 0, o f₀ = 0,02 si K = 0. Iteración: fᵢ₊₁ = [−2·log₁₀(2,51/(Re·√fᵢ) + K/(3,71·D))]⁻².
    - Parada: primera iteración con |fᵢ₊₁ − fᵢ| < 1E-6; se adopta f = fᵢ₊₁. Máximo 30 iteraciones; si no converge → error E-NOCONV.
8. **Control Swamee-Jain** (solo informativo): f_SJ = 0,25 / [log₁₀(K/(3,7·D) + 5,74/Re^0,9)]².
9. **Pérdidas.** hv = V²/(2g); hf = f·(L/D)·hv; h_loc = (Σ nⱼ·Kⱼ)·hv, sumando de izquierda a derecha primero las singularidades de tabla y después las propias; h_total = hf + h_loc.
10. **Hazen-Williams** (SI, comparación): hf_HW = 10,679·L·Q^1,852 / (C^1,852·D^4,87). Pendiente J = hf/L; pérdida cada 100 m = 100·J; diferencia HW vs DW = hf_HW/hf − 1.

## Resultados y formato

Los mismos 14 resultados del Excel. El redondeo es solo visual; el cálculo y las pruebas usan precisión completa.

| Resultado | Unidad | Formato | Ejemplo (datos por defecto) |
| --- | --- | --- | --- |
| Velocidad V | m/s | 3 decimales | 3,451 |
| Control de velocidad | — | OK / BAJA / ALTA | ALTA (> 2,5 m/s) |
| Reynolds Re | — | Entero con separador de miles | 582 262 |
| Régimen | — | Texto | Turbulento |
| Factor de fricción f | — | 5 decimales | 0,01438 |
| Iteraciones | — | Entero | 4 |
| f de Swamee-Jain (control) | — | 5 decimales y diferencia en % | 0,01444 (+0,40 %) |
| hf por fricción (DW) | m | 3 decimales | 2,577 |
| hf de Hazen-Williams | m | 3 decimales | 2,503 |
| Diferencia HW vs DW | % | 1 decimal | −2,9 % |
| Pérdidas localizadas | m | 3 decimales | 1,080 |
| **Pérdida total (DW)** | m | 3 decimales, destacada | **3,657** |
| Pendiente J | m/m | 4 decimales | 0,0515 |
| Pérdida cada 100 m | m/100 m | 3 decimales | 5,154 |

Datos por defecto: PVC DN 180 PN 6 (DI 169,4 mm), L = 50 m, T = 20 °C, Q = 280 000 l/h, 1 entrada proyectada y 1 salida. Coma decimal y espacio fino como separador de miles. Vista "paso a paso" con A, V, Re, K/D, f₀, la tabla de iteraciones y hv, para uso didáctico.

## Advertencias y errores

Un **error** bloquea el resultado y marca el campo. Una **advertencia** muestra el resultado con un aviso visible.

| Código | Nivel | Condición | Mensaje al usuario |
| --- | --- | --- | --- |
| E-VACIO | Error | Falta un campo obligatorio | "Ingresá un valor para {campo}." |
| E-FORMATO | Error | Texto no numérico o separador ambiguo | "{campo}: no es un número válido. Usá coma o punto decimal, sin separador de miles." |
| E-RANGO | Error | Valor fuera del rango de la tabla de Entradas | "{campo} debe estar entre {mín} y {máx} {unidad}." |
| E-NOCONV | Error | Colebrook no converge en 30 iteraciones | "El cálculo del factor de fricción no convergió. Revisá los datos." |
| A-LAMINAR | Advertencia | Re < 2000 | "Régimen laminar: se usa f = 64/Re." |
| A-TRANSICION | Advertencia | 2000 ≤ Re ≤ 4000 | "Régimen de transición: el resultado es incierto (Colebrook no es válido en esta zona)." |
| A-VEL-ALTA | Advertencia | V > 2,5 m/s | "Velocidad alta (> 2,5 m/s): riesgo de golpe de ariete y desgaste." |
| A-VEL-BAJA | Advertencia | V < 0,6 m/s | "Velocidad baja (< 0,6 m/s): riesgo de sedimentación." |
| A-KD | Advertencia | K/D > 0,05 | "Rugosidad relativa fuera del rango del diagrama de Moody (K/D > 0,05)." |
| A-HW | Advertencia | T < 5 °C o T > 25 °C, o D < 50 mm | "Hazen-Williams es empírica y pierde precisión con estos datos; usar Darcy-Weisbach." |

Campos de error que devuelve el motor (`campo`): `tabla`, `di_manual`, `dn_pn`, `material`, `k_manual`, `c_manual`, `L`, `T`, `Q_m3s`, `Q_unidad`, `cantidad`, `extra_max`, `extra_nombre`, `extra_k`, `extra_cantidad`. Mensajes con voseo, siempre diciendo qué hacer. Nunca se muestra NaN, Infinity ni un número sin unidad.

## Tablas de datos

Viven en `packages/data/tablas.json`, generado desde el Excel con `oracle/export_tables.py`. C de Hazen-Williams y K de singularidades están aprobados por ahora; el usuario puede cargar C manual y singularidades propias.

**Rugosidad y C de Hazen-Williams** (K adoptado = máximo del rango):

| Material | K mín (mm) | K máx = adoptado (mm) | C HW |
| --- | --- | --- | --- |
| Polietileno (PE) | 0,002 | 0,002 | 150 |
| Cloruro de polivinilo (PVC) | 0,02 | 0,02 | 150 |
| PVC orientado | 0,007 | 0,007 | 150 |
| Tubería estirada (latón, cobre, plomo) | 0,0015 | 0,01 | 140 |
| Aluminio | 0,015 | 0,06 | 135 |
| Acero estirado sin soldadura - nuevo | 0,02 | 0,10 | 130 |
| Acero estirado sin soldadura - muchos años | 1,2 | 1,5 | 100 |
| Acero galvanizado - nuevo, buena galv. | 0,07 | 0,10 | 125 |
| Acero galvanizado - galv. ordinaria | 0,10 | 0,15 | 120 |
| Fundición - nueva | 0,25 | 1,00 | 130 |
| Fundición - nueva con revest. bituminoso | 0,10 | 0,15 | 130 |
| Fundición - asfaltada | 0,12 | 0,30 | 125 |
| Fundición - varios años en servicio | 1,00 | 4,00 | 100 |
| Hormigón - superficie muy lisa | 0,3 | 0,8 | 130 |
| Hormigón - condiciones medias | 2,5 | 2,5 | 120 |
| Hormigón - superficie rugosa | 3 | 9 | 110 |
| Hormigón armado | 2,5 | 2,5 | 120 |
| Fibrocemento - nuevo | 0,05 | 0,10 | 140 |
| Fibrocemento - varios años en uso | 0,60 | 0,60 | 130 |

**Singularidades (K·V²/2g):** entrada proyectada 0,78 · entrada con bordes vivos 0,5 · entrada redondeada 0,1 · salida a depósito 1,0 · codo 90° radio estándar 0,75 · codo 45° 0,4 · tee paso directo 0,6 · tee salida lateral 1,8 · válvula esclusa abierta 0,2 · válvula de retención 2,5. Más hasta 10 singularidades propias (E12); el Excel trae 3 filas para eso.

**Viscosidad cinemática del agua** (×1E-6 m²/s): 0 °C 1,787 · 5 °C 1,519 · 10 °C 1,307 · 15 °C 1,139 · 20 °C 1,004 · 25 °C 0,893 · 30 °C 0,801 · 35 °C 0,724 · 40 °C 0,658 · 50 °C 0,553 · 60 °C 0,474.

**Diámetros interiores:** PVC (DN 25–500, PN 4/6/10/16) y PE (DN 10–63, PN 2,5/4/6/10), tal cual las tablas del curso (hoja Tablas del Excel).

## Criterios de aceptación

Una implementación cumple si reproduce los vectores de `test_vectors/` con error relativo ≤ 1E-9 en cada número (las restas `delta` y `dif_hw_dw`, con error absoluto ≤ 1E-12), y devuelve exactamente los mismos códigos de error y advertencia, el mismo número de iteraciones y la misma estructura.

| Verificación | Estado (2026-09-25) |
| --- | --- |
| Oráculo (Python) vs Excel, 309 casos en LibreOffice | 0 diferencias; máximo 1,2E-13 |
| Motor TS vs 340 vectores de cálculo + 34 de parseo | 400 pruebas aprobadas (nube, CI y Windows) |
| Convergencia (Re 4E3–1E8, K/D 0–0,05) | Máximo 8 iteraciones |
| Swamee-Jain en su rango de validez (5E3 ≤ Re ≤ 1E8, 1E-6 ≤ K/D ≤ 1E-2) | Máximo 2,2 % (tolerancia 3 %) |
| Prueba de mutación | 25 de 25 detectados |
| Casos de libro | Pendiente: faltan los ejercicios de la docente |

**Diferencia conocida con el Excel en los límites exactos:** Excel compara con 15 cifras significativas y la app compara exacto en IEEE 754. Un Re de 4000,0000000000014 es transición para el Excel y turbulento para la app. Sin efecto práctico; por eso los vectores no se ubican justo sobre los límites.

## Decisiones de validación

| Punto | Decisión |
| --- | --- |
| K adoptado cuando la tabla da un rango | Máximo del rango, si no hay K manual |
| C de Hazen-Williams | Los 19 valores de la tabla por ahora; C manual opcional |
| K de singularidades | Aprobados; hasta 10 singularidades propias |
| Coeficiente de Colebrook | 3,71 |
| Límites de velocidad | 0,6 y 2,5 m/s |
| Límites de régimen | Laminar < 2000; transición 2000–4000; turbulento > 4000 |
| g | 9,81 m/s² |
| f₀ = 0,02 cuando K = 0 | Aprobado |
