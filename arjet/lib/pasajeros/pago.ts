import "server-only";

import { db } from "@/src/prisma/db";

export type ModalidadReserva = "tarjeta" | "mostrador";
export type ResultadoConfirmacion = { ok: true } | { ok: false; mensaje: string };

export async function guardarModalidad(codigo: number, clerkId: string, modalidad: ModalidadReserva): Promise<ResultadoConfirmacion> {
  const resultado = await db.reserva.updateMany({
    where: {
      cod_compra: codigo, usuario: { clerk_id: clerkId }, modalidad: null,
      pago: {
        estado_compra: "pendiente",
        pasaje: { some: { cancelado: false }, every: { OR: [{ cancelado: true }, { viaje: { estado: { in: ["programado", "demorado"] }, fecha_partida: { gt: new Date() } } }] } },
      },
    },
    data: { modalidad },
  });
  if (resultado.count === 1) return { ok: true };
  // Repetir una confirmación no crea otra reserva ni vuelve a descontar asientos.
  const existente = await db.reserva.findFirst({
    where: { cod_compra: codigo, usuario: { clerk_id: clerkId } },
    select: { modalidad: true },
  });
  if (existente?.modalidad === modalidad) return { ok: true };
  return { ok: false, mensaje: "No se pudo confirmar esta reserva. Actualizá la página para consultar su estado." };
}
