<script lang="ts">
  import { TABLAS } from "@dw/data";
  import AvisoPWA from "./componentes/AvisoPWA.svelte";
  import Formulario from "./componentes/Formulario.svelte";
  import ResumenErrores from "./componentes/ResumenErrores.svelte";
  import { evaluar, textosPorDefecto } from "./lib/entrada";
  import { formatearNumero } from "./lib/formato";

  let textos = $state(textosPorDefecto());
  // Se recalcula en cada cambio: el motor tarda menos de 1 ms.
  const evaluacion = $derived(evaluar(textos));
</script>

<header>
  <h1>Pérdidas de carga en tuberías</h1>
  <AvisoPWA />
</header>

<main>
  <section class="datos" aria-labelledby="titulo-datos">
    <h2 id="titulo-datos">Datos</h2>
    <Formulario bind:textos errores={evaluacion.errores} interpretados={evaluacion.lectura.interpretados} />
  </section>

  <section class="resultados" aria-labelledby="titulo-resultados">
    <h2 id="titulo-resultados">Resultados</h2>
    {#if evaluacion.errores.size > 0}
      <ResumenErrores errores={evaluacion.errores} />
    {:else if evaluacion.calculo?.ok}
      <p class="total">
        Pérdida total (DW): <strong>{formatearNumero(evaluacion.calculo.resultados.h_total, 3)} m</strong>
      </p>
    {/if}
  </section>
</main>

<footer>
  <p>Tablas {TABLAS.version_tablas}</p>
</footer>

<style>
  header,
  main,
  footer {
    max-width: 80rem;
    margin: 0 auto;
    padding: 0 1rem;
  }

  h1 {
    font-size: clamp(1.4rem, 4vw, 2rem);
    margin: 1rem 0 0.25rem;
  }

  h2 {
    font-size: 1.25rem;
    margin: 1rem 0 0.75rem;
  }

  main {
    display: grid;
    gap: 0 2rem;
    grid-template-columns: minmax(0, 1fr);
  }

  /* Pantalla ancha: resultados al costado y siempre a la vista. */
  @media (min-width: 1100px) {
    main {
      grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
      align-items: start;
    }

    .resultados {
      position: sticky;
      top: 0;
    }
  }

  .total {
    font-size: 1.25rem;
  }

  footer {
    color: var(--texto-suave);
    font-size: 0.875rem;
    padding-top: 2rem;
    padding-bottom: 1rem;
  }
</style>
