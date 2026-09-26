import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Espacio fino no separable: separador de miles de la app. */
const FINO = " ";

const total = (page: Page) => page.locator(".total");

test.beforeEach(async ({ page }) => {
  await page.goto("./");
});

test("los datos por defecto dan la pérdida total de la especificación (3,657 m)", async ({ page }) => {
  await expect(total(page)).toHaveText("Pérdida total (DW): 3,657 m");
  await expect(page.locator("#Q-interpretado")).toHaveText(`Interpretado: 280${FINO}000 l/h`);
  await expect(page.getByText("DI de tabla: 169,4 mm")).toBeVisible();
});

test('"280.000" muestra 280 interpretado: el error de tipeo se ve', async ({ page }) => {
  await page.getByLabel("Caudal Q").fill("280.000");
  await expect(page.locator("#Q-interpretado")).toHaveText("Interpretado: 280 l/h");
});

test("separador ambiguo: mensaje exacto en el campo y en el resumen, sin resultado", async ({ page }) => {
  const mensaje = "Longitud L: no es un número válido. Usá coma o punto decimal, sin separador de miles.";
  const campo = page.getByLabel("Longitud L");
  await campo.fill("1.000,5");

  await expect(campo).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#L-error")).toHaveText(`⚠${mensaje}`);
  await expect(page.getByRole("heading", { name: "Corregí 1 dato para ver el resultado" })).toBeVisible();
  await expect(total(page)).toHaveCount(0);

  // El enlace del resumen lleva el foco al campo.
  await page.getByRole("link", { name: mensaje }).click();
  await expect(campo).toBeFocused();

  await campo.fill("50");
  await expect(total(page)).toHaveText("Pérdida total (DW): 3,657 m");
});

test("error de rango del motor, con el texto de la especificación", async ({ page }) => {
  await page.getByLabel("Temperatura del agua T").fill("70");
  await expect(page.locator("#T-error")).toHaveText("⚠Temperatura del agua T debe estar entre 0 y 60 °C.");
});

test("tabla Manual: pide el DI y calcula con él", async ({ page }) => {
  await page.getByLabel("Manual (DI a mano)").check();
  await expect(page.locator("#di_manual-error")).toHaveText("⚠Ingresá un valor para DI manual.");
  await page.getByLabel("DI manual").fill("169,4");
  await expect(total(page)).toHaveText("Pérdida total (DW): 3,657 m");
});

test("tabla PE: solo ofrece DN y PN que existen", async ({ page }) => {
  await page.getByLabel("PE", { exact: true }).check();
  const dns = await page.locator("#dn option").allTextContents();
  expect(dns).toEqual(["10", "12", "16", "20", "25", "32", "40", "50", "63"]);
  await expect(page.locator("#dn")).toHaveValue("63");
  await expect(total(page)).toBeVisible();
});

test("singularidades propias: agregar, error por fila y quitar", async ({ page }) => {
  const agregar = page.getByRole("button", { name: "Agregar singularidad propia" });
  await agregar.click();
  await expect(page.locator("#propia-0-nombre")).toBeFocused();

  await agregar.click();
  await page.locator("#propia-1-k").fill("-1");
  await page.locator("#propia-0-k").fill("2");
  await expect(page.locator("#propia-1-k-error")).toHaveText("⚠K de la singularidad debe estar entre 0 y 100.");
  await expect(page.locator("#propia-0-k-error")).toHaveCount(0);

  await page.getByRole("button", { name: "Quitar singularidad propia 2" }).click();
  await expect(agregar).toBeFocused();
  await expect(total(page)).toBeVisible();
});

test("máximo 10 singularidades propias", async ({ page }) => {
  const agregar = page.getByRole("button", { name: "Agregar singularidad propia" });
  for (let i = 0; i < 10; i++) {
    await agregar.click();
    await page.locator(`#propia-${i}-k`).fill("1");
  }
  await expect(agregar).toBeDisabled();
});

test("sin problemas de accesibilidad con errores a la vista", async ({ page }) => {
  await page.getByLabel("Longitud L").fill("abc");
  await page.getByRole("button", { name: "Agregar singularidad propia" }).click();
  const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(resultado.violations).toEqual([]);
});
