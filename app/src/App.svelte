<script lang="ts">
  import { TABLAS } from "@dw/data";
  import AvisoPWA from "./componentes/AvisoPWA.svelte";
  import Formulario from "./componentes/Formulario.svelte";
  import PasoAPaso from "./componentes/PasoAPaso.svelte";
  import BarraTotal from "./componentes/BarraTotal.svelte";
  import Resultados from "./componentes/Resultados.svelte";
  import ResumenErrores from "./componentes/ResumenErrores.svelte";
  import { evaluar, textosPorDefecto } from "./lib/entrada";
  import { formatearNumero } from "./lib/formato";

  let textos = $state(textosPorDefecto());
  // Se recalcula en cada cambio: el motor tarda menos de 1 ms.
  const evaluacion = $derived(evaluar(textos));
  const calculoOk = $derived(evaluacion.errores.size === 0 && evaluacion.calculo?.ok === true ? evaluacion.calculo : null);
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
    <h2 id="titulo-resultados" tabindex="-1">Resultados</h2>
    {#if calculoOk !== null}
      <Resultados
        resultados={calculoOk.resultados}
        intermedios={calculoOk.intermedios}
        advertencias={calculoOk.advertencias}
      />
      {#if evaluacion.lectura.entrada !== null}
        <PasoAPaso
          entrada={evaluacion.lectura.entrada}
          intermedios={calculoOk.intermedios}
          resultados={calculoOk.resultados}
          iteraciones={calculoOk.iteraciones_detalle}
        />
      {/if}
    {:else}
      <ResumenErrores errores={evaluacion.errores} />
    {/if}
  </section>
</main>

<BarraTotal
  total={calculoOk === null ? null : `${formatearNumero(calculoOk.resultados.h_total, 3)} m`}
  cantidadErrores={evaluacion.errores.size}
/>

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

  footer {
    color: var(--texto-suave);
    font-size: 0.875rem;
    padding-top: 2rem;
    /* Lugar para la barra fija con la pérdida total (pantallas angostas). */
    padding-bottom: 5rem;
  }

  @media (min-width: 1100px) {
    footer {
      padding-bottom: 1rem;
    }
  }
</style>
