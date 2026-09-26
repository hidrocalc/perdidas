"""Genera los vectores de prueba en test_vectors/ a partir del oraculo.

Categorias:
  calculo_*.json  -> entrada completa + resultado esperado (o errores)
  parseo.json     -> texto ingresado + valor/codigo esperado
Semilla fija: la salida es reproducible byte a byte.
"""
import json
import math
import random
import sys
from dataclasses import asdict
from pathlib import Path

import dw_oracle as o

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "test_vectors"
rng = random.Random(20260925)

MATS = [m["material"] for m in o.DATA["materiales"]]
UNIDADES = [u["unidad"] for u in o.DATA["caudal"]]
SING = [s["singularidad"] for s in o.DATA["singularidades"]]
DEF_CANT = {"Entrada de tubería proyectada (reentrante)": 1, "Salida de tubería (a depósito)": 1}


def q_para_velocidad(D, V, unidad):
    return V * math.pi * D ** 2 / 4 / o.factor_caudal(unidad)


def q_para_re(D, Re, T, unidad):
    return q_para_velocidad(D, Re * o.viscosidad(T) / D, unidad)


casos = {"normales": [], "bordes": [], "errores": [], "convergencia": []}


def add(cat, desc, **kw):
    kw.setdefault("cantidades", dict(DEF_CANT))
    e = o.Entrada(**kw)
    casos[cat].append({"id": f"{cat[:3].upper()}-{len(casos[cat]) + 1:03d}", "descripcion": desc,
                       "entrada": asdict(e), "esperado": o.calcular(e)})


# ---------------- Normales ----------------
add("normales", "Datos por defecto del Excel corregido")
for m in MATS:                                           # cada material
    add("normales", f"Material: {m}", material=m)
for u in UNIDADES:                                       # cada unidad de caudal, mismo Q fisico (5 l/s)
    add("normales", f"Unidad de caudal {u}, Q = 5 l/s", Q_valor=0.005 / o.factor_caudal(u), Q_unidad=u)
for d in o.DATA["diametros"]["PVC"]:                     # cada DI de PVC a V = 1,5 m/s
    add("normales", f"PVC DN {d['dn']:g} PN {d['pn']:g} a 1,5 m/s", tabla="PVC", dn=d["dn"], pn=d["pn"],
        Q_valor=q_para_velocidad(d["di_mm"] / 1000, 1.5, "l/s"), Q_unidad="l/s", L=100)
for d in o.DATA["diametros"]["PE"]:                      # cada DI de PE a V = 1,2 m/s
    add("normales", f"PE DN {d['dn']:g} PN {d['pn']:g} a 1,2 m/s", tabla="PE", dn=d["dn"], pn=d["pn"],
        material="Polietileno (PE)", Q_valor=q_para_velocidad(d["di_mm"] / 1000, 1.2, "l/h"), Q_unidad="l/h", L=200)
for T in [t["t_c"] for t in o.DATA["viscosidad"]] + [2.5, 12.3, 22.5, 37.7, 44.4, 57.1]:
    add("normales", f"Temperatura {T:g} °C", T=T)
for i in range(120):                                     # aleatorios estratificados
    tabla = rng.choice(["PVC", "PE", "Manual"])
    kw = {"tabla": tabla, "material": rng.choice(MATS), "L": round(rng.uniform(1, 5000), 2),
          "T": round(rng.uniform(0, 60), 1), "Q_unidad": rng.choice(UNIDADES)}
    if tabla == "Manual":
        kw.update(dn=None, pn=None, di_manual=round(rng.uniform(10, 1200), 1))
        D = kw["di_manual"] / 1000
    else:
        d = rng.choice(o.DATA["diametros"][tabla])
        kw.update(dn=d["dn"], pn=d["pn"])
        D = d["di_mm"] / 1000
    if rng.random() < 0.3:
        kw["k_manual"] = round(rng.uniform(0, 2), 4)
    if rng.random() < 0.3:
        kw["c_manual"] = float(rng.randint(80, 150))
    kw["Q_valor"] = q_para_velocidad(D, rng.uniform(0.05, 4.0), kw["Q_unidad"])
    kw["cantidades"] = {n: rng.randint(0, 4) for n in rng.sample(SING, rng.randint(0, 5))}
    if rng.random() < 0.3:
        kw["singularidades_extra"] = [{"nombre": f"Accesorio {j + 1}", "k": round(rng.uniform(0, 10), 3),
                                       "cantidad": rng.randint(0, 5)} for j in range(rng.randint(1, 3))]
    add("normales", f"Aleatorio #{i + 1}", **kw)

