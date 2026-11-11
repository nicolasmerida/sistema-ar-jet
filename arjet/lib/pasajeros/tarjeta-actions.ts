"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { ROL_POR_DEFECTO } from "@/lib/usuarios/tipos";
import { leerDatosPago, validarPago, autorizarTarjetaSimulada, type ErroresPago } from "./pago-validacion";
import { procesarPago, PagoRechazado } from "./procesar-pago";

export type ResultadoPago = { ok: true } | { ok: false; mensaje: string; errores?: ErroresPago; resultados?: string };

export async function pagarReserva(codigo: unknown, entrada: unknown): Promise<ResultadoPago> {
  try {
    const usuario = await currentUser();
    if (!usuario || usuario.banned || (usuario.publicMetadata.role ?? ROL_POR_DEFECTO) !== ROL_POR_DEFECTO) return { ok: false, mensaje: "Iniciá sesión como pasajero para pagar la reserva." };
    if (typeof codigo !== "number" || !Number.isSafeInteger(codigo) || codigo <= 0) return { ok: false, mensaje: "La reserva seleccionada no es válida" };
    const datos = leerDatosPago(entrada);
    const errores = validarPago(datos);
    if (Object.keys(errores).length) return { ok: false, mensaje: "Revisá los campos marcados en rojo", errores };
    await procesarPago(codigo, usuario.id, autorizarTarjetaSimulada(datos));
    revalidatePath("/vuelos", "layout");
    revalidatePath("/mostrador");
    revalidatePath("/mostrador/vuelos");
    return { ok: true };
  } catch (error) {
    if (error instanceof PagoRechazado) return { ok: false, mensaje: error.message, resultados: error.resultados };
    // No registrar excepciones con argumentos que pudieran contener datos de tarjeta.
    console.error("No se pudo completar la transacción de pago simulado");
    return { ok: false, mensaje: "No se pudo completar el pago. Por favor, reintentá más tarde." };
  }
}
