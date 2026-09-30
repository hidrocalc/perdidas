# Guía del piloto con alumnos (etapa 5)

Un práctico de una clase (unos 60 minutos) en el que los alumnos resuelven 3 ejercicios con la app y con el Excel del curso, comparan los resultados y responden una encuesta corta.

**App:** https://hidrocalc.github.io/perdidas/
**Registro:** planilla *Etapa 5 - Registro de pruebas.xlsx* (en la carpeta del proyecto), hojas *Piloto* y *Encuesta SUS*.

## Qué se quiere saber

| Pregunta | Cómo se mide | Meta |
| --- | --- | --- |
| ¿La app da lo mismo que el Excel? | Pérdida total de cada ejercicio en la app y en el Excel | Todos iguales (diferencia < 0,0005 m) |
| ¿Es fácil de usar? | Encuesta SUS (10 preguntas, puntaje de 0 a 100) | Promedio ≥ 70 |
| ¿Hay errores? | Comentarios y problemas anotados | Ninguno crítico ni mayor |

## Antes de la clase (docente)

1. Abrí la app en la compu del aula y en tu celular: tiene que decir "Lista para usar sin conexión".
2. Tené el QR o el link a mano (pizarrón o EVA) y el Excel del curso en las compus.
3. Imprimí la **hoja para el alumno** (una por pareja) o compartila en el EVA.
4. Asigná un número a cada alumno o pareja: la planilla no lleva nombres.

## Desarrollo (60 min)

| Tiempo | Actividad |
| --- | --- |
| 10 min | **Abrir la app.** Con wifi, cada uno abre el link. Instalarla es opcional: sirve para tenerla con un ícono y usarla sin señal (Chrome: menú ⋮ → *Instalar app*; iPhone: Safari → Compartir → *Agregar a inicio*). Que verifiquen "Lista para usar sin conexión". |
| 10 min | **Ejercicio 1, guiado.** Resolverlo todos juntos en la app, mostrando el valor "Interpretado" debajo de cada campo y el "paso a paso". |
| 25 min | **Ejercicios 2 y 3, en parejas.** Cada pareja los resuelve en la app **y** en el Excel, y anota en la hoja la pérdida total de cada uno y cuántos minutos tardó con la app. |
| 5 min | **Encuesta** (10 preguntas, de 1 a 5). |
| 10 min | **Puesta en común.** ¿Coincidieron app y Excel? ¿Qué confundió? ¿Qué agregarían? |

## Ejercicios

Agua a presión en un tramo. Calculá la pérdida de carga total (Darcy-Weisbach) y comparala con Hazen-Williams.

| N.º | Situación | Tubería | Material | L | T | Caudal | Singularidades |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Conducción principal | PVC DN 180 PN 6 | PVC | 50 m | 20 °C | 280 000 l/h | 1 entrada proyectada, 1 salida a depósito |
| 2 | Lateral de riego | PE DN 40 PN 6 | Polietileno (PE) | 120 m | 15 °C | 1,2 l/s | 1 entrada con bordes vivos, 2 codos 90°, 1 válvula esclusa abierta, 1 salida a depósito |
| 3 | Impulsión de bombeo | DI 102 mm (manual) | Acero galvanizado nuevo, buena galvanización | 300 m | 25 °C | 36 m³/h | 4 codos 90°, 1 válvula de retención, 1 tee paso directo |

**Resultados esperados (solo para el docente):**

| N.º | V (m/s) | f | hf DW (m) | Pérdida total (m) | hf HW (m) | Advertencias |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 3,451 | 0,01438 | 2,577 | 3,657 | 2,503 | Velocidad alta |
| 2 | 1,438 | 0,02203 | 8,541 | 8,878 | 8,107 | Hazen-Williams pierde precisión (D < 50 mm) |
| 3 | 1,224 | 0,02147 | 4,820 | 5,286 | 5,576 | Ninguna |

Calculados con la implementación de referencia, que coincide con el Excel del curso. Para discutir: en el ejercicio 3, Hazen-Williams da un 16 % más que Darcy-Weisbach.

## Encuesta (SUS)

Marcá de 1 (muy en desacuerdo) a 5 (muy de acuerdo):

1. Creo que me gustaría usar esta app con frecuencia.
2. Encontré la app innecesariamente compleja.
3. Pensé que la app era fácil de usar.
4. Creo que necesitaría ayuda de una persona con conocimientos técnicos para poder usarla.
5. Encontré que las distintas partes de la app estaban bien integradas.
6. Pensé que había demasiadas cosas inconsistentes en la app.
7. Imagino que la mayoría de las personas aprendería a usar esta app muy rápido.
8. Encontré la app muy engorrosa de usar.
9. Me sentí con mucha confianza usando la app.
10. Necesité aprender muchas cosas antes de poder arrancar con la app.

Es la escala SUS (*System Usability Scale*), estándar para medir usabilidad. La planilla calcula el puntaje sola.

## Después de la clase

1. Cargá en la planilla, hoja *Piloto*: número de alumno, ejercicio, pérdida total en la app y en el Excel, y el tiempo.
2. Cargá las encuestas en la hoja *Encuesta SUS*.
3. Anotá los problemas o pedidos que surgieron (con los datos que estaban usando) y mandale todo a Takeshi.
