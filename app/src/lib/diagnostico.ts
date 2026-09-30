/**
 * Diagnóstico para las pruebas en dispositivos reales (etapa 5, D-24): cuánto tarda un
 * cálculo en este equipo y en qué estado está la app. No se envía nada: solo se muestra.
 */
import { evaluar, textosPorDefecto } from "./entrada";

export interface Medicion {
  /** Tiempo medio de un cálculo completo (leer el formulario + calcular), en ms. */
  readonly promedioMs: number;
  /** El cálculo más lento de la serie, en ms. */
  readonly maximoMs: number;
  readonly repeticiones: number;
}

/**
 * Mide `evaluar()` —lo que corre en cada tecla— con los datos por defecto.
 * La primera corrida se descarta (el navegador todavía no optimizó el código).
 */
export function medirCalculo(repeticiones = 200, reloj: () => number = () => performance.now()): Medicion {
  const textos = textosPorDefecto();
  evaluar(textos);
  let total = 0;
  let maximo = 0;
  for (let i = 0; i < repeticiones; i++) {
    const inicio = reloj();
    evaluar(textos);
    const ms = reloj() - inicio;
    total += ms;
    if (ms > maximo) maximo = ms;
  }
  return { promedioMs: total / repeticiones, maximoMs: maximo, repeticiones };
}

export interface EstadoApp {
  /** Abierta como app instalada (ventana propia), no en una pestaña del navegador. */
  readonly instalada: boolean;
  /** Un service worker controla la página: funciona sin conexión. */
  readonly sinConexion: boolean;
  readonly navegador: string;
}

/** Lo que usa estadoApp() del navegador (se pasa como parámetro para poder probarla). */
export interface Entorno {
  readonly navigator: Pick<Navigator, "userAgent"> & { readonly standalone?: boolean; readonly serviceWorker?: { readonly controller: unknown } };
  readonly matchMedia: (consulta: string) => { readonly matches: boolean };
}

export function estadoApp(entorno: Entorno): EstadoApp {
  const { navigator: nav } = entorno;
  return {
    // iPhone/iPad marcan la app instalada con navigator.standalone; el resto, con display-mode.
    instalada: nav.standalone === true || entorno.matchMedia("(display-mode: standalone)").matches,
    sinConexion: nav.serviceWorker !== undefined && nav.serviceWorker.controller !== null,
    navegador: nav.userAgent,
  };
}