# ---------------- Bordes ----------------
Dm = 0.1
for Re in (100, 1999.9, 2000.1, 3999.9, 4000.1):
    add("bordes", f"Re ≈ {Re:g} (DI manual 100 mm, 20 °C)", tabla="Manual", dn=None, pn=None, di_manual=100,
        Q_valor=q_para_re(Dm, Re, 20, "m³/s"), Q_unidad="m³/s")
add("bordes", "K manual = 0 (tubería lisa, f0 = 0,02)", k_manual=0.0)
add("bordes", "K manual = 50 mm (máximo), K/D > 0,05", k_manual=50.0)
add("bordes", "K/D justo sobre 0,05", tabla="Manual", dn=None, pn=None, di_manual=100, k_manual=5.001)
add("bordes", "T = 0 °C (mínimo)", T=0)
add("bordes", "T = 60 °C (máximo, último tramo)", T=60)
add("bordes", "T = 4,99 °C (límite aviso HW)", T=4.99)
add("bordes", "T = 25,01 °C (límite aviso HW)", T=25.01)
add("bordes", "L mínima (0,001 m)", L=0.001)
add("bordes", "L máxima (100 000 m)", L=100000)
add("bordes", "Q máximo (10 m³/s) en DI 5000 mm", tabla="Manual", dn=None, pn=None, di_manual=5000, Q_valor=10, Q_unidad="m³/s")
add("bordes", "DI mínimo (1 mm) con caudal chico", tabla="Manual", dn=None, pn=None, di_manual=1, Q_valor=0.5, Q_unidad="l/h")
add("bordes", "Q muy chico (1E-9 m³/s), laminar", Q_valor=1e-9, Q_unidad="m³/s")
add("bordes", "V justo sobre 2,5 m/s", Q_valor=q_para_velocidad(0.1694, 2.5000001, "m³/h"), Q_unidad="m³/h")
add("bordes", "V justo bajo 0,6 m/s", Q_valor=q_para_velocidad(0.1694, 0.5999999, "m³/h"), Q_unidad="m³/h")
add("bordes", "D < 50 mm (aviso HW)", tabla="PVC", dn=50, pn=10, Q_valor=2, Q_unidad="l/s")
add("bordes", "C manual = 50 (mínimo)", c_manual=50)
add("bordes", "C manual = 160 (máximo)", c_manual=160)
add("bordes", "Sin singularidades", cantidades={})
add("bordes", "Todas las singularidades con 999", cantidades={n: 999 for n in SING})
add("bordes", "Una singularidad propia (filtro K = 3,5)",
    singularidades_extra=[{"nombre": "Filtro de malla", "k": 3.5, "cantidad": 1}])
add("bordes", "Singularidades propias con K = 0 y K = 100 (límites)",
    singularidades_extra=[{"nombre": "A", "k": 0.0, "cantidad": 2}, {"nombre": "B", "k": 100.0, "cantidad": 1}])
add("bordes", "Singularidad propia sin nombre", singularidades_extra=[{"nombre": "", "k": 1.2, "cantidad": 3}])
add("bordes", "10 singularidades propias (máximo en la app)",
    singularidades_extra=[{"nombre": f"S{j}", "k": 0.1 * j, "cantidad": j} for j in range(10)])
add("bordes", "Material con rango de K usa el máximo (fundición nueva, K = 1,00 mm)", material="Fundición - nueva")

# ---------------- Errores ----------------
add("errores", "L = 0", L=0)
add("errores", "L negativa", L=-1)
add("errores", "L > 100 000", L=100000.1)
add("errores", "T < 0", T=-0.1)
add("errores", "T > 60", T=60.1)
add("errores", "Q = 0", Q_valor=0)
add("errores", "Q negativo", Q_valor=-5)
add("errores", "Q > 10 m³/s", Q_valor=10.0001, Q_unidad="m³/s")
add("errores", "Tabla Manual sin DI", tabla="Manual", dn=None, pn=None, di_manual=None)
add("errores", "DI manual < 1 mm", tabla="Manual", dn=None, pn=None, di_manual=0.5)
add("errores", "DI manual > 5000 mm", tabla="Manual", dn=None, pn=None, di_manual=5000.1)
add("errores", "K manual negativo", k_manual=-0.001)
add("errores", "K manual > 50 mm", k_manual=50.1)
add("errores", "C manual < 50", c_manual=49.9)
add("errores", "C manual > 160", c_manual=160.1)
add("errores", "Combinación DN/PN inexistente (PVC 500 PN 16)", dn=500, pn=16)
add("errores", "Combinación DN/PN inexistente (PE 10 PN 10)", tabla="PE", dn=10, pn=10)
add("errores", "Material inexistente", material="Madera")
add("errores", "Unidad de caudal inexistente", Q_unidad="ft³/s")
add("errores", "Cantidad de singularidad negativa", cantidades={SING[4]: -1})
add("errores", "Cantidad de singularidad > 999", cantidades={SING[4]: 1000})
add("errores", "Cantidad de singularidad no entera", cantidades={SING[4]: 1.5})
add("errores", "Varios errores a la vez (L = 0, T = 70)", L=0, T=70)
add("errores", "Singularidad propia con K negativo", singularidades_extra=[{"nombre": "X", "k": -0.1, "cantidad": 1}])
add("errores", "Singularidad propia con K > 100", singularidades_extra=[{"nombre": "X", "k": 100.1, "cantidad": 1}])
add("errores", "Singularidad propia sin K", singularidades_extra=[{"nombre": "X", "k": None, "cantidad": 1}])
add("errores", "Singularidad propia con cantidad no entera", singularidades_extra=[{"nombre": "X", "k": 1, "cantidad": 1.5}])
add("errores", "Singularidad propia con cantidad > 999", singularidades_extra=[{"nombre": "X", "k": 1, "cantidad": 1000}])
add("errores", "Singularidad propia con nombre de más de 60 caracteres",
    singularidades_extra=[{"nombre": "x" * 61, "k": 1, "cantidad": 1}])
