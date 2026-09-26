<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    /** id del elemento que nombra la región (normalmente el <caption> de la tabla). */
    etiquetadaPor: string;
    children: Snippet;
  }

  let { etiquetadaPor, children }: Props = $props();
</script>

<!-- Una tabla ancha puede desbordar a 360 px: la región desplazable tiene que poder recibir el foco
     para moverla con el teclado (WCAG 2.1.1; regla "scrollable-region-focusable" de axe). Ver D-18. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="desplazable" role="region" aria-labelledby={etiquetadaPor} tabindex="0">
  {@render children()}
</div>

<style>
  .desplazable {
    overflow-x: auto;
    margin-top: 0.5rem;
  }

  .desplazable :global(table) {
    border-collapse: collapse;
    width: 100%;
    font-variant-numeric: tabular-nums;
  }

  .desplazable :global(caption) {
    text-align: left;
    color: var(--texto-suave);
    font-size: 0.875rem;
    padding-bottom: 0.25rem;
  }

  .desplazable :global(th),
  .desplazable :global(td) {
    padding: 0.3rem 0.5rem;
    text-align: right;
    border-bottom: 1px solid var(--borde);
    white-space: nowrap;
  }

  .desplazable :global(th.texto),
  .desplazable :global(td.texto) {
    text-align: left;
    white-space: normal;
  }
</style>
