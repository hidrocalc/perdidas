<script lang="ts">
  import type { Advertencia, Intermedios, Resultados } from "@dw/core";
  import { filasResultados, textoCaudales } from "../lib/presentacion";
  import Advertencias from "./Advertencias.svelte";

  interface Props {
    resultados: Resultados;
    intermedios: Intermedios;
    advertencias: readonly Advertencia[];
  }

  let { resultados, intermedios, advertencias }: Props = $props();

  const filas = $derived(filasResultados(resultados, advertencias));
  const total = $derived(filas.find((f) => f.destacada === true));
</script>

{#if total !== undefined}
  <p class="total" id="resultado-total">
    <span class="etiqueta">{total.etiqueta}</span>
    <strong class="valor">{total.valor}</strong>
  </p>
{/if}

<Advertencias {advertencias} />

<dl class="lista">
  {#each filas as fila (fila.id)}
    <div class="fila" class:destacada={fila.destacada === true}>
      <dt>{fila.etiqueta}</dt>
      <dd>{fila.valor}</dd>
    </div>
  {/each}
</dl>

<p class="caudales">
  Caudal equivalente: {textoCaudales(intermedios).join(" · ")}
</p>

<style>
  .total {
    display: flex;
    flex-direction: column;
    margin: 0 0 1rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    background: var(--primario);
    color: var(--sobre-primario);
  }

  .total .valor {
    font-size: 2rem;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
  }

  .lista {
    margin: 1rem 0;
  }

  .fila {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.4rem 0;
    border-bottom: 1px solid var(--borde);
  }

  dt {
    color: var(--texto-suave);
  }

  dd {
    margin: 0;
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }

  .destacada dt,
  .destacada dd {
    color: var(--texto);
    font-weight: 800;
  }

  .caudales {
    color: var(--texto-suave);
    font-size: 0.875rem;
  }
</style>
