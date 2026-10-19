"use server";

import { buscarReservas } from "./data";
import { empleadoActual, MENSAJE_SIN_PERMISOS } from "./sesion";
import type { ResultadoBusqueda } from "./tipos";
import { validarBusqueda } from "./validacion";

export async function buscarReservasAction(entrada: unknown): Promise<ResultadoBusqueda> {
  try {
    if (!(await empleadoActual())) return { ok: false, mensaje: MENSAJE_SIN_PERMISOS };

    const datos = typeof entrada === "object" && entrada !== null ? (entrada as Record<string, unknown>) : {};
    const validacion = validarBusqueda(datos.criterio, datos.valor, datos.filtro);
    if (!validacion.ok) return { ok: false, mensaje: validacion.mensaje, campo: validacion.campo };

    const { reservas, hayMas } = await buscarReservas(validacion.busqueda);
    return { ok: true, reservas, hayMas };
  } catch (error) {
    // No se envían detalles de la base ni de la conexión al navegador.
    console.error("Error al consultar reservas desde mostrador", error);
    return { ok: false, mensaje: "No se pudo realizar la búsqueda. Por favor, reintentá más tarde." };
  }
}
