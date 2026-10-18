import "server-only";

import { db } from "@/src/prisma/db";
import { bloqueoCancelacionPasaje } from "./cancelacion-reglas";

export async function obtenerMisReservas(clerkId: string, ahora = new Date()) {
  const reservas = await db.reserva.findMany({
    where: { usuario: { clerk_id: clerkId } }, orderBy: { cod_compra: "desc" },
    select: { cod_compra: true, modalidad: true, pago: { select: { estado_compra: true, pasaje: {
      orderBy: { id_pasaje: "asc" }, select: {
        id_pasaje: true, cancelado: true, fecha_cancelacion: true, clase: true,
        pasajero_pasaje_pasajeroTopasajero: { select: { dni: true, nombre: true, apellido: true } },
        viaje: { select: { estado: true, fecha_partida: true, fecha_llegada: true, vuelo: { select: {
          numero: true,
          aeropuerto_vuelo_origenToaeropuerto: { select: { codigo_iata: true, ciudad: true } },
          aeropuerto_vuelo_destinoToaeropuerto: { select: { codigo_iata: true, ciudad: true } },
        } } } },
      },
    } } } },
  });
  return reservas.map((reserva) => ({
    codigo: reserva.cod_compra, modalidad: reserva.modalidad, estado: reserva.pago.estado_compra,
    pasajes: reserva.pago.pasaje.map((p) => ({
      id: p.id_pasaje, cancelado: p.cancelado || ["cancelado", "reembolsado"].includes(reserva.pago.estado_compra),
      clase: p.clase, pasajero: p.pasajero_pasaje_pasajeroTopasajero,
      numero: p.viaje.vuelo.numero, partida: p.viaje.fecha_partida.toISOString(), llegada: p.viaje.fecha_llegada.toISOString(),
      origen: p.viaje.vuelo.aeropuerto_vuelo_origenToaeropuerto, destino: p.viaje.vuelo.aeropuerto_vuelo_destinoToaeropuerto,
      estadoViaje: p.viaje.estado, fechaCancelacion: p.fecha_cancelacion?.toISOString() ?? null,
      bloqueo: bloqueoCancelacionPasaje({ cancelado: p.cancelado, estadoCompra: reserva.pago.estado_compra, estadoViaje: p.viaje.estado, partida: p.viaje.fecha_partida }, ahora),
    })),
  }));
}

export type ReservaCliente = Awaited<ReturnType<typeof obtenerMisReservas>>[number];
