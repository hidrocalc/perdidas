# Guía de revisión del prototipo — para docentes

Gracias por revisar la app. Lleva unos 20 minutos. No hace falta saber nada de programación: la idea es que la uses como la usaría un alumno y nos cuentes qué funciona, qué confunde y qué falta.

**Dirección:** https://hidrocalc.github.io/perdidas/

Tené a mano el Excel del curso (*Darcy Weisbach - corregido.xlsx*) para comparar.

## 1. Abrirla e instalarla (3 min)

1. Abrí la dirección en el celular o en la compu.
2. Instalala: en Chrome o Edge, menú ⋮ → *Instalar app* (o *Agregar a pantalla principal*). En iPhone: Safari → Compartir → *Agregar a inicio*.
3. Esperá a ver arriba "✓ Lista para usar sin conexión".
4. Poné el celular en **modo avión** y abrí la app desde el ícono. Tiene que funcionar igual.

## 2. Comparar con el Excel (8 min)

Cargá los mismos datos en la app y en el Excel, y compará la **pérdida total** y el **factor de fricción f**. Tienen que coincidir en todos los decimales que muestra la app.

| Caso | Datos | Qué mirar |
| --- | --- | --- |
| A | Los que trae la app al abrir (PVC DN 180 PN 6, L = 50 m, T = 20 °C, Q = 280 000 l/h, 1 entrada proyectada y 1 salida) | Pérdida total 3,657 m; aviso de velocidad alta |
| B | Un ejercicio del curso que conozcas bien | Que el resultado sea el del libro o la planilla |
| C | Un caudal chico, por ejemplo Q = 100 l/h | Régimen laminar, f = 64/Re y aviso de velocidad baja |
| D | PVC DN 25 PN 10, material "Hormigón - superficie rugosa", Q = 1000 l/h (el resto como al abrir) | Pérdida total 16,955 m; avisos de rugosidad relativa y de Hazen-Williams |

Si tenés ejercicios resueltos del curso, **mandanos 5 a 10 con sus datos y resultados**: se convierten en pruebas automáticas de la app.

## 3. Errores de tipeo (3 min)

1. En Caudal escribí `280.000` (con punto). Debajo del campo tiene que decir "Interpretado: 280": la app entiende el punto como coma decimal. ¿Se entiende el aviso?
2. En Longitud escribí `1.000,5`. Tiene que aparecer un mensaje en rojo que explique qué hacer.
3. Poné una temperatura de 70 °C. ¿El mensaje es claro?

## 4. Uso en clase (4 min)

1. Abrí "Ver el cálculo paso a paso". ¿Sirve para explicar el método en clase? ¿Falta o sobra algún paso?
2. Entrá a **Tablas**. ¿Son las del curso? ¿Falta alguna?
3. Si podés, proyectala: ¿se lee bien desde el fondo del aula?

## 5. Preguntas

1. ¿Algún texto está mal escrito, es confuso o no usa los términos del curso?
2. ¿Le falta algo que usen seguido en los prácticos?
3. ¿Hay algo del Excel que extrañes?
4. Del 1 al 5, ¿qué tan fácil te resultó usarla?
5. ¿La usarías en clase así como está? Si no, ¿qué tendría que cambiar primero?

## Cómo mandar los comentarios

Por mail o WhatsApp a Takeshi, con capturas de pantalla si algo se ve mal. Si te resulta cómodo, también podés abrir un *issue* en https://github.com/hidrocalc/perdidas/issues.

Para cada problema, anotá: qué datos cargaste, qué esperabas ver y qué viste.
