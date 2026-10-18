import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import { db } from "@/src/prisma/db";
import { OPCIONES_TRANSACCION } from "@/lib/vuelos/cancelacion";
import { bloqueoCancelacionPasaje } from "./cancelacion-reglas";

export class CancelacionRechazada extends Error {}

export async function cancelarEnTransaccion(tx: Prisma.TransactionClient, codigo: number, clerkId: string, idPasaje?: number) {
  const where: Prisma.pasajeWhereInput = {
    compra: codigo, ...(idPasaje === undefined ? {} : { id_pasaje: idPasaje }),
    pago: { reserva: { usuario: { clerk_id: clerkId } } },
  };
  const iniciales = await tx.pasaje.findMany({ where, select: { id_viaje: true } });
  if (!iniciales.length) throw new CancelacionRechazada("No se encontró la reserva o no tenés permisos para cancelarla");
  const viajes = [...new Set(iniciales.map((p) => p.id_viaje))].sort((a, b) => a - b);
  // Mantiene el mismo orden de bloqueo que el alta: viaje antes que compra.
  await tx.$queryRaw`SELECT id_viaje FROM viaje WHERE id_viaje = ANY(${viajes}::int[]) ORDER BY id_viaje FOR UPDATE`;
  await tx.$queryRaw`SELECT cod_compra FROM pago WHERE cod_compra = ${codigo} FOR UPDATE`;
  const pasajes = await tx.pasaje.findMany({
    where, select: { id_pasaje: true, cancelado: true, pago: { select: { estado_compra: true } }, viaje: { select: { fecha_partida: true, estado: true } } },
  });
  const activos = pasajes.filter((p) => !p.cancelado);
  if (!activos.length) throw new CancelacionRechazada("El pasaje ya está cancelado");
  const ahora = new Date();
  for (const pasaje of activos) {
    const bloqueo = bloqueoCancelacionPasaje({ cancelado: pasaje.cancelado, estadoCompra: pasaje.pago.estado_compra, estadoViaje: pasaje.viaje.estado, partida: pasaje.viaje.fecha_partida }, ahora);
    if (bloqueo) throw new CancelacionRechazada(bloqueo);
  }
  await tx.pasaje.updateMany({ where: { ...where, cancelado: false }, data: { cancelado: true, fecha_cancelacion: ahora } });
  const restantes = await tx.pasaje.count({ where: { compra: codigo, cancelado: false } });
  if (restantes === 0) await tx.pago.update({ where: { cod_compra: codigo }, data: { estado_compra: "cancelado" } });
  return idPasaje === undefined ? "Reserva cancelada correctamente" : "Pasaje cancelado correctamente";
}

export function cancelarReservaCliente(codigo: number, clerkId: string, idPasaje?: number) {
  return db.$transaction((tx) => cancelarEnTransaccion(tx, codigo, clerkId, idPasaje), { ...OPCIONES_TRANSACCION, isolationLevel: "ReadCommitted" });
}
