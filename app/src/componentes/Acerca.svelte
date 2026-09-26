<script lang="ts">
  import { TABLAS } from "@dw/data";
  import { formatearInterpretado, formatearSignificativas } from "../lib/formato";
  import { REPOSITORIO, VERSION_APP, VERSION_ESPECIFICACION, VERSION_TABLAS } from "../lib/version";

  const ct = TABLAS.constantes;
  const n = formatearInterpretado;
</script>

<p>
  Calcula la pérdida de carga en un tramo de tubería a presión con agua: fricción por Darcy-Weisbach,
  Hazen-Williams como comparación y pérdidas localizadas. Está pensada para docentes y estudiantes de la
  Facultad de Agronomía y reemplaza la planilla de Excel del curso.
</p>

<h3>Versiones</h3>
<dl class="versiones">
  <div><dt>App</dt><dd>{VERSION_APP}</dd></div>
  <div><dt>Tablas</dt><dd>{VERSION_TABLAS}</dd></div>
  <div><dt>Especificación técnica</dt><dd>{VERSION_ESPECIFICACION}</dd></div>
</dl>

<h3>Fórmulas</h3>
<ul class="formulas">
  <li><strong>Darcy-Weisbach:</strong> hf = f·(L/D)·V²/(2g), con g = {n(ct.g)} m/s².</li>
  <li>
    <strong>Régimen:</strong> laminar si Re &lt; {n(ct.re_laminar)}; transición si {n(ct.re_laminar)} ≤ Re ≤
    {n(ct.re_turbulento)}; turbulento si Re &gt; {n(ct.re_turbulento)}. Re = V·D/ν.
  </li>
  <li><strong>Laminar:</strong> f = 64/Re.</li>
  <li>
    <strong>Colebrook-White</strong> (transición y turbulento), iterativo:
    f = [−2·log₁₀({n(ct.colebrook_a)}/(Re·√f) + K/({n(ct.colebrook_b)}·D))]⁻². Arranca con f₀ = [−2·log₁₀(K/({n(ct.colebrook_b)}·D))]⁻²
    (o {n(ct.f0_liso)} si K = 0) y se detiene cuando |Δf| &lt; {formatearSignificativas(ct.tolerancia, 1)}, con un máximo de {n(ct.max_iter)}
    iteraciones.
  </li>
  <li><strong>Swamee-Jain</strong> (solo control): f = 0,25/[log₁₀(K/(3,7·D) + 5,74/Re^0,9)]².</li>
  <li><strong>Pérdidas localizadas:</strong> h_loc = (Σ nⱼ·Kⱼ)·V²/(2g).</li>
  <li><strong>Hazen-Williams</strong> (SI): hf = 10,679·L·Q^1,852/(C^1,852·D^4,87).</li>
  <li>
    <strong>Velocidad recomendada:</strong> entre {n(ct.v_min)} y {n(ct.v_max)} m/s (fuera de ese rango solo se avisa).
  </li>
</ul>

<h3>Cómo se verificó</h3>
<p>
  El cálculo se implementó dos veces, en forma independiente (Python y TypeScript), y las dos se compararon con
  el Excel corregido en cientos de casos: coinciden con un error relativo menor que 10⁻⁹.
</p>

<h3>Privacidad</h3>
<p>
  Sin cuentas, sin cookies y sin analítica. Los datos que cargás no salen de tu dispositivo. Después de la
  primera carga, la app funciona sin conexión.
</p>

<h3>Licencia y código</h3>
<p>
  Software libre con licencia MIT. El código está en <a href={REPOSITORIO}>{REPOSITORIO.replace("https://", "")}</a>.
</p>

<style>
  h3 {
    font-size: 1.1rem;
    margin: 1.5rem 0 0.5rem;
  }

  .versiones {
    margin: 0;
  }

  .versiones div {
    display: flex;
    gap: 0.5rem;
  }

  .versiones dt {
    color: var(--texto-suave);
  }

  .versiones dt::after {
    content: ":";
  }

  .versiones dd {
    margin: 0;
    font-weight: 600;
  }

  .formulas li {
    margin-bottom: 0.4rem;
  }

  a {
    color: var(--primario);
  }
</style>
