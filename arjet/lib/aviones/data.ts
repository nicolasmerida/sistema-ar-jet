import "server-only";

import { db } from "@/src/prisma/db";
import { filtroViajesPendientes } from "@/lib/vuelos/data";
import type { AvionListado, DetalleAvion } from "./tipos";

export async function obtenerAviones(): Promise<AvionListado[]> {
  const aviones = await db.avion.findMany({
    orderBy: { id_avion: "asc" },
    select: {
      id_avion: true,
      matricula: true,
      modelo: true,
      capacidad_economy: true,
      capacidad_primera: true,
      estado: true,
      fecha_baja: true,
      _count: { select: { viaje: { where: filtroViajesPendientes() } } },
    },
  });

  return aviones.map((avion) => ({
    id: avion.id_avion,
    matricula: avion.matricula,
    modelo: avion.modelo,
    capacidadEconomy: avion.capacidad_economy,
    capacidadPrimera: avion.capacidad_primera,
    estado: avion.estado,
    fechaBaja: avion.fecha_baja?.toISOString() ?? null,
    vuelosVigentes: avion._count.viaje,
  }));
}

/** Datos del avión (aunque esté dado de baja) con todos los viajes que tuvo asignados. */
export async function obtenerDetalleAvion(id: number): Promise<DetalleAvion | null> {
  const avion = await db.avion.findUnique({
    where: { id_avion: id },
    select: {
      id_avion: true,
      matricula: true,
      modelo: true,
      capacidad_economy: true,
      capacidad_primera: true,
      estado: true,
      fecha_baja: true,
      viaje: {
        orderBy: { fecha_partida: "desc" },
        select: {
          id_viaje: true,
          fecha_partida: true,
          fecha_llegada: true,
          estado: true,
          historial_estados: { where: { estado_viaje: "cancelado" }, select: { motivo: true } },
          vuelo: {
            select: {
              id_vuelo: true,
              numero: true,
              aeropuerto_vuelo_origenToaeropuerto: { select: { codigo_iata: true } },
              aeropuerto_vuelo_destinoToaeropuerto: { select: { codigo_iata: true } },
            },
          },
        },
      },
    },
  });
  if (!avion) return null;

  return {
    id: avion.id_avion,
    matricula: avion.matricula,
    modelo: avion.modelo,
    capacidadEconomy: avion.capacidad_economy,
    capacidadPrimera: avion.capacidad_primera,
    estado: avion.estado,
    fechaBaja: avion.fecha_baja?.toISOString() ?? null,
    viajes: avion.viaje.map((viaje) => ({
      id: viaje.id_viaje,
      idVuelo: viaje.vuelo.id_vuelo,
      numero: viaje.vuelo.numero,
      origen: viaje.vuelo.aeropuerto_vuelo_origenToaeropuerto.codigo_iata,
      destino: viaje.vuelo.aeropuerto_vuelo_destinoToaeropuerto.codigo_iata,
      partida: viaje.fecha_partida.toISOString(),
      llegada: viaje.fecha_llegada.toISOString(),
      estado: viaje.estado,
      motivoCancelacion: viaje.historial_estados[0]?.motivo ?? null,
    })),
  };
}
