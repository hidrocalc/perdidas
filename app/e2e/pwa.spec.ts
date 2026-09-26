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

test("manifiesto instalable (criterios de Chrome, en lugar de la categoría PWA de Lighthouse)", async ({ page, request }) => {
  await page.goto("./");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).not.toBeNull();
  const respuesta = await request.get(new URL(href ?? "", page.url()).toString());
  expect(respuesta.ok()).toBe(true);

  const m = (await respuesta.json()) as {
    name: string; short_name: string; start_url: string; scope: string; display: string; lang: string;
    icons: { src: string; sizes: string; purpose?: string }[];
  };
  expect(m.name).toBe("Pérdidas de carga en tuberías");
  expect(m.short_name.length).toBeLessThanOrEqual(12);
  expect(m.start_url).toBe("/perdidas/");
  expect(m.scope).toBe("/perdidas/");
  expect(m.display).toBe("standalone");
  expect(m.lang).toBe("es");
  expect(m.icons.map((i) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  expect(m.icons.some((i) => i.purpose === "maskable")).toBe(true);

  // Cada ícono declarado existe.
  for (const icono of m.icons) {
    expect((await request.get(new URL(icono.src, page.url()).toString())).ok()).toBe(true);
  }
});
