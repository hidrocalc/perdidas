<script lang="ts">
  import type { Snippet } from "svelte";
  import { formatearInterpretado } from "../lib/formato";

  interface Props {
    id: string;
    etiqueta: string;
    /** Unidad que se muestra en la etiqueta y junto al valor interpretado. */
    unidad?: string;
    valor: string;
    error?: string | undefined;
    /** Valor que la app entendió; se muestra con separador de miles. */
    interpretado?: number | undefined;
    ayuda?: string;
    /** Solo enteros (teclado numérico sin coma en el celular). */
    entero?: boolean;
    /** Controles que van a la derecha del campo (p. ej. la unidad del caudal). */
    despues?: Snippet;
  }

  let {
    id, etiqueta, unidad = "", valor = $bindable(), error, interpretado, ayuda, entero = false, despues,
  }: Props = $props();

  const idAyuda = $derived(`${id}-ayuda`);
  const idInterpretado = $derived(`${id}-interpretado`);
  const idError = $derived(`${id}-error`);
  const describe = $derived(
    [ayuda === undefined ? null : idAyuda, idInterpretado, error === undefined ? null : idError]
      .filter((x) => x !== null)
      .join(" "),
  );
</script>

<div class="campo" class:con-error={error !== undefined}>
  <label for={id}>
    {etiqueta}{#if unidad !== ""}&nbsp;<span class="unidad">({unidad})</span>{/if}
  </label>
  <div class="fila">
    <input
      {id}
      type="text"
      inputmode={entero ? "numeric" : "decimal"}
      autocomplete="off"
      spellcheck="false"
      bind:value={valor}
      aria-invalid={error === undefined ? undefined : "true"}
      aria-describedby={describe}
    />
    {@render despues?.()}
  </div>
  {#if ayuda !== undefined}
    <p id={idAyuda} class="ayuda">{ayuda}</p>
  {/if}
  <p id={idInterpretado} class="interpretado">
    {#if interpretado !== undefined}
      Interpretado: <strong>{formatearInterpretado(interpretado)}</strong>{unidad === "" ? "" : ` ${unidad}`}
    {/if}
  </p>
  {#if error !== undefined}
    <p id={idError} class="error"><span class="icono-error" aria-hidden="true">⚠</span>{error}</p>
  {/if}
</div>

<style>
  .campo {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .fila {
    display: flex;
    gap: 0.5rem;
  }

  .fila input {
    flex: 1 1 auto;
    min-width: 0;
  }

  .unidad,
  .ayuda,
  .interpretado {
    color: var(--texto-suave);
  }

  .ayuda,
  .interpretado,
  .error {
    margin: 0;
    font-size: 0.875rem;
  }

  .interpretado:empty {
    display: none;
  }

  .error {
    color: var(--error);
    font-weight: 600;
  }

  .con-error input {
    border-color: var(--error);
    border-width: 2px;
  }
</style>
