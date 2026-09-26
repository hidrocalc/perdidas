import { defineConfig, type Project } from "@playwright/test";

/**
 * Regresión visual (D-20): capturas de pantalla comparadas contra referencias guardadas.
 * Solo Chromium: el objetivo es detectar cambios de diseño, no diferencias entre motores
 * (eso lo cubren los e2e). Las referencias dependen del sistema operativo (fuentes):
 * Playwright agrega "-win32" o "-linux" al nombre y se guardan las dos.
 */
const PUERTO = 4174;
const ANCHOS = [
  { ancho: 360, alto: 780 },
  { ancho: 1920, alto: 1080 },
] as const;
const TEMAS = ["light", "dark"] as const;

const projects: Project[] = ANCHOS.flatMap(({ ancho, alto }) =>
  TEMAS.map((tema) => ({
    name: `${tema === "light" ? "claro" : "oscuro"}-${ancho}`,
    use: { browserName: "chromium", viewport: { width: ancho, height: alto }, colorScheme: tema },
  })),
);

const enCI = process.env["CI"] !== undefined;

export default defineConfig({
  testDir: "e2e/visual",
  snapshotPathTemplate: "{testDir}/capturas/{arg}-{projectName}-{platform}{ext}",
  fullyParallel: true,
  forbidOnly: enCI,
  reporter: enCI ? [["github"], ["html", { open: "never", outputFolder: "playwright-report-visual" }]] : "list",
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
      caret: "hide",
      stylePath: "e2e/visual/estilo-capturas.css",
    },
  },
  use: {
    baseURL: `http://localhost:${PUERTO}/perdidas/`,
    locale: "es-AR",
    // Sin service worker: el indicador "Lista para usar sin conexión" aparece con una demora variable.
    serviceWorkers: "block",
  },
  projects,
  webServer: {
    command: `pnpm build && pnpm preview --port ${PUERTO} --strictPort`,
    url: `http://localhost:${PUERTO}/perdidas/`,
    reuseExistingServer: !enCI,
    timeout: 120_000,
  },
});
