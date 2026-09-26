import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { preview } from "vite";

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

test("funciona sin conexión: con el servidor apagado, la app recarga desde la caché", async ({ page }) => {
  // Servidor propio (puerto libre) sobre el build ya generado: se apaga de verdad a mitad del test.
  // No se usa context.setOffline porque el WebKit de Playwright falla al recargar con la red
  // emulada como cortada, aunque haya service worker (probado en Windows y en Linux).
  const servidor = await preview({
    root: fileURLToPath(new URL("..", import.meta.url)),
    preview: { port: 0, strictPort: false },
    logLevel: "silent",
  });
  const url = servidor.resolvedUrls?.local[0];
  if (url === undefined) throw new Error("vite preview no informó la URL");

  try {
    await page.goto(url);
    await expect(page.getByText("Lista para usar sin conexión")).toBeVisible();
  } finally {
    await servidor.close();
  }

  // Sin servidor: sin el service worker esto sería "no se puede conectar".
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Pérdidas de carga en tuberías" })).toBeVisible();
  await expect(page.getByText("Lista para usar sin conexión")).toBeVisible();
});

test("sin problemas de accesibilidad (axe, WCAG 2.1 AA)", async ({ page }) => {
  await page.goto("./");
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(resultado.violations).toEqual([]);
});
