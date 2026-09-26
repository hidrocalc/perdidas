<script lang="ts">
  import { ID_GENERAL, type IdCampo } from "../lib/entrada";

  interface Props {
    errores: ReadonlyMap<IdCampo, string>;
  }

  let { errores }: Props = $props();

  /** Lleva el foco al campo con el error (sin tocar el #hash, que usa la navegación). */
  function irA(evento: MouseEvent, id: IdCampo): void {
    evento.preventDefault();
    const destino = document.getElementById(id);
    destino?.focus();
    destino?.scrollIntoView({ block: "center" });
  }
</script>

<section class="resumen" aria-labelledby="resumen-titulo">
  <h2 id="resumen-titulo">
    {errores.size === 1 ? "Corregí 1 dato para ver el resultado" : `Corregí ${errores.size} datos para ver el resultado`}
  </h2>
  <ul>
    {#each [...errores] as [id, mensaje] (id)}
      <li>
        {#if id === ID_GENERAL}
          {mensaje}
        {:else}
          <a href={`#${id}`} onclick={(e) => { irA(e, id); }}>{mensaje}</a>
        {/if}
      </li>
    {/each}
  </ul>
</section>

<style>
  .resumen {
    border: 2px solid var(--error);
    border-radius: 8px;
    padding: 0.75rem 1rem;
  }

  h2 {
    font-size: 1.1rem;
    margin: 0 0 0.5rem;
    color: var(--error);
  }

  ul {
    margin: 0;
    padding-left: 1.25rem;
  }

  a {
    color: var(--texto);
  }
</style>
