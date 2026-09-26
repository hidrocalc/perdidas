"""Comparacion de resultados con tolerancia (misma regla que el motor TypeScript).

Numeros: error relativo <= 1E-12 (mas exigente que el 1E-9 del contrato), salvo las
restas de valores casi iguales ('delta', 'dif_hw_dw'), que usan error absoluto <= 1E-12.
Enteros de conteo ('iteraciones', 'i'), textos, codigos y estructura: exactos.
"""
import math

TOL_REL = 1e-12
TOL_ABS_DIFERENCIAS = 1e-12
CAMPOS_RESTA = {"delta", "dif_hw_dw"}
CAMPOS_ENTEROS = {"iteraciones", "i"}


def diferencia(real, esperado, ruta="$", clave=None):
    """Devuelve None si coinciden, o un texto con la primera diferencia."""
    if isinstance(esperado, bool) or esperado is None or isinstance(esperado, str):
        return None if real == esperado else f"{ruta}: {real!r} != {esperado!r}"
    if isinstance(esperado, (int, float)):
        if not isinstance(real, (int, float)) or isinstance(real, bool):
            return f"{ruta}: esperado numero, llego {real!r}"
        if clave in CAMPOS_ENTEROS:
            return None if real == esperado else f"{ruta}: {real} != {esperado}"
        if clave in CAMPOS_RESTA:
            return None if abs(real - esperado) <= TOL_ABS_DIFERENCIAS else f"{ruta}: {real} vs {esperado}"
        if real == esperado or math.isclose(real, esperado, rel_tol=TOL_REL, abs_tol=0.0):
            return None
        return f"{ruta}: {real} vs {esperado}"
    if isinstance(esperado, list):
        if not isinstance(real, list) or len(real) != len(esperado):
            return f"{ruta}: longitud distinta"
        for i, (a, b) in enumerate(zip(real, esperado)):
            d = diferencia(a, b, f"{ruta}[{i}]", clave)
            if d:
                return d
        return None
    if isinstance(esperado, dict):
        if not isinstance(real, dict) or sorted(real) != sorted(esperado):
            return f"{ruta}: claves distintas"
        for k in esperado:
            d = diferencia(real[k], esperado[k], f"{ruta}.{k}", k)
            if d:
                return d
        return None
    return f"{ruta}: tipo no soportado {type(esperado)}"
