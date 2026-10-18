"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { ROL_POR_DEFECTO } from "@/lib/usuarios/tipos";
import { cancelarReservaCliente, CancelacionRechazada } from "./cancelacion";

export type ResultadoCancelacion = { ok: boolean; mensaje: string };

export async function cancelarPasaje(codigo: unknown, idPasaje?: unknown): Promise<ResultadoCancelacion> {
  try {
    const usuario = await currentUser();
    if (!usuario || usuario.banned || (usuario.publicMetadata.role ?? ROL_POR_DEFECTO) !== ROL_POR_DEFECTO) return { ok: false, mensaje: "No tiene permisos para acceder a esta sección" };
    if (typeof codigo !== "number" || !Number.isSafeInteger(codigo) || codigo <= 0 ||
      (idPasaje !== undefined && (typeof idPasaje !== "number" || !Number.isSafeInteger(idPasaje) || idPasaje <= 0))) return { ok: false, mensaje: "La reserva seleccionada no es válida" };
    const mensaje = await cancelarReservaCliente(codigo, usuario.id, idPasaje as number | undefined);
    revalidatePath("/vuelos", "layout");
    return { ok: true, mensaje };
  } catch (error) {
    if (error instanceof CancelacionRechazada) return { ok: false, mensaje: error.message };
    console.error("Error al cancelar pasaje de cliente", error);
    return { ok: false, mensaje: "No se pudo completar la cancelación. Por favor, contactá al equipo técnico." };
  }
}
