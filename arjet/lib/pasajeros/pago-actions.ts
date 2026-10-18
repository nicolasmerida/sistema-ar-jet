"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { ROL_POR_DEFECTO } from "@/lib/usuarios/tipos";
import { guardarModalidad, type ResultadoConfirmacion } from "./pago";

export async function confirmarReserva(codigo: unknown, modalidad: unknown): Promise<ResultadoConfirmacion> {
  try {
    const usuario = await currentUser();
    if (!usuario || usuario.banned || (usuario.publicMetadata.role ?? ROL_POR_DEFECTO) !== ROL_POR_DEFECTO) {
      return { ok: false, mensaje: "Iniciá sesión como pasajero para confirmar la reserva." };
    }
    if (typeof codigo !== "number" || !Number.isSafeInteger(codigo) || codigo <= 0 || (modalidad !== "tarjeta" && modalidad !== "mostrador")) {
      return { ok: false, mensaje: "Seleccioná una opción válida para confirmar la reserva." };
    }
    const resultado = await guardarModalidad(codigo, usuario.id, modalidad);
    if (resultado.ok) revalidatePath(`/vuelos/reservas/${codigo}`);
    return resultado;
  } catch (error) {
    console.error("Error al confirmar modalidad de reserva", error);
    return { ok: false, mensaje: "No se pudo confirmar la reserva. Por favor, reintentá más tarde." };
  }
}
