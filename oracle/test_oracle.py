"""Pruebas del oraculo: propiedades fisicas + reproduccion de los vectores.

Uso:  python -m pytest oracle -q
"""
import glob
import json
import math
import random
from dataclasses import replace
from pathlib import Path

import pytest

import dw_oracle as o

ROOT = Path(__file__).resolve().parent.parent
rng = random.Random(7)
MATS = [m["material"] for m in o.DATA["materiales"]]


def base_aleatoria():
    return o.Entrada(tabla="Manual", dn=None, pn=None, di_manual=rng.uniform(20, 800),
                     material=rng.choice(MATS), L=rng.uniform(1, 5000), T=rng.uniform(0, 60),
                     Q_valor=rng.uniform(0.5, 400), Q_unidad="l/s", cantidades={})


def res(e):
    r = o.calcular(e)
    assert r["ok"], r
    return r["resultados"]


N = 300


def test_vectores_se_reproducen():
    """El oraculo actual reproduce exactamente los vectores guardados."""
    for f in glob.glob(str(ROOT / "test_vectors" / "calculo_*.json")):
        for caso in json.load(open(f, encoding="utf-8"))["casos"]:
            nuevo = o.calcular(o.Entrada(**caso["entrada"]))
            assert json.loads(json.dumps(nuevo)) == caso["esperado"], caso["id"]


def test_parseo_se_reproduce():
    for c in json.load(open(ROOT / "test_vectors" / "parseo.json", encoding="utf-8"))["casos"]:
        assert list(o.parse_numero(c["texto"])) == [c["valor"], c["error"]], c["texto"]


def _turbulento(e):
    return res(e)["regimen"] == "turbulento"


def test_hf_crece_con_Q_L_K_y_baja_con_D():
    n = 0
    while n < N:
        e = base_aleatoria()
        if not _turbulento(e):
            continue
        h = res(e)["hf_dw"]
        assert res(replace(e, Q_valor=e.Q_valor * 1.1))["hf_dw"] > h
        assert res(replace(e, L=e.L * 1.1))["hf_dw"] > h
        assert res(replace(e, k_manual=o.k_tabla_mm(e.material) * 1.5 + 0.001))["hf_dw"] > h
        assert res(replace(e, di_manual=e.di_manual * 1.1))["hf_dw"] < h
        n += 1


def test_hf_es_lineal_en_L():
    for _ in range(N):
        e = base_aleatoria()
        assert math.isclose(res(replace(e, L=2 * e.L))["hf_dw"], 2 * res(e)["hf_dw"], rel_tol=1e-12)


def test_resultado_no_depende_de_la_unidad_de_caudal():
    for _ in range(N):
        e = base_aleatoria()
        q = e.Q_valor * o.factor_caudal("l/s")
        ref = res(e)["hf_dw"]
        for u in o.DATA["caudal"]:
            alt = replace(e, Q_valor=q / o.factor_caudal(u["unidad"]), Q_unidad=u["unidad"])
            assert math.isclose(res(alt)["hf_dw"], ref, rel_tol=1e-12)


def test_f_positivo_y_colebrook_satisfecho():
    for _ in range(N):
        e = base_aleatoria()
        r = o.calcular(e)
        f, Re = r["resultados"]["f"], r["resultados"]["Re"]
        assert f > 0
        if r["resultados"]["regimen"] != "laminar":
            D, K = r["intermedios"]["D_m"], r["intermedios"]["K_m"]
            residuo = 1 / math.sqrt(f) + 2 * math.log10(2.51 / (Re * math.sqrt(f)) + K / (3.71 * D))
            assert abs(residuo) < 1e-4


def test_laminar_usa_64_sobre_Re():
    e = o.Entrada(tabla="Manual", dn=None, pn=None, di_manual=100, Q_valor=1e-6, Q_unidad="m³/s")
    r = res(e)
    assert r["regimen"] == "laminar" and r["iteraciones"] == 0
    assert math.isclose(r["f"], 64 / r["Re"], rel_tol=1e-15)


@pytest.mark.parametrize("T", [t["t_c"] for t in o.DATA["viscosidad"]])
def test_viscosidad_exacta_en_puntos_de_tabla(T):
    esperado = next(v["nu_m2s"] for v in o.DATA["viscosidad"] if v["t_c"] == T)
    assert math.isclose(o.viscosidad(T), esperado, rel_tol=1e-15)


def test_viscosidad_monotona_decreciente():
    ts = [i / 10 for i in range(0, 601)]
    vs = [o.viscosidad(t) for t in ts]
    assert all(a > b for a, b in zip(vs, vs[1:]))


def test_colebrook_converge_en_todo_el_dominio():
    for _ in range(2000):
        Re = 10 ** rng.uniform(math.log10(4000), 8)
        KD = rng.choice([0.0, 10 ** rng.uniform(-7, math.log10(0.05))])
        f, it, _, _ = o.colebrook(Re, KD * 0.1, 0.1)
        assert 0 < f < 0.1 and it <= 30


def test_swamee_jain_dentro_de_3pc_en_su_rango():
    for _ in range(2000):
        Re = 10 ** rng.uniform(math.log10(5000), 8)
        KD = 10 ** rng.uniform(-6, -2)
        f, _, _, _ = o.colebrook(Re, KD * 0.1, 0.1)
        fsj = 0.25 / (math.log10(KD / 3.7 + 5.74 / Re ** 0.9)) ** 2
        assert abs(fsj / f - 1) < 0.03


def test_nunca_devuelve_nan_ni_infinito():
    for _ in range(N):
        r = o.calcular(base_aleatoria())
        for k, v in r["resultados"].items():
            if isinstance(v, float):
                assert math.isfinite(v), k
