<script lang="ts">
  import { buscarMaterial, diTablaMm, kTablaMm, unidadesCaudal } from "@dw/core";
  import { TABLAS } from "@dw/data";
  import { tick } from "svelte";
  import {
    ajustarDnPn, dnsDisponibles, idCantidad, idPropia, MAX_PROPIAS, pnsDisponibles,
    type IdCampo, type Tabla, type TextosEntrada,
  } from "../lib/entrada";
  import { formatearInterpretado } from "../lib/formato";
  import { NOMBRE_CAMPO } from "../lib/mensajes";
  import CampoNumero from "./CampoNumero.svelte";

  interface Props {
    textos: TextosEntrada;
    errores: ReadonlyMap<IdCampo, string>;
    interpretados: ReadonlyMap<IdCampo, number>;
  }

  let { textos = $bindable(), errores, interpretados }: Props = $props();

  const TABLAS_DIAMETRO: readonly { valor: Tabla; texto: string }[] = [
    { valor: "PVC", texto: "PVC" },
    { valor: "PE", texto: "PE" },
    { valor: "Manual", texto: "Manual (DI a mano)" },
  ];
  const UNIDADES = unidadesCaudal();

  const tablaDn = $derived(textos.tabla === "Manual" ? null : textos.tabla);
  const dns = $derived(tablaDn === null ? [] : dnsDisponibles(tablaDn));
  const pns = $derived(tablaDn === null ? [] : pnsDisponibles(tablaDn, textos.dn));
  const diTabla = $derived(tablaDn === null ? undefined : diTablaMm(tablaDn, textos.dn, textos.pn));
  const material = $derived(buscarMaterial(textos.material));

  /** Al cambiar la tabla o el DN, deja siempre una combinación DN/PN que exista. */
  function ajustar(): void {
    if (textos.tabla === "Manual") return;
    const { dn, pn } = ajustarDnPn(textos.tabla, textos.dn, textos.pn);
    textos.dn = dn;
    textos.pn = pn;
  }

  let botonAgregar: HTMLButtonElement | undefined = $state();

  async function agregarPropia(): Promise<void> {
    textos.propias.push({ nombre: "", k: "", cantidad: "1" });
    await tick();
    document.getElementById(idPropia(textos.propias.length - 1, "nombre"))?.focus();
  }

  function quitarPropia(fila: number): void {
    textos.propias.splice(fila, 1);
    botonAgregar?.focus();
  }

  const num = (x: number): string => formatearInterpretado(x);
</script>

