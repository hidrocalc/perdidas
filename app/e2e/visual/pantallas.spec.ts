import { expect, test, type Page } from "@playwright/test";

/** El pie tiene la versión de la app: cambia en cada release y no es un cambio de diseño. */
const opciones = (page: Page) => ({ fullPage: true, mask: [page.locator("footer")], maskColor: "#808080" });

test("calculadora con los datos por defecto", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("#resultado-total")).toBeVisible();
  await expect(page).toHaveScreenshot("calcular.png", opciones(page));
});

test("calculadora con errores", async ({ page }) => {
  await page.goto("./");
  await page.getByLabel("Longitud L").fill("1.000,5");
  await page.getByLabel("Temperatura del agua T").fill("");
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  await expect(page.getByRole("heading", { name: "Corregí 2 datos para ver el resultado" })).toBeVisible();
  await expect(page).toHaveScreenshot("calcular-errores.png", opciones(page));
});

test("paso a paso abierto", async ({ page }) => {
  await page.goto("./");
  await page.getByText("Ver el cálculo paso a paso").click();
  const detalle = page.locator(".paso-a-paso");
  await expect(detalle.getByRole("table")).toBeVisible();
  await expect(detalle).toHaveScreenshot("paso-a-paso.png");
});

test("tablas de consulta", async ({ page }) => {
  await page.goto("./#tablas");
  await expect(page.getByRole("heading", { name: "Tablas de consulta" })).toBeVisible();
  await expect(page).toHaveScreenshot("tablas.png", opciones(page));
});

test("acerca de", async ({ page }) => {
  await page.goto("./#acerca");
  await expect(page.getByRole("heading", { name: "Acerca de", level: 2 })).toBeVisible();
  await expect(page).toHaveScreenshot("acerca.png", { ...opciones(page), mask: [page.locator("footer"), page.locator(".versiones")] });
});
