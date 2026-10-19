import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import { db } from "@/src/prisma/db";
import {
  bloqueoCheckinPasaje,
  MENSAJE_CHECKIN_EXITO,
  MENSAJE_TICKET_INVALIDO,
  MENSAJE_YA_PRESENTADO,
} from "./checkin-reglas";
import type { ReservaEncontrada, ResultadoCheckin } from "./tipos";
import type { BusquedaValida } from "./validacion";

const LIMITE_RESULTADOS = 50;

function condicionBusqueda(busqueda: BusquedaValida): Prisma.reservaWhereInput {
  switch (busqueda.criterio) {
    case "codigo":
      return { cod_compra: busqueda.codigo };
    case "dni":
      // Coincide con un pasajero de la reserva o con quien la hizo (el titular).
      return {
        OR: [
          { pago: { pasaje: { some: { pasajero: busqueda.dni } } } },
          { dni_usuario: busqueda.dni },
        ],
      };
    case "nombre":
      // Todas las palabras deben coincidir con el mismo pasajero, en nombre o apellido,
      // sin importar el orden ("Juan Pérez" o "Pérez Juan").
      return {
        pago: {
          pasaje: {
            some: {
              pasajero_pasaje_pasajeroTopasajero: {
                AND: busqueda.palabras.map((palabra) => ({
                  OR: [
                    { nombre: { contains: palabra, mode: "insensitive" as const } },
                    { apellido: { contains: palabra, mode: "insensitive" as const } },
                  ],
                })),
              },
            },
          },
        },
      };
  }
}

export async function buscarReservas(busqueda: BusquedaValida) {
  const condiciones: Prisma.reservaWhereInput[] = [condicionBusqueda(busqueda)];
  if (busqueda.filtro === "pendientes") {
    condiciones.push({ pago: { estado_compra: "pendiente" } });
  }

  const reservas = await db.reserva.findMany({
    where: { AND: condiciones },
    orderBy: { cod_compra: "desc" },
    take: LIMITE_RESULTADOS + 1,
    select: {
      cod_compra: true,
      modalidad: true,
      usuario: { select: { dni: true, nombre: true, apellido: true } },
      pago: {
        select: {
          estado_compra: true,
          pasaje: {
            orderBy: { id_pasaje: "asc" },
            select: {
              id_pasaje: true,
              cancelado: true,
              presentado: true,
              fecha_checkin: true,
              clase: true,
              pasajero_pasaje_pasajeroTopasajero: { select: { dni: true, nombre: true, apellido: true } },
              viaje: {
                select: {
                  estado: true,
                  fecha_partida: true,
                  fecha_llegada: true,
                  vuelo: {
                    select: {
                      numero: true,
                      aeropuerto_vuelo_origenToaeropuerto: { select: { codigo_iata: true, ciudad: true } },
                      aeropuerto_vuelo_destinoToaeropuerto: { select: { codigo_iata: true, ciudad: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const hayMas = reservas.length > LIMITE_RESULTADOS;
  const resultado: ReservaEncontrada[] = reservas.slice(0, LIMITE_RESULTADOS).map((reserva) => ({
    codigo: reserva.cod_compra,
    modalidad: reserva.modalidad,
    estado: reserva.pago.estado_compra,
    titular: reserva.usuario,
    pasajes: reserva.pago.pasaje.map((pasaje) => ({
      id: pasaje.id_pasaje,
      cancelado: pasaje.cancelado || ["cancelado", "reembolsado"].includes(reserva.pago.estado_compra),
      presentado: pasaje.presentado,
      fechaCheckin: pasaje.fecha_checkin ? pasaje.fecha_checkin.toISOString() : null,
      clase: pasaje.clase,
      pasajero: pasaje.pasajero_pasaje_pasajeroTopasajero,
      numero: pasaje.viaje.vuelo.numero,
      partida: pasaje.viaje.fecha_partida.toISOString(),
      llegada: pasaje.viaje.fecha_llegada.toISOString(),
      origen: pasaje.viaje.vuelo.aeropuerto_vuelo_origenToaeropuerto,
      destino: pasaje.viaje.vuelo.aeropuerto_vuelo_destinoToaeropuerto,
      estadoViaje: pasaje.viaje.estado,
    })),
  }));

  return { reservas: resultado, hayMas };
}

export async function registrarCheckinPasaje(
  idPasaje: number,
  dniPasajero?: string,
): Promise<ResultadoCheckin> {
  return db.$transaction(async (tx): Promise<ResultadoCheckin> => {
    const pasaje = await tx.pasaje.findUnique({
      where: { id_pasaje: idPasaje },
      select: {
        id_pasaje: true,
        pasajero: true,
        cancelado: true,
        presentado: true,
        pago: { select: { estado_compra: true } },
        viaje: { select: { estado: true } },
      },
    });

    if (!pasaje || (dniPasajero !== undefined && pasaje.pasajero !== dniPasajero)) {
      return { ok: false, mensaje: MENSAJE_TICKET_INVALIDO };
    }

    const bloqueo = bloqueoCheckinPasaje({
      cancelado: pasaje.cancelado,
      presentado: pasaje.presentado,
      estadoCompra: pasaje.pago.estado_compra,
      estadoViaje: pasaje.viaje.estado,
    });
    if (bloqueo) {
      return { ok: false, mensaje: bloqueo };
    }

    const ahora = new Date();
    const actualizado = await tx.pasaje.updateMany({
      where: {
        id_pasaje: idPasaje,
        presentado: false,
        cancelado: false,
        pago: { estado_compra: "pagado" },
      },
      data: {
        presentado: true,
        fecha_checkin: ahora,
      },
    });

    if (actualizado.count === 0) {
      return { ok: false, mensaje: MENSAJE_YA_PRESENTADO };
    }

    return {
      ok: true,
      mensaje: MENSAJE_CHECKIN_EXITO,
      fechaCheckin: ahora.toISOString(),
    };
  });
}