<form class="formulario" novalidate onsubmit={(e) => { e.preventDefault(); }}>
  <fieldset>
    <legend>Tubería</legend>

    <fieldset class="opciones">
      <legend>{NOMBRE_CAMPO.tabla}</legend>
      {#each TABLAS_DIAMETRO as t (t.valor)}
        <label class="opcion">
          <input type="radio" name="tabla" value={t.valor} bind:group={textos.tabla} onchange={ajustar} />
          {t.texto}
        </label>
      {/each}
    </fieldset>

    {#if textos.tabla === "Manual"}
      <CampoNumero
        id="di_manual"
        etiqueta="DI manual"
        unidad="mm"
        bind:valor={textos.di_manual}
        error={errores.get("di_manual")}
        interpretado={interpretados.get("di_manual")}
        ayuda="Diámetro interior, entre 1 y 5000 mm."
      />
    {:else}
      <div class="dos-columnas">
        <div class="campo">
          <label for="dn">Diámetro nominal DN <span class="unidad">(mm)</span></label>
          <select
            id="dn"
            bind:value={textos.dn}
            onchange={ajustar}
            aria-invalid={errores.has("dn") ? "true" : undefined}
            aria-describedby={errores.has("dn") ? "dn-error" : undefined}
          >
            {#each dns as dn (dn)}
              <option value={dn}>{num(dn)}</option>
            {/each}
          </select>
        </div>
        <div class="campo">
          <label for="pn">Presión nominal PN <span class="unidad">(kg/cm²)</span></label>
          <select id="pn" bind:value={textos.pn} aria-describedby="pn-ayuda">
            {#each pns as pn (pn)}
              <option value={pn}>{num(pn)}</option>
            {/each}
          </select>
          <p id="pn-ayuda" class="ayuda">Solo las PN con DI definido para ese DN.</p>
        </div>
      </div>
      {#if errores.has("dn")}
        <p id="dn-error" class="error"><span class="icono-error" aria-hidden="true">⚠</span>{errores.get("dn")}</p>
      {/if}
      <p class="dato">DI de tabla: <strong>{diTabla === undefined ? "—" : `${num(diTabla)} mm`}</strong></p>
    {/if}
  </fieldset>

  <fieldset>
    <legend>Material</legend>
    <div class="campo">
      <label for="material">{NOMBRE_CAMPO.material}</label>
      <select id="material" bind:value={textos.material} aria-describedby="material-ayuda">
        {#each TABLAS.materiales as m (m.material)}
          <option value={m.material}>{m.material}</option>
        {/each}
      </select>
      <p id="material-ayuda" class="ayuda">
        {#if material !== undefined}
          K de tabla: {num(kTablaMm(material))} mm (máximo del rango) · C de Hazen-Williams: {num(material.c_hw)}
        {/if}
      </p>
    </div>
    <div class="dos-columnas">
      <CampoNumero
        id="k_manual"
        etiqueta="K manual (opcional)"
        unidad="mm"
        bind:valor={textos.k_manual}
        error={errores.get("k_manual")}
        interpretado={interpretados.get("k_manual")}
        ayuda="Vacío: se usa el K de tabla. Entre 0 y 50 mm."
      />
      <CampoNumero
        id="c_manual"
        etiqueta="C de Hazen-Williams manual (opcional)"
        bind:valor={textos.c_manual}
        error={errores.get("c_manual")}
        interpretado={interpretados.get("c_manual")}
        ayuda="Vacío: se usa el C de tabla. Entre 50 y 160."
      />
    </div>
  </fieldset>

  <fieldset>
    <legend>Tramo y agua</legend>
    <div class="dos-columnas">
      <CampoNumero
        id="L"
        etiqueta="Longitud L"
        unidad="m"
        bind:valor={textos.L}
        error={errores.get("L")}
        interpretado={interpretados.get("L")}
      />
      <CampoNumero
        id="T"
        etiqueta="Temperatura del agua T"
        unidad="°C"
        bind:valor={textos.T}
        error={errores.get("T")}
        interpretado={interpretados.get("T")}
      />
    </div>
    <CampoNumero
      id="Q"
      etiqueta="Caudal Q"
      unidad={textos.Q_unidad}
      bind:valor={textos.Q}
      error={errores.get("Q")}
      interpretado={interpretados.get("Q")}
    >
      {#snippet despues()}
        <label class="solo-lector" for="Q_unidad">{NOMBRE_CAMPO.Q_unidad}</label>
        <select id="Q_unidad" class="unidad-caudal" bind:value={textos.Q_unidad}>
          {#each UNIDADES as u (u)}
            <option value={u}>{u}</option>
          {/each}
        </select>
      {/snippet}
    </CampoNumero>
  </fieldset>

  <fieldset>
    <legend>Singularidades de tabla</legend>
    <p class="ayuda">Cantidad de cada una (entero de 0 a 999). Pérdida = K·V²/2g.</p>
    <div class="singularidades">
      {#each TABLAS.singularidades as s, fila (s.singularidad)}
        <CampoNumero
          id={idCantidad(fila)}
          etiqueta={s.singularidad}
          entero
          bind:valor={() => textos.cantidades[fila] ?? "", (v: string) => { textos.cantidades[fila] = v; }}
          error={errores.get(idCantidad(fila))}
          ayuda={`K = ${num(s.k)}`}
        />
      {/each}
    </div>
  </fieldset>

  <fieldset>
    <legend>Singularidades propias</legend>
    <p class="ayuda">Hasta {MAX_PROPIAS}. Nombre opcional (hasta 60 caracteres), K entre 0 y 100, cantidad entera de 0 a 999.</p>
    {#if errores.has("general")}
      <p class="error"><span class="icono-error" aria-hidden="true">⚠</span>{errores.get("general")}</p>
    {/if}
    {#each textos.propias as p, fila (p)}
      <fieldset class="propia">
        <legend>Singularidad propia {fila + 1}</legend>
        <div class="campo">
          <label for={idPropia(fila, "nombre")}>Nombre (opcional)</label>
          <input
            id={idPropia(fila, "nombre")}
            type="text"
            maxlength="60"
            autocomplete="off"
            bind:value={p.nombre}
            aria-invalid={errores.has(idPropia(fila, "nombre")) ? "true" : undefined}
            aria-describedby={errores.has(idPropia(fila, "nombre")) ? `${idPropia(fila, "nombre")}-error` : undefined}
          />
          {#if errores.has(idPropia(fila, "nombre"))}
            <p id={`${idPropia(fila, "nombre")}-error`} class="error">
              <span class="icono-error" aria-hidden="true">⚠</span>{errores.get(idPropia(fila, "nombre"))}
            </p>
          {/if}
        </div>
        <div class="dos-columnas">
          <CampoNumero
            id={idPropia(fila, "k")}
            etiqueta="K"
            bind:valor={p.k}
            error={errores.get(idPropia(fila, "k"))}
            interpretado={interpretados.get(idPropia(fila, "k"))}
          />
          <CampoNumero
            id={idPropia(fila, "cantidad")}
            etiqueta="Cantidad"
            entero
            bind:valor={p.cantidad}
            error={errores.get(idPropia(fila, "cantidad"))}
          />
        </div>
        <button type="button" class="secundario" onclick={() => { quitarPropia(fila); }}>
          Quitar singularidad propia {fila + 1}
        </button>
      </fieldset>
    {/each}
    <button
      type="button"
      bind:this={botonAgregar}
      onclick={agregarPropia}
      disabled={textos.propias.length >= MAX_PROPIAS}
    >
      Agregar singularidad propia
    </button>
  </fieldset>
</form>

<style>
  .formulario {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  fieldset {
    border: 1px solid var(--borde);
    border-radius: 8px;
    padding: 0.75rem 1rem 1rem;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 0;
  }

  legend {
    font-weight: 700;
    padding: 0 0.25rem;
  }

  fieldset.opciones {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.25rem 1.25rem;
  }

  fieldset.opciones legend {
    font-weight: 600;
  }

  .opcion {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-height: 44px;
  }

  .opcion input {
    width: 1.25rem;
    height: 1.25rem;
    margin: 0;
  }

  .campo {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .dos-columnas,
  .singularidades {
    display: grid;
    gap: 0.75rem 1rem;
    grid-template-columns: 1fr;
  }

  @media (min-width: 600px) {
    .dos-columnas,
    .singularidades {
      grid-template-columns: 1fr 1fr;
    }
  }

  .unidad,
  .ayuda,
  .dato {
    color: var(--texto-suave);
  }

  .ayuda,
  .dato,
  .error {
    margin: 0;
    font-size: 0.875rem;
  }

  .error {
    color: var(--error);
    font-weight: 600;
  }

  .unidad-caudal {
    flex: 0 0 auto;
    width: auto;
  }

  fieldset.propia {
    background: var(--superficie);
  }

  fieldset.propia > button {
    align-self: flex-start;
  }

  button[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
