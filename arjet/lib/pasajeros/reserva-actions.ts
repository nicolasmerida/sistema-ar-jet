"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { ROL_POR_DEFECTO } from "@/lib/usuarios/tipos";
import { leerReserva, validarPasajeros, type ErroresReserva } from "./reserva-validacion";
import { registrarReserva, ReservaRechazada } from "./reserva";

export type ResultadoReserva =
  | { ok: true; codigo: number }
  | { ok: false; mensaje: string; agotado?: boolean; login?: boolean; errores?: ErroresReserva };

export async function reservarVuelo(entrada: unknown): Promise<ResultadoReserva> {
  try {
    const usuario = await currentUser();
    if (!usuario) return { ok: false, login: true, mensaje: "Iniciá sesión para reservar" };
    if (usuario.banned || (usuario.publicMetadata.role ?? ROL_POR_DEFECTO) !== ROL_POR_DEFECTO) return { ok: false, mensaje: "No tiene permisos para acceder a esta sección" };
    const datos = leerReserva(entrada);
    if (!datos) return { ok: false, mensaje: "Los datos de la reserva no son válidos" };
    const errores = validarPasajeros(datos.pasajeros);
    if (Object.keys(errores).length) return { ok: false, mensaje: "Revisá los datos de los pasajeros", errores };
    const codigo = await registrarReserva(datos, usuario.id);
    revalidatePath("/vuelos");
    return { ok: true, codigo };
  } catch (error) {
    if (error instanceof ReservaRechazada) return { ok: false, mensaje: error.message, agotado: error.agotado };
    console.error("Error al registrar reserva", error);
    return { ok: false, mensaje: "No se pudo registrar la reserva. Por favor, reintentá más tarde." };
  }
}
