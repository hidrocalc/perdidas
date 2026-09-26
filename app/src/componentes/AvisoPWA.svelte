<script lang="ts">
  import { useRegisterSW } from "virtual:pwa-register/svelte";

  const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW();

  // En visitas posteriores offlineReady no se vuelve a disparar: si ya hay un
  // service worker controlando la página, la app ya está en caché.
  const yaControlada = "serviceWorker" in navigator && navigator.serviceWorker.controller !== null;
  const listaSinConexion = $derived(yaControlada || $offlineReady);

  let postergada = $state(false);
</script>

<div class="avisos">
  <p class="indicador" role="status">
    {#if listaSinConexion}
      <span aria-hidden="true">✓</span> Lista para usar sin conexión
    {/if}
  </p>

  {#if $needRefresh && !postergada}
    <div class="actualizacion" role="alert">
      <p>Hay una versión nueva de la app. Actualizá cuando termines el cálculo en curso.</p>
      <div class="botones">
        <button type="button" onclick={() => updateServiceWorker(true)}>Actualizar ahora</button>
        <button type="button" class="secundario" onclick={() => (postergada = true)}>Más tarde</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .indicador {
    margin: 0;
    font-size: 0.9rem;
    color: var(--exito);
    min-height: 1.5em;
  }

  .actualizacion {
    margin-top: 0.5rem;
    padding: 0.75rem 1rem;
    border: 1px solid var(--primario);
    border-radius: 8px;
    background: var(--superficie);
  }

  .actualizacion p { margin: 0 0 0.5rem; }

  .botones {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
</style>
