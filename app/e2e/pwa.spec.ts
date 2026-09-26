import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("carga la app", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { level: 1, name: "Pérdidas de carga en tuberías" })).toBeVisible();
});

test("el service worker precachea la app completa", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByText("Lista para usar sin conexión")).toBeVisible();

  const urls = await page.evaluate(async () => {
    const todas: string[] = [];
    for (const nombre of await caches.keys()) {
      const cache = await caches.open(nombre);
      for (const pedido of await cache.keys()) todas.push(new URL(pedido.url).pathname);
    }
    return todas;
  });
  expect(urls).toContain("/perdidas/index.html");
  expect(urls).toContain("/perdidas/manifest.webmanifest");
  expect(urls.some((u) => u.endsWith(".js"))).toBe(true);
  expect(urls.some((u) => u.endsWith(".css"))).toBe(true);
});

test("funciona sin conexión después de la primera carga", async ({ page, context, browserName }) => {
  // El WebKit de Playwright para Windows (WinCairo, no Safari) falla al recargar con la
  // red emulada como cortada. En la CI (Linux) sí corre; Safari real se prueba en la etapa 5.
  test.skip(browserName === "webkit" && process.platform === "win32", "Emulación offline no soportada en WebKit/Windows");

  await page.goto("./");
  await expect(page.getByText("Lista para usar sin conexión")).toBeVisible();

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Lista para usar sin conexión")).toBeVisible();
});

test("sin problemas de accesibilidad (axe, WCAG 2.1 AA)", async ({ page }) => {
  await page.goto("./");
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(resultado.violations).toEqual([]);
});
