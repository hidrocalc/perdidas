"""Oraculo de referencia - App Darcy-Weisbach v1.

Implementacion independiente, en Python puro, de la "Especificacion tecnica v1".
Genera los valores esperados contra los que se prueba la app (TypeScript).
Regla: este archivo sigue la especificacion literalmente, paso por paso,
priorizando la claridad sobre la velocidad.
"""
from __future__ import annotations

import json
import math
import re
from dataclasses import dataclass, field
from pathlib import Path

DATA = json.loads((Path(__file__).resolve().parent.parent / "packages" / "data" / "tablas.json").read_text(encoding="utf-8"))
CT = DATA["constantes"]

# Rangos validos (Especificacion, seccion Entradas)
RANGOS = {
    "di_manual": (1.0, 5000.0, "mm"),
    "k_manual": (0.0, 50.0, "mm"),
    "c_manual": (50.0, 160.0, ""),
    "L": (0.0, 100000.0, "m"),          # 0 < L <= 100000 (minimo exclusivo)
    "T": (0.0, 60.0, "°C"),
    "Q_m3s": (0.0, 10.0, "m³/s"),       # 0 < Q <= 10 (minimo exclusivo)
    "cantidad": (0, 999, ""),
    "extra_k": (0.0, 100.0, ""),
}
MAX_EXTRA = 10          # filas de singularidades adicionales
MAX_NOMBRE_EXTRA = 60   # caracteres
EXCLUSIVO_MIN = {"L", "Q_m3s"}


# --------------------------------------------------------------------------
# Parseo de numeros (Especificacion, "Reglas comunes a los campos numericos")
# --------------------------------------------------------------------------
_NUM = re.compile(r"^[+-]?(\d+([.,]\d*)?|[.,]\d+)([eE][+-]?\d+)?$")


def parse_numero(texto: str):
    """Devuelve (valor, None) o (None, codigo_error)."""
    if texto is None:
        return None, "E-VACIO"
    s = str(texto).strip()
    if s == "":
        return None, "E-VACIO"
    if not _NUM.match(s):
        return None, "E-FORMATO"          # un solo separador decimal; rechaza ambiguos, texto, NaN, Infinity
    v = float(s.replace(",", "."))
    if not math.isfinite(v):
        return None, "E-FORMATO"
    return v, None


# --------------------------------------------------------------------------
# Tablas
# --------------------------------------------------------------------------
def material(nombre):
    for m in DATA["materiales"]:
        if m["material"] == nombre:
            return m
    raise KeyError(nombre)


def k_tabla_mm(nombre):
    m = material(nombre)
    return m["k_max_mm"]                              # maximo del rango (decision validada, criterio conservador)


def di_tabla_mm(tabla, dn, pn):
    for d in DATA["diametros"][tabla]:
        if d["dn"] == dn and d["pn"] == pn:
            return d["di_mm"]
    return None


def factor_caudal(unidad):
    for u in DATA["caudal"]:
        if u["unidad"] == unidad:
            return u["num"] / u["den"]
    raise KeyError(unidad)


def viscosidad(T):
    tab = DATA["viscosidad"]
    n = len(tab)
    i = max(j for j in range(n) if tab[j]["t_c"] <= T)   # mayor indice con T_i <= T
    i = min(i, n - 2)                                     # limitado al penultimo punto
    t0, n0 = tab[i]["t_c"], tab[i]["nu_m2s"]
    t1, n1 = tab[i + 1]["t_c"], tab[i + 1]["nu_m2s"]
    return n0 + (T - t0) * (n1 - n0) / (t1 - t0)


# --------------------------------------------------------------------------
# Calculo
# --------------------------------------------------------------------------
@dataclass
class Entrada:
    tabla: str = "PVC"
    dn: float | None = 180
    pn: float | None = 6
    di_manual: float | None = None
    material: str = "Cloruro de polivinilo (PVC)"
    k_manual: float | None = None
    c_manual: float | None = None
    L: float = 50
    T: float = 20
    Q_valor: float = 280000
    Q_unidad: str = "l/h"
    cantidades: dict = field(default_factory=lambda: {
        "Entrada de tubería proyectada (reentrante)": 1, "Salida de tubería (a depósito)": 1})
    # Singularidades definidas por el usuario: [{"nombre": str, "k": float, "cantidad": int}]
    singularidades_extra: list = field(default_factory=list)


def _rango(nombre, v, errores):
    lo, hi, _ = RANGOS[nombre]
    bad = (not math.isfinite(v)) or (v <= lo if nombre in EXCLUSIVO_MIN else v < lo) or v > hi
    if bad:
        errores.append({"codigo": "E-RANGO", "campo": nombre})


def _es_entero(n):
    return isinstance(n, (int, float)) and not isinstance(n, bool) and math.isfinite(n) and n == int(n)


