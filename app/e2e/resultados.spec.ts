import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const NB = " ";
const FINO = " ";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
});

test("los 14 resultados con los datos por defecto (ejemplo de la especificación)", async ({ page }) => {
  const lista = page.locator(".resultados dl.lista");
  const esperado: [string, string][] = [
    ["Velocidad V", `3,451${NB}m/s`],
    ["Control de velocidad", `ALTA (> 2,5${NB}m/s)`],
    ["Reynolds Re", `582${FINO}262`],
    ["Régimen", "Turbulento"],
    ["Factor de fricción f", "0,01438"],
    ["Iteraciones", "4"],
    ["f de Swamee-Jain (control)", `0,01444 (+0,40${NB}%)`],
    ["hf por fricción (DW)", `2,577${NB}m`],
    ["hf de Hazen-Williams", `2,503${NB}m`],
    ["Diferencia HW vs DW", `−2,9${NB}%`],
    ["Pérdidas localizadas", `1,080${NB}m`],
    ["Pérdida total (DW)", `3,657${NB}m`],
    ["Pendiente J", `0,0515${NB}m/m`],
    ["Pérdida cada 100 m", `5,154${NB}m/100${NB}m`],
  ];
  await expect(lista.locator("dt")).toHaveText(esperado.map(([e]) => e));
  await expect(lista.locator("dd")).toHaveText(esperado.map(([, v]) => v));
  await expect(page.locator("#resultado-total .valor")).toHaveText(`3,657${NB}m`);
});

test("advertencia de velocidad alta con el texto exacto", async ({ page }) => {
  const avisos = page.locator(".advertencias li");
  await expect(avisos).toHaveText(["Velocidad alta (> 2,5 m/s): riesgo de golpe de ariete y desgaste."]);
});

test("caudal chico: régimen laminar y velocidad baja", async ({ page }) => {
  await page.getByLabel("Caudal Q").fill("100");
  await expect(page.locator(".advertencias li")).toHaveText([
    "Régimen laminar: se usa f = 64/Re.",
    "Velocidad baja (< 0,6 m/s): riesgo de sedimentación.",
  ]);
  await expect(page.locator(".resultados dl dd").nth(3)).toHaveText("Laminar");
  await expect(page.locator(".resultados dl dd").nth(5)).toHaveText("0");
});

test("con un error no queda ningún resultado viejo a la vista", async ({ page }) => {
  await page.getByLabel("Longitud L").fill("");
  await expect(page.locator(".resultados dl")).toHaveCount(0);
  await expect(page.locator(".advertencias")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Corregí 1 dato para ver el resultado" })).toBeVisible();
});

test("barra con la pérdida total solo en pantallas angostas", async ({ page }) => {
  const barra = page.locator(".barra");
  const ancho = page.viewportSize()?.width ?? 0;
  if (ancho >= 1100) {
    await expect(barra).toBeHidden();
    return;
  }
  await expect(barra).toContainText(`Pérdida total: 3,657${NB}m`);
  await page.getByLabel("Longitud L").fill("x");
  await expect(barra).toContainText("1 dato para corregir");
  await barra.getByRole("button", { name: "Ver resultados" }).click();
  await expect(page.getByRole("heading", { name: "Resultados", level: 2 })).toBeFocused();
});

test("resultados sin problemas de accesibilidad (con advertencias)", async ({ page }) => {
  await page.getByLabel("Caudal Q").fill("100");
  const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(resultado.violations).toEqual([]);
});

test("paso a paso: se abre con el teclado y muestra la tabla de iteraciones", async ({ page }) => {
  const resumen = page.getByText("Ver el cálculo paso a paso");
  await resumen.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "7. Factor de fricción" })).toBeVisible();

  const tabla = page.getByRole("table", { name: /Iteraciones de Colebrook/ });
  await expect(tabla.locator("tbody tr")).toHaveCount(4);
  // Última iteración: f y |Δf| de referencia del oráculo en Python.
  await expect(tabla.locator("tbody tr").last().locator("td")).toHaveText([/^0,0143\d{4}$/, "0,01438396", "3,95E-7"]);

  const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(resultado.violations).toEqual([]);
});
