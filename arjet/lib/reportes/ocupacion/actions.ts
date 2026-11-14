"use server";

import { administradorActual } from "./sesion";
import { consultarOcupacion } from "./data";
import { validarFiltrosOcupacion } from "./validacion";
import { ERROR_REPORTE, SIN_PERMISOS, type ResultadoOcupacion } from "./tipos";

export async function generarReporteOcupacion(entrada: unknown): Promise<ResultadoOcupacion> {
  try {
    // La acción puede invocarse directamente: no depende del proxy ni de la UI.
    if (!(await administradorActual())) return { ok: false, mensaje: SIN_PERMISOS };
    const validacion = validarFiltrosOcupacion(entrada);
    if (!validacion.ok) return { ok: false, mensaje: "Revisá los filtros marcados en rojo", errores: validacion.errores };
    return { ok: true, reporte: await consultarOcupacion(validacion.filtros) };
  } catch {
    return { ok: false, mensaje: ERROR_REPORTE };
  }
}
