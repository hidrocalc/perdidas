<script lang="ts">
  import type { Entrada, FilaIteracion, Intermedios, Resultados } from "@dw/core";
  import { TABLAS } from "@dw/data";
  import { formatearSignificativas } from "../lib/formato";
  import { filasIteracion, pasos } from "../lib/pasoapaso";
  import Desplazable from "./Desplazable.svelte";

  interface Props {
    entrada: Entrada;
    intermedios: Intermedios;
    resultados: Resultados;
    iteraciones: readonly FilaIteracion[];
  }

  let { entrada, intermedios, resultados, iteraciones }: Props = $props();

  const lista = $derived(pasos(entrada, intermedios, resultados));
  const filas = $derived(filasIteracion(iteraciones));
  const tolerancia = formatearSignificativas(TABLAS.constantes.tolerancia, 1);
</script>

<details class="paso-a-paso">
  <summary>Ver el cálculo paso a paso</summary>

  <ol class="pasos">
    {#each lista as paso (paso.numero)}
      <li>
        <h3>{paso.numero}. {paso.titulo}</h3>
        <dl>
          {#each paso.lineas as linea (linea.formula)}
            <div class="linea">
              <dt>{linea.formula}</dt>
              <dd>{linea.valor}</dd>
            </div>
          {/each}
        </dl>

        {#if paso.numero === 7 && filas.length > 0}
          <Desplazable etiquetadaPor="titulo-iteraciones">
            <table>
              <caption id="titulo-iteraciones">
                Iteraciones de Colebrook (se detiene cuando |Δf| &lt; {tolerancia})
              </caption>
              <thead>
                <tr>
                  <th scope="col">i</th>
                  <th scope="col">fᵢ</th>
                  <th scope="col">fᵢ₊₁</th>
                  <th scope="col">|Δf|</th>
                </tr>
              </thead>
              <tbody>
                {#each filas as fila (fila.i)}
                  <tr>
                    <th scope="row">{fila.i}</th>
                    <td>{fila.f_in}</td>
                    <td>{fila.f_out}</td>
                    <td>{fila.delta}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </Desplazable>
        {/if}
      </li>
    {/each}
  </ol>
</details>

<style>
  .paso-a-paso {
    margin: 1rem 0;
    border: 1px solid var(--borde);
    border-radius: 8px;
    padding: 0 1rem;
  }

  summary {
    cursor: pointer;
    font-weight: 700;
    padding: 0.75rem 0;
    min-height: 44px;
  }

  .pasos {
    list-style: none;
    padding: 0;
    margin: 0 0 1rem;
  }

  h3 {
    font-size: 1rem;
    margin: 1rem 0 0.25rem;
  }

  dl {
    margin: 0;
  }

  .linea {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.25rem 1rem;
    padding: 0.3rem 0;
    border-bottom: 1px dashed var(--borde);
  }

  dt {
    color: var(--texto-suave);
  }

  dd {
    margin: 0 0 0 auto;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }
</style>
