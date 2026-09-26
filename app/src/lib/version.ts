/** Versiones que se muestran en "Acerca de". */
import { TABLAS } from "@dw/data";
import paquete from "../../package.json";

export const VERSION_APP: string = paquete.version;
export const VERSION_TABLAS: string = TABLAS.version_tablas;
/** Revisión de docs/ESPECIFICACION.md que implementa el motor (la misma de test_vectors/). */
export const VERSION_ESPECIFICACION = "1.1";
export const REPOSITORIO = "https://github.com/hidrocalc/perdidas";
