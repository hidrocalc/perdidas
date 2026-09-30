<script lang="ts">
  import { estadoApp, medirCalculo, type Medicion } from "../lib/diagnostico";
  import { formatearNumero } from "../lib/formato";
  import { VERSION_APP, VERSION_TABLAS } from "../lib/version";

  const LIMITE_MS = 100;
  const estado = estadoApp({ navigator, matchMedia: (consulta) => window.matchMedia(consulta) });
  let medicion = $state<Medicion | null>(null);
  let copiado = $state(false);

  const ms = (x: number): string => `${formatearNumero(x, x < 1 ? 3 : 1)} ms`;
  const siNo = (x: boolean): string => (x ? "Sí" : "No");

  const resumen = $derived(
    [
      `App ${VERSION_APP} · Tablas ${VERSION_TABLAS}`,
      `Instalada: ${siNo(estado.instalada)}`,
      `Lista sin conexión: ${siNo(estado.sinConexion)}`,
      medicion === null ? "Cálculo: sin medir" : `Cálculo: ${ms(medicion.promedioMs)} promedio, ${ms(medicion.maximoMs)} máximo`,
      `Navegador: ${estado.navegador}`,
    ].join("\n"),
  );

  function medir(): void {
    medicion = medirCalculo();
    copiado = false;
  }

  async function copiar(): Promise<void> {
    try {
      await navigator.clipboard.writeText(resumen);
      copiado = true;
    } catch {
      copiado = false;
    }
  }
</script>

<p>Sirve para las pruebas en distintos equipos: medí y copiá el resumen para mandarlo junto con tus comentarios.</p>

<dl class="diagnostico">
  <div><dt>Instalada como app</dt><dd>{siNo(estado.instalada)}</dd></div>
  <div><dt>Lista para usar sin conexión</dt><dd>{siNo(estado.sinConexion)}</dd></div>
  <div>
    <dt>Tiempo de cálculo</dt>
    <dd id="tiempo-calculo" aria-live="polite">
      {#if medicion === null}
        Sin medir
      {:else}
        {ms(medicion.promedioMs)} promedio · {ms(medicion.maximoMs)} máximo
        ({medicion.maximoMs < LIMITE_MS ? "bien" : "lento"}: el objetivo es menos de {LIMITE_MS} ms)
      {/if}
    </dd>
  </div>
</dl>

<div class="botones">
  <button type="button" onclick={medir}>Medir el tiempo de cálculo</button>
  <button type="button" class="secundario" onclick={() => { void copiar(); }}>Copiar resumen</button>
</div>
<p class="estado-copia" aria-live="polite">{copiado ? "Resumen copiado." : ""}</p>

<style>
  .diagnostico {
    margin: 0 0 0.75rem;
  }

  .diagnostico div {
    display: flex;
    flex-wrap: wrap;
    gap: 0 0.5rem;
  }

  dt {
    color: var(--texto-suave);
  }

  dt::after {
    content: ":";
  }

  dd {
    margin: 0;
    font-weight: 600;
  }

  .botones {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .estado-copia {
    min-height: 1.5em;
    color: var(--exito);
  }
</style>
