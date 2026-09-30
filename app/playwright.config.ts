import { defineConfig, devices, type Project } from "@playwright/test";

const PUERTO = 4173;
// En algunos Windows el Firefox de Playwright no arranca ("no se encontró el ensamblado
// dependiente mozglue"). Ahí se omite, salvo con E2E_FIREFOX=1; la CI (Linux) corre los tres.
const conFirefox = process.platform !== "win32" || process.env["E2E_FIREFOX"] === "1";
const MOTORES = conFirefox ? (["chromium", "firefox", "webkit"] as const) : (["chromium", "webkit"] as const);
// 360 px: celular chico · 768 px: tablet · 1920 px: proyector
const VIEWPORTS = [
  { ancho: 360, alto: 780 },
  { ancho: 768, alto: 1024 },
  { ancho: 1920, alto: 1080 },
] as const;

const projects: Project[] = [
  ...MOTORES.flatMap((browserName) =>
    VIEWPORTS.map(({ ancho, alto }) => ({
      name: `${browserName}-${ancho}`,
      use: { browserName, viewport: { width: ancho, height: alto } },
    })),
  ),
  // Celulares emulados (pantalla táctil, navegador y densidad de cada equipo): reemplazan las
  // pruebas en equipos físicos, que no se hacen (D-26).
  { name: "iphone", use: { ...devices["iPhone 13"] } },
  { name: "android", use: { ...devices["Pixel 7"] } },
];

const enCI = process.env["CI"] !== undefined;

export default defineConfig({
  testDir: "e2e",
  // La regresión visual corre aparte: playwright.visual.config.ts (D-20).
  testIgnore: "visual/**",
  fullyParallel: true,
  forbidOnly: enCI,
  retries: enCI ? 1 : 0,
  reporter: enCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    // Se prueba el build de producción (con service worker), no el servidor de desarrollo.
    baseURL: `http://localhost:${PUERTO}/perdidas/`,
    locale: "es-AR",
    trace: "on-first-retry",
  },
  projects,
  webServer: {
    command: `pnpm build && pnpm preview --port ${PUERTO} --strictPort`,
    url: `http://localhost:${PUERTO}/perdidas/`,
    reuseExistingServer: !enCI,
    timeout: 120_000,
  },
});