add("errores", "11 singularidades propias (máximo 10)",
    singularidades_extra=[{"nombre": f"S{j}", "k": 1, "cantidad": 1} for j in range(11)])

# ---------------- Convergencia (barrido Re x K/D) ----------------
for Re in (4001, 1e4, 1e5, 1e6, 1e7, 1e8):  # 4001: evita caer justo en el límite 4000 (ver Especificación)
    for KD in (0.0, 1e-6, 1e-5, 1e-4, 1e-3, 1e-2, 0.05):
        D = 0.05  # DI 50 mm: con Q <= 10 m3/s permite llegar a Re = 1E8
        add("convergencia", f"Re = {Re:.4g}, K/D = {KD:g}", tabla="Manual", dn=None, pn=None, di_manual=50,
            k_manual=KD * D * 1000, Q_valor=q_para_re(D, Re, 20, "m³/s"), Q_unidad="m³/s")

# ---------------- Parseo ----------------
parseo = []
for texto in ["0,02", "0.02", "5", " 5 ", "+5", "-5", "5.", ".5", ",5", "1e-3", "1E3", "1,5e3", "2.5E-2",
              "1.000", "280.000", "1.000,5", "1,000.5", "1..5", "1,,5", "", "   ", "abc", "5a", "NaN", "nan",
              "Infinity", "inf", "--1", "1e", "e5", "1 000", "0", "0,0", "1e400"]:
    v, err = o.parse_numero(texto)
    parseo.append({"texto": texto, "valor": v, "error": err})

if "--verificar" in sys.argv:
    # Modo CI: no escribe nada; comprueba que los vectores guardados coinciden (con tolerancia)
    # con los que genera el oraculo en esta maquina.
    from comparar import diferencia
    fallas = 0
    for cat, lista in casos.items():
        guardados = json.loads((OUT / f"calculo_{cat}.json").read_text(encoding="utf-8"))["casos"]
        nuevos = json.loads(json.dumps(lista))
        if len(guardados) != len(nuevos):
            print(f"calculo_{cat}.json: {len(guardados)} casos guardados vs {len(nuevos)} generados"); fallas += 1
            continue
        for g, n in zip(guardados, nuevos):
            d = diferencia(n, g)
            if d:
                print(g["id"], d); fallas += 1
    guardado_parseo = json.loads((OUT / "parseo.json").read_text(encoding="utf-8"))["casos"]
    if guardado_parseo != json.loads(json.dumps(parseo)):
        print("parseo.json difiere"); fallas += 1
    print("vectores OK" if fallas == 0 else f"{fallas} diferencias: regenerar con 'python oracle/generar_vectores.py'")
    sys.exit(1 if fallas else 0)

OUT.mkdir(exist_ok=True)
meta = {"version_especificacion": "1.0", "version_tablas": o.DATA["version_tablas"],
        "tolerancia_relativa": 1e-9, "semilla": 20260925}
total = 0
for cat, lista in casos.items():
    (OUT / f"calculo_{cat}.json").write_text(json.dumps({"meta": meta, "casos": lista}, ensure_ascii=False, indent=1),
                                             encoding="utf-8")
    total += len(lista)
(OUT / "parseo.json").write_text(json.dumps({"meta": meta, "casos": parseo}, ensure_ascii=False, indent=1), encoding="utf-8")
print({k: len(v) for k, v in casos.items()}, "total calculo:", total, "| parseo:", len(parseo))
