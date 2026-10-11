import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import { db } from "@/src/prisma/db";
import { SIN_ANTICIPACION, bloqueoCancelacion, filtroPasajesActivos, filtroViajesEnPie } from "./data";
import type { ResumenBaja, ViajeBloqueante } from "./tipos";

type Cliente = Prisma.TransactionClient | typeof db;

/** Varias consultas por transacción contra Neon superan el límite por defecto de 5 s. */
export const OPCIONES_TRANSACCION = { maxWait: 10_000, timeout: 20_000 };

/** La baja se rechaza entera: lanzado dentro de la transacción, revierte el cambio de estado. */
export class BajaBloqueada extends Error {
  constructor(public bloqueantes: ViajeBloqueante[]) {
    super("Hay viajes que no se pueden cancelar");
  }
}

/**
 * Cancela los viajes en pie que cumplen `where` y deja el motivo en el historial.
 * La condición sobre el estado evita cancelar dos veces en pedidos simultáneos.
 */
export async function cancelarViajesEnTx(tx: Prisma.TransactionClient, where: Prisma.viajeWhereInput, motivo: string) {
  const viajes = await tx.viaje.findMany({
    where: { ...where, estado: { notIn: ["cancelado", "finalizado"] } },
    select: { id_viaje: true, id_vuelo: true },
  });
  const ids = viajes.map((viaje) => viaje.id_viaje);
  if (ids.length === 0) return { viajes: 0, vuelos: 0, reservas: 0 };

  const cancelados = await tx.viaje.updateMany({
    where: { id_viaje: { in: ids }, estado: { notIn: ["cancelado", "finalizado"] } },
    data: { estado: "cancelado" },
  });
  await tx.$executeRaw`
    INSERT INTO estado (id_viaje, estado_viaje, motivo, fecha)
    SELECT id, 'cancelado'::estado_viaje_t, ${motivo}, now() FROM unnest(${ids}::int[]) AS id
    ON CONFLICT (id_viaje, estado_viaje) DO UPDATE SET motivo = EXCLUDED.motivo, fecha = EXCLUDED.fecha`;
  // TODO: notificar por email y marcar las compras como afectadas cuando existan esos módulos.
  const reservas = await tx.pasaje.count({ where: { id_viaje: { in: ids }, ...filtroPasajesActivos } });

  return { viajes: cancelados.count, vuelos: new Set(viajes.map((viaje) => viaje.id_vuelo)).size, reservas };
}

/**
 * Qué pasaría al dar de baja: los viajes en pie (incluidos los que están volando) y cuáles
 * de ellos no se pueden cancelar según la regla de US-11.
 */
export async function analizarBaja(cliente: Cliente, where: Prisma.viajeWhereInput, ahora = new Date()): Promise<ResumenBaja> {
  const viajes = await cliente.viaje.findMany({
    where: { ...where, ...filtroViajesEnPie(ahora) },
    orderBy: { fecha_partida: "asc" },
    select: {
      id_vuelo: true,
      estado: true,
      fecha_partida: true,
      vuelo: { select: { numero: true } },
      _count: { select: { pasaje: { where: filtroPasajesActivos } } },
    },
  });

  const bloqueantes: ViajeBloqueante[] = [];
  for (const viaje of viajes) {
    const bloqueo = bloqueoCancelacion(viaje.estado, viaje.fecha_partida, ahora);
    if (bloqueo) {
      bloqueantes.push({
        numero: viaje.vuelo.numero,
        partida: viaje.fecha_partida.toISOString(),
        motivo: bloqueo === SIN_ANTICIPACION ? "sale en menos de 3 h" : "ya salió y todavía no llegó",
      });
    }
  }

  return {
    vuelos: new Set(viajes.map((viaje) => viaje.id_vuelo)).size,
    viajes: viajes.length,
    reservas: viajes.reduce((total, viaje) => total + viaje._count.pasaje, 0),
    bloqueantes,
  };
}

/** Pasos 2 a 4 de la baja: verifica que todo se pueda cancelar y lo cancela. */
export async function cancelarViajesPorBaja(tx: Prisma.TransactionClient, where: Prisma.viajeWhereInput, motivo: string) {
  const ahora = new Date();
  const { bloqueantes } = await analizarBaja(tx, where, ahora);
  if (bloqueantes.length > 0) throw new BajaBloqueada(bloqueantes);
  // Sin bloqueantes, todos los viajes en pie salen en más de 3 h: son los pendientes.
  return cancelarViajesEnTx(tx, { ...where, fecha_partida: { gt: ahora } }, motivo);
}

/** "Aeropuerto BHI dado de baja. Se cancelaron 12 viajes de 3 vuelos (8 reservas afectadas)" */
export function mensajeBaja(sujeto: string, cancelacion: { viajes: number; vuelos: number; reservas: number }) {
  if (cancelacion.viajes === 0) return `${sujeto} dado de baja correctamente`;
  const viajes = cancelacion.viajes === 1 ? "1 viaje" : `${cancelacion.viajes} viajes`;
  const vuelos = cancelacion.vuelos === 1 ? "1 vuelo" : `${cancelacion.vuelos} vuelos`;
  const reservas = cancelacion.reservas === 1 ? "1 reserva afectada" : `${cancelacion.reservas} reservas afectadas`;
  return `${sujeto} dado de baja. Se cancelaron ${viajes} de ${vuelos} (${reservas})`;
}
