import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const axe = async (page: import("@playwright/test").Page) =>
  (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations;

test("navega a Tablas y vuelve sin perder los datos cargados", async ({ page }) => {
  await page.goto("./");
  await page.getByLabel("Longitud L").fill("120");

  const nav = page.getByRole("navigation", { name: "Secciones" });
  await nav.getByRole("link", { name: "Tablas" }).click();
  await expect(page).toHaveURL(/#tablas$/);
  await expect(page.getByRole("heading", { name: "Tablas de consulta", level: 2 })).toBeFocused();
  await expect(nav.getByRole("link", { name: "Tablas" })).toHaveAttribute("aria-current", "page");

  await nav.getByRole("link", { name: "Calcular" }).click();
  await expect(page.getByLabel("Longitud L")).toHaveValue("120");
});

test("tablas de consulta: datos del Excel, DN/PN inexistentes con guion", async ({ page }) => {
  await page.goto("./#tablas");
  const rugosidad = page.getByRole("table", { name: "Rugosidad absoluta K y C de Hazen-Williams" });
  await expect(rugosidad.locator("tbody tr")).toHaveCount(19);
  await expect(rugosidad.getByRole("row", { name: /Fundición - nueva 0,25 1 130/ })).toBeVisible();

  const pvc = page.getByRole("table", { name: "Diámetros interiores PVC (mm)" });
  const fila180 = pvc.getByRole("row", { name: /^180 / });
  await expect(fila180).toContainText("169,4");
  await expect(page.getByRole("table", { name: "Diámetros interiores PE (mm)" })).toContainText("—");

  const viscosidad = page.getByRole("table", { name: "Viscosidad cinemática del agua" });
  await expect(viscosidad.getByRole("row", { name: "20 1,004" })).toBeVisible();

  expect(await axe(page)).toEqual([]);
});

test("Acerca de: versiones, fórmulas y privacidad", async ({ page }) => {
  await page.goto("./#acerca");
  await expect(page.getByRole("heading", { name: "Acerca de", level: 2 })).toBeVisible();
  await expect(page.getByText("Especificación técnica", { exact: true })).toBeVisible();
  await expect(page.locator(".versiones")).toContainText("1.1");
  await expect(page.getByText(/se detiene cuando \|Δf\| < 1E-6/)).toBeVisible();
  await expect(page.getByText("Sin cuentas, sin cookies y sin analítica.", { exact: false })).toBeVisible();
  expect(await axe(page)).toEqual([]);
});

test("un #hash desconocido muestra la calculadora", async ({ page }) => {
  await page.goto("./#cualquiercosa");
  await expect(page.getByRole("heading", { name: "Datos", level: 2 })).toBeVisible();
});
