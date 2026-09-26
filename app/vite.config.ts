import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
  // La app se publica en https://hidrocalc.github.io/perdidas/
  base: "/perdidas/",
  plugins: [svelte()],
});
