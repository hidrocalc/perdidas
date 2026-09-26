import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

// Genera los íconos PWA desde public/icono.svg: `pnpm --filter @dw/app iconos`.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: "#0b4f8a" } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: "#0b4f8a" } },
  },
  images: ["public/icono.svg"],
});
