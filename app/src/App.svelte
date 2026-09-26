<script lang="ts">
  import { tick } from "svelte";
  import Acerca from "./componentes/Acerca.svelte";
  import AvisoPWA from "./componentes/AvisoPWA.svelte";
  import BarraTotal from "./componentes/BarraTotal.svelte";
  import Formulario from "./componentes/Formulario.svelte";
  import PasoAPaso from "./componentes/PasoAPaso.svelte";
  import Resultados from "./componentes/Resultados.svelte";
  import ResumenErrores from "./componentes/ResumenErrores.svelte";
  import TablasConsulta from "./componentes/TablasConsulta.svelte";
  import { evaluar, textosPorDefecto } from "./lib/entrada";
  import { formatearNumero } from "./lib/formato";
  import { SECCIONES, seccionDeHash, type Seccion } from "./lib/navegacion";
  import { VERSION_APP, VERSION_TABLAS } from "./lib/version";

  // El estado del formulario vive acá: al ir a "Tablas" y volver, los datos siguen.
  let textos = $state(textosPorDefecto());
  // Se recalcula en cada cambio: el motor tarda menos de 1 ms.
  const evaluacion = $derived(evaluar(textos));
  const calculoOk = $derived(evaluacion.errores.size === 0 && evaluacion.calculo?.ok === true ? evaluacion.calculo : null);

  let seccion: Seccion = $state(seccionDeHash(location.hash));

  $effect(() => {
    const alCambiar = (): void => {
      seccion = seccionDeHash(location.hash);
      // El foco va al título de la sección: el lector de pantalla anuncia dónde quedó.
      void tick().then(() => document.getElementById(`titulo-${seccion}`)?.focus());
    };
    window.addEventListener("hashchange", alCambiar);
    return () => {
      window.removeEventListener("hashchange", alCambiar);
    };
  });
</script>

<header>
  <h1>Pérdidas de carga en tuberías</h1>
  <nav aria-label="Secciones">
    <ul>
      {#each SECCIONES as s (s.id)}
        <li>
          <a href={`#${s.id}`} aria-current={seccion === s.id ? "page" : undefined}>{s.titulo}</a>
        </li>
      {/each}
    </ul>
  </nav>
  <AvisoPWA />
</header>

{#if seccion === "calcular"}
  <main class="calculadora">
    <h2 id="titulo-calcular" class="solo-lector" tabindex="-1">Calcular</h2>
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
{:else if seccion === "tablas"}
  <main class="pagina">
    <h2 id="titulo-tablas" tabindex="-1">Tablas de consulta</h2>
    <TablasConsulta />
  </main>
{:else}
  <main class="pagina">
    <h2 id="titulo-acerca" tabindex="-1">Acerca de</h2>
    <Acerca />
  </main>
{/if}

<footer class:con-barra={seccion === "calcular"}>
  <p>App {VERSION_APP} · Tablas {VERSION_TABLAS}</p>
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

  nav ul {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    list-style: none;
    margin: 0.5rem 0;
    padding: 0;
    border-bottom: 1px solid var(--borde);
  }

  nav a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 0 1rem;
    color: var(--texto);
    text-decoration: none;
    border-bottom: 3px solid transparent;
  }

  nav a:hover {
    text-decoration: underline;
  }

  nav a[aria-current="page"] {
    border-bottom-color: var(--primario);
    font-weight: 700;
  }

  main :global(h2) {
    font-size: 1.25rem;
    margin: 1rem 0 0.75rem;
  }

  .calculadora {
    display: grid;
    gap: 0 2rem;
    grid-template-columns: minmax(0, 1fr);
  }

  .pagina {
    max-width: 60rem;
  }

  /* Pantalla ancha: resultados al costado y siempre a la vista. */
  @media (min-width: 1100px) {
    .calculadora {
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
    padding-bottom: 1rem;
  }

  /* Lugar para la barra fija con la pérdida total (pantallas angostas). */
  @media (max-width: 1099px) {
    footer.con-barra {
      padding-bottom: 5rem;
    }
  }
</style>
