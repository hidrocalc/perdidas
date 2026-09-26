import { calcular, combinacionesDisponibles, ENTRADA_POR_DEFECTO } from "@dw/core";
import { TABLAS } from "@dw/data";
import { describe, expect, it } from "vitest";
import {
  ajustarDnPn, dnsDisponibles, evaluar, ID_GENERAL, idCantidad, idDeError, idPropia, leer, MAX_PROPIAS,
  pnsDisponibles, textosPorDefecto, type TextosEntrada,
} from "../src/lib/entrada";

const con = (cambios: Partial<TextosEntrada>): TextosEntrada => ({ ...textosPorDefecto(), ...cambios });

describe("valores por defecto", () => {
  it("dan exactamente el mismo resultado que ENTRADA_POR_DEFECTO del motor", () => {
    const { calculo, errores } = evaluar(textosPorDefecto());
    const referencia = calcular(ENTRADA_POR_DEFECTO);
    expect(errores.size).toBe(0);
    if (!calculo?.ok || !referencia.ok) throw new Error("tienen que calcular");
    expect(calculo.resultados).toEqual(referencia.resultados);
  });

  it("muestran el caudal por defecto interpretado como 280 000", () => {
    expect(leer(textosPorDefecto()).interpretados.get("Q")).toBe(280000);
  });
});

describe("lectura de campos", () => {
  it('"280.000" se interpreta como 280 (el punto es decimal): el usuario lo ve', () => {
    const { interpretados, errores } = leer(con({ Q: "280.000" }));
    expect(interpretados.get("Q")).toBe(280);
    expect(errores.size).toBe(0);
  });

  it("coma y punto decimal dan lo mismo", () => {
    expect(leer(con({ L: "12,5" })).interpretados.get("L")).toBe(12.5);
    expect(leer(con({ L: "12.5" })).interpretados.get("L")).toBe(12.5);
  });

  it("separador ambiguo: E-FORMATO en el campo y no se calcula", () => {
    const { calculo, errores } = evaluar(con({ L: "1.000,5" }));
    expect(calculo).toBeNull();
    expect(errores.get("L")).toBe("Longitud L: no es un número válido. Usá coma o punto decimal, sin separador de miles.");
  });

  it("campo obligatorio vacío: E-VACIO", () => {
    expect(evaluar(con({ T: "  " })).errores.get("T")).toBe("Ingresá un valor para Temperatura del agua T.");
  });

  it("K y C manuales vacíos son opcionales (usa la tabla)", () => {
    const { entrada } = leer(con({ k_manual: "", c_manual: " " }));
    expect(entrada?.k_manual).toBeNull();
    expect(entrada?.c_manual).toBeNull();
  });

  it("K y C manuales ingresados llegan al motor", () => {
    const { entrada } = leer(con({ k_manual: "0,1", c_manual: "140" }));
    expect(entrada?.k_manual).toBe(0.1);
    expect(entrada?.c_manual).toBe(140);
  });

  it("cantidad de singularidad vacía cuenta como 0", () => {
    const cantidades = textosPorDefecto().cantidades.map(() => "");
    const { entrada } = leer(con({ cantidades }));
    expect(Object.values(entrada?.cantidades ?? {})).toEqual(TABLAS.singularidades.map(() => 0));
  });

  it("con tabla PVC/PE no se lee el DI manual; con Manual es obligatorio", () => {
    expect(leer(con({ di_manual: "basura" })).errores.size).toBe(0);
    const manual = evaluar(con({ tabla: "Manual", di_manual: "" }));
    expect(manual.errores.get("di_manual")).toBe("Ingresá un valor para DI manual.");
    const ok = leer(con({ tabla: "Manual", di_manual: "130" })).entrada;
    expect(ok).toMatchObject({ tabla: "Manual", dn: null, pn: null, di_manual: 130 });
  });

  it("el nombre de una singularidad propia se recorta", () => {
    const { entrada } = leer(con({ propias: [{ nombre: "  Filtro  ", k: "3,5", cantidad: "1" }] }));
    expect(entrada?.singularidades_extra).toEqual([{ nombre: "Filtro", k: 3.5, cantidad: 1 }]);
  });
});

