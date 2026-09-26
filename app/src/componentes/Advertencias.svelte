<script lang="ts">
  import type { Advertencia } from "@dw/core";
  import { TEXTO_ADVERTENCIA } from "../lib/mensajes";

  interface Props {
    advertencias: readonly Advertencia[];
  }

  let { advertencias }: Props = $props();
</script>

{#if advertencias.length > 0}
  <section class="advertencias" aria-labelledby="titulo-advertencias">
    <h3 id="titulo-advertencias">
      {advertencias.length === 1 ? "1 advertencia" : `${advertencias.length} advertencias`}
    </h3>
    <ul>
      {#each advertencias as codigo (codigo)}
        <li data-codigo={codigo}>{TEXTO_ADVERTENCIA[codigo]}</li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .advertencias {
    border-left: 6px solid var(--aviso);
    background: var(--aviso-fondo);
    border-radius: 4px;
    padding: 0.5rem 1rem;
  }

  h3 {
    margin: 0 0 0.25rem;
    font-size: 1rem;
    color: var(--aviso-texto);
  }

  ul {
    margin: 0;
    padding-left: 1.25rem;
  }

  li {
    color: var(--texto);
  }
</style>