def validar(e: Entrada):
    errores = []
    if e.tabla not in ("PVC", "PE", "Manual"):
        errores.append({"codigo": "E-RANGO", "campo": "tabla"})
    elif e.tabla == "Manual":
        if e.di_manual is None:
            errores.append({"codigo": "E-VACIO", "campo": "di_manual"})
        else:
            _rango("di_manual", e.di_manual, errores)
    elif di_tabla_mm(e.tabla, e.dn, e.pn) is None:
        errores.append({"codigo": "E-RANGO", "campo": "dn_pn"})
    try:
        material(e.material)
    except KeyError:
        errores.append({"codigo": "E-RANGO", "campo": "material"})
    if e.k_manual is not None:
        _rango("k_manual", e.k_manual, errores)
    if e.c_manual is not None:
        _rango("c_manual", e.c_manual, errores)
    _rango("L", e.L, errores)
    _rango("T", e.T, errores)
    try:
        _rango("Q_m3s", e.Q_valor * factor_caudal(e.Q_unidad), errores)
    except KeyError:
        errores.append({"codigo": "E-RANGO", "campo": "Q_unidad"})
    nombres = {s["singularidad"] for s in DATA["singularidades"]}
    for nombre, n in e.cantidades.items():
        if nombre not in nombres or not _es_entero(n):
            errores.append({"codigo": "E-RANGO", "campo": "cantidad"})
        else:
            _rango("cantidad", n, errores)
    if len(e.singularidades_extra) > MAX_EXTRA:
        errores.append({"codigo": "E-RANGO", "campo": "extra_max"})
    for s in e.singularidades_extra:
        nombre = s.get("nombre", "")
        if not isinstance(nombre, str) or len(nombre) > MAX_NOMBRE_EXTRA:
            errores.append({"codigo": "E-RANGO", "campo": "extra_nombre"})
        k = s.get("k")
        if k is None:
            errores.append({"codigo": "E-VACIO", "campo": "extra_k"})
        else:
            _rango("extra_k", k, errores)
        n = s.get("cantidad")
        if n is None or not _es_entero(n):
            errores.append({"codigo": "E-RANGO", "campo": "extra_cantidad"})
        else:
            lo, hi, _ = RANGOS["cantidad"]
            if n < lo or n > hi:
                errores.append({"codigo": "E-RANGO", "campo": "extra_cantidad"})
    return errores


def colebrook(Re, K, D):
    """Paso 7: devuelve (f, iteraciones, filas) o lanza NoConverge."""
    a, b, tol = CT["colebrook_a"], CT["colebrook_b"], CT["tolerancia"]
    f0 = (-2 * math.log10(K / (b * D))) ** -2 if K > 0 else CT["f0_liso"]
    filas = []
    fi = f0
    for i in range(1, int(CT["max_iter"]) + 1):
        f1 = (-2 * math.log10(a / (Re * math.sqrt(fi)) + K / (b * D))) ** -2
        filas.append({"i": i, "f_in": fi, "f_out": f1, "delta": abs(f1 - fi)})
        if abs(f1 - fi) < tol:
            return f1, i, f0, filas
        fi = f1
    raise ArithmeticError("E-NOCONV")


def calcular(e: Entrada):
    errores = validar(e)
    if errores:
        return {"ok": False, "errores": errores}

    g = CT["g"]
    # Paso 1
    di = e.di_manual if e.tabla == "Manual" else di_tabla_mm(e.tabla, e.dn, e.pn)
    D = di / 1000.0
    K_mm = e.k_manual if e.k_manual is not None else k_tabla_mm(e.material)
    K = K_mm / 1000.0
    C = e.c_manual if e.c_manual is not None else material(e.material)["c_hw"]
    # Pasos 2-5
    nu = viscosidad(e.T)
    Q = e.Q_valor * factor_caudal(e.Q_unidad)
    A = math.pi * D ** 2 / 4
    V = Q / A
    Re = V * D / nu
    # Paso 6
    if Re < CT["re_laminar"]:            # Re < 2000
        regimen = "laminar"
    elif Re <= CT["re_turbulento"]:      # 2000 <= Re <= 4000
        regimen = "transicion"
    else:
        regimen = "turbulento"
    # Paso 7
    if regimen == "laminar":
        f, iteraciones, f0, filas = 64.0 / Re, 0, None, []
    else:
        try:
            f, iteraciones, f0, filas = colebrook(Re, K, D)
        except ArithmeticError:
            return {"ok": False, "errores": [{"codigo": "E-NOCONV", "campo": None}]}
    # Paso 8
    f_sj = 0.25 / (math.log10(K / (3.7 * D) + 5.74 / Re ** 0.9)) ** 2
    # Paso 9
    hv = V ** 2 / (2 * g)
    hf = f * (e.L / D) * hv
    kdict = {s["singularidad"]: s["k"] for s in DATA["singularidades"]}
    # Suma explicita de izquierda a derecha (igual que el Excel y el motor TS).
    # No usar sum(): desde Python 3.12 usa suma compensada y el ultimo decimal cambia segun la version.
    sumK = 0.0
    for nombre, n in e.cantidades.items():
        sumK += n * kdict[nombre]
    for s in e.singularidades_extra:
        sumK += s["cantidad"] * s["k"]
    hloc = sumK * hv
    total = hf + hloc
    # Paso 10
    hf_hw = 10.679 * e.L * Q ** 1.852 / (C ** 1.852 * D ** 4.87)
    J = hf / e.L

    adv = []
    if regimen == "laminar":
        adv.append("A-LAMINAR")
    if regimen == "transicion":
        adv.append("A-TRANSICION")
    if V > CT["v_max"]:
        adv.append("A-VEL-ALTA")
    if V < CT["v_min"]:
        adv.append("A-VEL-BAJA")
    if K / D > 0.05:
        adv.append("A-KD")
    if e.T < 5 or e.T > 25 or D < 0.05:
        adv.append("A-HW")

    return {
        "ok": True,
        "intermedios": {"D_m": D, "K_m": K, "C": C, "nu_m2s": nu, "Q_m3s": Q, "A_m2": A,
                        "K_sobre_D": K / D, "f0": f0, "hv_m": hv, "suma_K": sumK},
        "resultados": {"V": V, "Re": Re, "regimen": regimen, "f": f, "iteraciones": iteraciones,
                       "f_sj": f_sj, "hf_dw": hf, "hf_hw": hf_hw, "dif_hw_dw": hf_hw / hf - 1,
                       "h_loc": hloc, "h_total": total, "J": J, "hf_100m": J * 100},
        "advertencias": adv,
        "iteraciones_detalle": filas,
    }
