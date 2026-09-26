<script lang="ts">
  import { kTablaMm } from "@dw/core";
  import { TABLAS } from "@dw/data";
  import { factoresCaudal, tablaDiametros, viscosidadEnMicro } from "../lib/consulta";
  import { formatearInterpretado, formatearNumero } from "../lib/formato";
  import Desplazable from "./Desplazable.svelte";

  const num = formatearInterpretado;
  const DIAMETROS = [
    { id: "PVC", tabla: tablaDiametros(TABLAS.diametros.PVC) },
    { id: "PE", tabla: tablaDiametros(TABLAS.diametros.PE) },
  ] as const;
</script>

<p class="nota">
  Son las mismas tablas que usa el cálculo, tomadas del Excel de la cátedra (versión {TABLAS.version_tablas}).
</p>

<section>
  <h3 id="tabla-rugosidad">Rugosidad absoluta K y C de Hazen-Williams</h3>
  <p class="nota">Si no cargás K manual, se usa el máximo del rango (K adoptado).</p>
  <Desplazable etiquetadaPor="tabla-rugosidad">
    <table aria-labelledby="tabla-rugosidad">
      <thead>
        <tr>
          <th scope="col" class="texto">Material</th>
          <th scope="col">K mín (mm)</th>
          <th scope="col">K adoptado (mm)</th>
          <th scope="col">C</th>
        </tr>
      </thead>
      <tbody>
        {#each TABLAS.materiales as m (m.material)}
          <tr>
            <th scope="row" class="texto">{m.material}</th>
            <td>{num(m.k_min_mm)}</td>
            <td>{num(kTablaMm(m))}</td>
            <td>{num(m.c_hw)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </Desplazable>
</section>

<section>
  <h3 id="tabla-singularidades">Singularidades</h3>
  <p class="nota">Pérdida localizada = K·V²/2g por cada una.</p>
  <Desplazable etiquetadaPor="tabla-singularidades">
    <table aria-labelledby="tabla-singularidades">
      <thead>
        <tr>
          <th scope="col" class="texto">Singularidad</th>
          <th scope="col">K</th>
          <th scope="col" class="texto">Nota</th>
        </tr>
      </thead>
      <tbody>
        {#each TABLAS.singularidades as s (s.singularidad)}
          <tr>
            <th scope="row" class="texto">{s.singularidad}</th>
            <td>{num(s.k)}</td>
            <td class="texto">{s.nota}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </Desplazable>
</section>

<section>
  <h3 id="tabla-viscosidad">Viscosidad cinemática del agua</h3>
  <p class="nota">Entre dos temperaturas de la tabla se interpola en forma lineal.</p>
  <Desplazable etiquetadaPor="tabla-viscosidad">
    <table aria-labelledby="tabla-viscosidad">
      <thead>
        <tr>
          <th scope="col">T (°C)</th>
          <th scope="col">ν (10⁻⁶ m²/s)</th>
        </tr>
      </thead>
      <tbody>
        {#each TABLAS.viscosidad as v (v.t_c)}
          <tr>
            <th scope="row">{num(v.t_c)}</th>
            <td>{formatearNumero(viscosidadEnMicro(v.nu_m2s), 3)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </Desplazable>
</section>

{#each DIAMETROS as d (d.id)}
  <section>
    <h3 id={`tabla-diametros-${d.id}`}>Diámetros interiores {d.id} (mm)</h3>
    <p class="nota">DN en filas y PN (kg/cm²) en columnas. "—": esa combinación no existe.</p>
    <Desplazable etiquetadaPor={`tabla-diametros-${d.id}`}>
      <table aria-labelledby={`tabla-diametros-${d.id}`}>
        <thead>
          <tr>
            <th scope="col">DN</th>
            {#each d.tabla.pns as pn (pn)}
              <th scope="col">PN {num(pn)}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each d.tabla.filas as fila (fila.dn)}
            <tr>
              <th scope="row">{num(fila.dn)}</th>
              {#each fila.di as di, j (j)}
                <td>{di === null ? "—" : num(di)}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </Desplazable>
  </section>
{/each}

<section>
  <h3 id="tabla-caudal">Unidades de caudal</h3>
  <p class="nota">Factores exactos de conversión a m³/s.</p>
  <Desplazable etiquetadaPor="tabla-caudal">
    <table aria-labelledby="tabla-caudal">
      <thead>
        <tr>
          <th scope="col" class="texto">Unidad</th>
          <th scope="col">Factor a m³/s</th>
        </tr>
      </thead>
      <tbody>
        {#each factoresCaudal() as f (f.unidad)}
          <tr>
            <th scope="row" class="texto">{f.unidad}</th>
            <td>{f.factor}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </Desplazable>
</section>

<style>
  section {
    margin: 1.5rem 0;
  }

  h3 {
    font-size: 1.1rem;
    margin: 0 0 0.25rem;
  }

  .nota {
    color: var(--texto-suave);
    font-size: 0.9rem;
    margin: 0;
  }
</style>
