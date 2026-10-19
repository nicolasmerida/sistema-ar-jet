"use server";

import { MENSAJE_ERROR_CHECKIN, MENSAJE_TICKET_INVALIDO } from "./checkin-reglas";
import { buscarReservas, registrarCheckinPasaje } from "./data";
import { empleadoActual, MENSAJE_SIN_PERMISOS } from "./sesion";
import type { ResultadoBusqueda, ResultadoCheckin } from "./tipos";
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

export async function registrarCheckinAction(entrada: unknown): Promise<ResultadoCheckin> {
  try {
    if (!(await empleadoActual())) return { ok: false, mensaje: MENSAJE_SIN_PERMISOS };

    const datos = typeof entrada === "object" && entrada !== null ? (entrada as Record<string, unknown>) : {};
    const idPasaje = datos.idPasaje;
    const dniPasajero = typeof datos.dniPasajero === "string" ? datos.dniPasajero.trim() : undefined;

    if (
      typeof idPasaje !== "number" ||
      !Number.isInteger(idPasaje) ||
      idPasaje <= 0 ||
      idPasaje > 2147483647
    ) {
      return { ok: false, mensaje: MENSAJE_TICKET_INVALIDO };
    }

    return await registrarCheckinPasaje(idPasaje, dniPasajero);
  } catch (error) {
    console.error("Error al registrar check-in desde mostrador", error);
    return { ok: false, mensaje: MENSAJE_ERROR_CHECKIN };
  }
}
