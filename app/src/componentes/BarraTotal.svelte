<script lang="ts">
  /**
   * En pantallas angostas los resultados quedan debajo de todo el formulario:
   * esta barra fija muestra la pérdida total (o cuántos datos faltan corregir)
   * mientras se editan los datos, y lleva a los resultados.
   */
  interface Props {
    /** Pérdida total ya formateada, o null si hay errores. */
    total: string | null;
    cantidadErrores: number;
  }

  let { total, cantidadErrores }: Props = $props();

  function irAResultados(): void {
    const titulo = document.getElementById("titulo-resultados");
    titulo?.scrollIntoView({ block: "start" });
    titulo?.focus();
  }
</script>

<div class="barra">
  <p>
    {#if total !== null}
      Pérdida total: <strong>{total}</strong>
    {:else}
      {cantidadErrores === 1 ? "1 dato para corregir" : `${cantidadErrores} datos para corregir`}
    {/if}
  </p>
  <button type="button" class="secundario" onclick={irAResultados}>Ver resultados</button>
</div>

<style>
  .barra {
    position: fixed;
    inset: auto 0 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.5rem 1rem;
    background: var(--superficie);
    border-top: 2px solid var(--primario);
    z-index: 10;
  }

  p {
    margin: 0;
  }

  button {
    flex: 0 0 auto;
    background: var(--fondo);
  }

  @media (min-width: 1100px) {
    .barra {
      display: none;
    }
  }
</style>
