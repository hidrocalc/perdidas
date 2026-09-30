import { expect, test } from "@playwright/test";

test("diagnóstico: muestra el estado y mide el tiempo de cálculo", async ({ page }) => {
  await page.goto("./#acerca");
  await expect(page.getByText("Instalada como app")).toBeVisible();
  await page.getByRole("button", { name: "Medir el tiempo de cálculo" }).click();
  await expect(page.locator("#tiempo-calculo")).toContainText("promedio");
});

test("en un equipo lento (CPU 6 veces más lenta) cada cálculo tarda menos de 100 ms", async ({ page, browserName }) => {
  // La limitación de CPU solo existe en Chromium (protocolo de DevTools).
  test.skip(browserName !== "chromium", "La emulación de CPU lenta solo está en Chromium");
  await page.goto("./#acerca");
  const cdp = await page.context().newCDPSession(page);
  // 6×: aproximación de un Android de gama baja frente a una compu de escritorio.
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });

  await page.getByRole("button", { name: "Medir el tiempo de cálculo" }).click();
  const texto = (await page.locator("#tiempo-calculo").textContent()) ?? "";
  const maximo = Number(/·\s*([\d,]+)\s*ms máximo/.exec(texto)?.[1]?.replace(",", ".") ?? "NaN");
  expect(maximo).toBeLessThan(100);
});