describe("errores del motor ubicados en su campo", () => {
  it("rango de L", () => {
    expect(evaluar(con({ L: "0" })).errores.get("L")).toBe("Longitud L debe estar entre 0 y 100 000 m.");
  });

  it("rango del caudal, informado en m³/s", () => {
    expect(evaluar(con({ Q: "40000", Q_unidad: "m³/h" })).errores.get("Q")).toBe("Caudal Q debe estar entre 0 y 10 m³/s.");
  });

  it("cantidad no entera en la fila 4 de la tabla", () => {
    const cantidades = textosPorDefecto().cantidades;
    cantidades[4] = "1,5";
    expect(evaluar(con({ cantidades })).errores.get(idCantidad(4))).toBe("Cantidad debe estar entre 0 y 999.");
  });

  it("K fuera de rango en la segunda singularidad propia", () => {
    const propias = [{ nombre: "A", k: "1", cantidad: "1" }, { nombre: "B", k: "-1", cantidad: "1" }];
    const { errores } = evaluar(con({ propias }));
    expect([...errores.keys()]).toEqual([idPropia(1, "k")]);
  });

  it("singularidad propia sin K ni cantidad", () => {
    const { errores } = evaluar(con({ propias: [{ nombre: "A", k: "", cantidad: "" }] }));
    expect(errores.get(idPropia(0, "k"))).toBe("Ingresá un valor para K de la singularidad.");
    expect(errores.get(idPropia(0, "cantidad"))).toBe("Ingresá un valor para Cantidad de la singularidad.");
  });

  it("más de 10 propias: error general", () => {
    const propias = Array.from({ length: MAX_PROPIAS + 1 }, () => ({ nombre: "", k: "1", cantidad: "1" }));
    expect(evaluar(con({ propias })).errores.get(ID_GENERAL)).toBe("Podés agregar hasta 10 singularidades propias.");
  });

  it("si un campo tiene dos errores, se muestra el primero", () => {
    const propias = [{ nombre: "x".repeat(61), k: "1", cantidad: "1" }];
    expect(evaluar(con({ propias })).errores.get(idPropia(0, "nombre"))).toBe(
      "El nombre de la singularidad puede tener hasta 60 caracteres.",
    );
  });

  it.each([
    [{ codigo: "E-NOCONV", campo: null, fila: null }, ID_GENERAL],
    [{ codigo: "E-RANGO", campo: "extra_max", fila: null }, ID_GENERAL],
    [{ codigo: "E-RANGO", campo: "dn_pn", fila: null }, "dn"],
    [{ codigo: "E-RANGO", campo: "Q_m3s", fila: null }, "Q"],
    [{ codigo: "E-RANGO", campo: "cantidad", fila: 3 }, "cantidad-3"],
    [{ codigo: "E-RANGO", campo: "cantidad", fila: null }, "cantidad-0"],
    [{ codigo: "E-RANGO", campo: "extra_nombre", fila: 2 }, "propia-2-nombre"],
    [{ codigo: "E-RANGO", campo: "extra_k", fila: null }, "propia-0-k"],
    [{ codigo: "E-RANGO", campo: "extra_cantidad", fila: 9 }, "propia-9-cantidad"],
    [{ codigo: "E-RANGO", campo: "extra_nombre", fila: null }, "propia-0-nombre"],
    [{ codigo: "E-RANGO", campo: "extra_cantidad", fila: null }, "propia-0-cantidad"],
    [{ codigo: "E-RANGO", campo: "T", fila: null }, "T"],
  ] as const)("idDeError(%j) = %s", (error, id) => {
    expect(idDeError(error)).toBe(id);
  });
});

describe("combinaciones DN/PN", () => {
  it("solo ofrece combinaciones que existen", () => {
    for (const tabla of ["PVC", "PE"] as const) {
      const existentes = new Set(combinacionesDisponibles(tabla).map((c) => `${c.dn}/${c.pn}`));
      for (const dn of dnsDisponibles(tabla)) {
        for (const pn of pnsDisponibles(tabla, dn)) expect(existentes.has(`${dn}/${pn}`)).toBe(true);
      }
    }
  });

  it("DN ordenados y sin repetir", () => {
    const dns = dnsDisponibles("PVC");
    expect(dns).toEqual([...new Set(dns)].sort((a, b) => a - b));
  });

  it("conserva la combinación si existe", () => {
    expect(ajustarDnPn("PVC", 180, 6)).toEqual({ dn: 180, pn: 6 });
  });

  it("al pasar de PVC 180 a PE, elige el DN más cercano y una PN existente", () => {
    const { dn, pn } = ajustarDnPn("PE", 180, 6);
    expect(dn).toBe(Math.max(...dnsDisponibles("PE")));
    expect(pnsDisponibles("PE", dn)).toContain(pn);
  });

  it("si la PN no existe para ese DN, toma la primera disponible", () => {
    const dn = 500;
    const pns = pnsDisponibles("PVC", dn);
    expect(pns).not.toContain(16);
    expect(ajustarDnPn("PVC", dn, 16)).toEqual({ dn, pn: pns[0] });
  });
});
