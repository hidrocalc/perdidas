<script lang="ts">
  import { TABLAS } from "@dw/data";
  import AvisoPWA from "./componentes/AvisoPWA.svelte";
</script>

<header>
  <h1>Pérdidas de carga en tuberías</h1>
  <AvisoPWA />
</header>

<main>
  <p>En construcción. Tablas {TABLAS.version_tablas}.</p>
</main>

<style>
  header, main {
    max-width: 72rem;
    margin: 0 auto;
    padding: 0 1rem;
  }

  h1 {
    font-size: clamp(1.4rem, 4vw, 2rem);
    margin: 1rem 0 0.25rem;
  }
</style>
