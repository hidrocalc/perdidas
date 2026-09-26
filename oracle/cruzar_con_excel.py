"""Cruza el oraculo contra el Excel corregido, recalculando cada caso en LibreOffice.

Para cada vector valido (esperado.ok = True) carga las entradas en la hoja
'Datos de entrada', recalcula y compara todos los resultados numericos,
el numero de iteraciones y el regimen. Tolerancia: error relativo <= 1E-9.

Uso:  python oracle/cruzar_con_excel.py "ruta/Darcy Weisbach - corregido.xlsx"
Requiere LibreOffice (soffice) y el modulo 'uno'.
"""
import glob
import json
import re
import subprocess
import sys
import time
from pathlib import Path

import uno
from com.sun.star.beans import PropertyValue

ROOT = Path(__file__).resolve().parent.parent
TOL = 1e-9
N_EXTRA_EXCEL = 3
SING_ORDEN = [s["singularidad"] for s in json.loads((ROOT / "packages" / "data" / "tablas.json").read_text("utf-8"))["singularidades"]]


def conectar():
    proc = subprocess.Popen(["soffice", "--headless", "--invisible", "--norestore",
                             "--accept=socket,host=127.0.0.1,port=2002;urp;"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    local = uno.getComponentContext()
    resolver = local.ServiceManager.createInstanceWithContext("com.sun.star.bridge.UnoUrlResolver", local)
    for _ in range(60):
        try:
            ctx = resolver.resolve("uno:socket,host=127.0.0.1,port=2002;urp;StarOffice.ComponentContext")
            return proc, ctx.ServiceManager.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)
        except Exception:
            time.sleep(0.5)
    raise RuntimeError("No se pudo conectar con LibreOffice")


def main(xlsx):
    proc, desktop = conectar()
    try:
        p = PropertyValue(); p.Name = "Hidden"; p.Value = True
        doc = desktop.loadComponentFromURL(uno.systemPathToFileUrl(str(Path(xlsx).resolve())), "_blank", 0, (p,))
        sh = doc.Sheets
        D, C, H = sh.getByName("Datos de entrada"), sh.getByName("Calculo de f"), sh.getByName("Hf DW")

        def put(cell, v):
            c = D.getCellRangeByName(cell)
            if v is None:
                c.setString("")
            elif isinstance(v, str):
                c.setString(v)
            else:
                c.setValue(float(v))

        def num(sheet, cell):
            return sheet.getCellRangeByName(cell).getValue()

        casos, omitidos = [], []
        for f in sorted(glob.glob(str(ROOT / "test_vectors" / "calculo_*.json"))):
            validos = [c for c in json.load(open(f, encoding="utf-8"))["casos"] if c["esperado"]["ok"]]
            # El Excel tiene 3 filas de singularidades propias; la app admite hasta 10.
            omitidos += [c["id"] for c in validos if len(c["entrada"].get("singularidades_extra", [])) > N_EXTRA_EXCEL]
            casos += [c for c in validos if len(c["entrada"].get("singularidades_extra", [])) <= N_EXTRA_EXCEL]

        fallas, peor = [], (0.0, None, None)
        for caso in casos:
            e = caso["entrada"]
            put("B5", e["tabla"])
            put("B6", e["dn"]); put("B7", e["pn"])
            put("B8", e["di_manual"] if e["tabla"] == "Manual" else None)
            put("B13", e["material"]); put("B15", e["k_manual"]); put("B18", e["c_manual"])
            put("B20", e["L"]); put("B23", e["T"]); put("B27", e["Q_valor"]); put("C27", e["Q_unidad"])
            for i, nombre in enumerate(SING_ORDEN):
                put(f"B{34 + i}", e["cantidades"].get(nombre, 0))
            extras = e.get("singularidades_extra", [])
            for j in range(N_EXTRA_EXCEL):
                r = 34 + len(SING_ORDEN) + j
                x = extras[j] if j < len(extras) else {"nombre": "", "k": 0, "cantidad": 0}
                put(f"A{r}", x["nombre"]); put(f"B{r}", x["cantidad"]); put(f"C{r}", x["k"])
            doc.calculateAll()

            estado = C.getCellRangeByName("B17").getString()
            m = re.search(r"(\d+) iteraciones", estado)
            excel = {
                "V": num(C, "B11"), "Re": num(C, "B12"), "f": num(C, "B16"), "f_sj": num(C, "B19"),
                "hf_dw": num(H, "B5"), "hf_hw": num(H, "B12"), "h_loc": num(H, "B8"), "h_total": num(H, "B9"),
                "dif_hw_dw": num(H, "B13"), "J": num(D, "G18"),
                "iteraciones": int(m.group(1)) if m else (0 if estado.startswith("Laminar") else -1),
            }
            reg = C.getCellRangeByName("B13").getString()
            excel_reg = "laminar" if reg.startswith("Laminar") else "transicion" if reg.startswith("Transición") else "turbulento"
            esp = caso["esperado"]["resultados"]
            problemas = []
            for k, v in excel.items():
                ref = esp[k]
                if k == "iteraciones":
                    if v != ref:
                        problemas.append(f"iteraciones Excel={v} oraculo={ref}")
                    continue
                rel = abs(v - ref) / max(abs(ref), 1e-300)
                if rel > peor[0]:
                    peor = (rel, caso["id"], k)
                if rel > TOL:
                    problemas.append(f"{k}: Excel={v!r} oraculo={ref!r} rel={rel:.2e}")
            if excel_reg != esp["regimen"]:
                problemas.append(f"regimen Excel={excel_reg} oraculo={esp['regimen']}")
            if problemas:
                fallas.append((caso["id"], caso["descripcion"], problemas))
        doc.close(True)
    finally:
        proc.terminate()

    print(f"Casos comparados: {len(casos)} | con diferencias: {len(fallas)} | "
          f"peor error relativo: {peor[0]:.3e} ({peor[1]}, {peor[2]}) | omitidos por tener > 3 singularidades propias: {omitidos}")
    for fid, desc, probs in fallas:
        print(" -", fid, desc)
        for pr in probs:
            print("     ", pr)
    sys.exit(1 if fallas else 0)


if __name__ == "__main__":
    main(sys.argv[1])
