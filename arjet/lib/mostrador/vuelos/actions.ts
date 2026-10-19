"use server";

import { empleadoActual, MENSAJE_SIN_PERMISOS } from "../sesion";
import { buscarEstadoVuelos } from "./data";
import type { ResultadoEstadoVuelos } from "./tipos";
import { validarFiltros } from "./validacion";

export async function buscarEstadoVuelosAction(entrada: unknown): Promise<ResultadoEstadoVuelos> {
  try {
    if (!(await empleadoActual())) return { ok: false, mensaje: MENSAJE_SIN_PERMISOS };

    const validacion = validarFiltros(entrada);
    if (!validacion.ok) return { ok: false, mensaje: validacion.mensaje, campo: validacion.campo };

    const { vuelos, hayMas, consultadoEn } = await buscarEstadoVuelos(validacion.filtros);
    return { ok: true, vuelos, hayMas, consultadoEn };
  } catch (error) {
    // No se envían detalles de la base ni de la conexión al navegador.
    console.error("Error al consultar el estado de los vuelos", error);
    return { ok: false, mensaje: "No se pudo consultar el estado de los vuelos. Por favor, reintentá más tarde." };
  }
}
