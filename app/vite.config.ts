import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const COLOR_TEMA = "#0b4f8a";

export default defineConfig({
  // La app se publica en https://hidrocalc.github.io/perdidas/
  base: "/perdidas/",
  plugins: [
    svelte(),
    VitePWA({
      // "prompt": la versión nueva se aplica solo cuando el usuario toca "Actualizar",
      // así nunca cambia un resultado en medio de un cálculo.
      registerType: "prompt",
      includeAssets: ["favicon.ico", "icono.svg", "apple-touch-icon-180x180.png"],
      manifest: {
        name: "Pérdidas de carga en tuberías",
        short_name: "Pérdidas",
        description: "Darcy-Weisbach, Hazen-Williams y pérdidas localizadas. Funciona sin conexión.",
        lang: "es",
        start_url: "/perdidas/",
        scope: "/perdidas/",
        display: "standalone",
        theme_color: COLOR_TEMA,
        background_color: "#ffffff",
        categories: ["education", "utilities"],
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Precache de todo: después de la primera carga no hay llamadas de red.
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
