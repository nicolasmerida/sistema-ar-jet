import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import { db } from "@/src/prisma/db";
import { filtroPasajesActivos } from "@/lib/vuelos/data";
import { instanteLocal, sumarDias } from "@/lib/vuelos/fechas";
import type { OpcionAeropuerto } from "@/lib/vuelos/tipos";
import { estadoActual, porcentajeOcupacion } from "./estado";
import type { Ocupacion, VueloEnEstado } from "./tipos";
import type { FiltrosValidos } from "./validacion";

const LIMITE_VUELOS = 100;

/** Se ofrecen todos los aeropuertos, también los dados de baja: sus viajes figuran cancelados. */
export async function obtenerAeropuertosFiltro(): Promise<OpcionAeropuerto[]> {
  const aeropuertos = await db.aeropuerto.findMany({
    orderBy: { ciudad: "asc" },
    select: { id_aeropuerto: true, codigo_iata: true, nombre: true, ciudad: true },
  });
  const opciones: OpcionAeropuerto[] = [];
  for (const aeropuerto of aeropuertos) {
    opciones.push({
      id: aeropuerto.id_aeropuerto,
      codigo: aeropuerto.codigo_iata,
      nombre: aeropuerto.nombre,
      ciudad: aeropuerto.ciudad,
    });
  }
  return opciones;
}

function ocupacion(ocupados: number, capacidad: number): Ocupacion {
  return { ocupados, capacidad, porcentaje: porcentajeOcupacion(ocupados, capacidad) };
}

/** Siempre lee de la base: lo que el administrador cambia se ve en la próxima consulta. */
export async function buscarEstadoVuelos(filtros: FiltrosValidos, ahora = new Date()) {
  const vuelo: Prisma.vueloWhereInput = {};
  if (filtros.origen !== null) vuelo.origen = filtros.origen;
  if (filtros.destino !== null) vuelo.destino = filtros.destino;
  if (filtros.numero) vuelo.numero = { contains: filtros.numero, mode: "insensitive" };

  const where: Prisma.viajeWhereInput = {
    fecha_partida: {
      gte: instanteLocal(filtros.fecha, "00:00"),
      lt: instanteLocal(sumarDias(filtros.fecha, 1), "00:00"),
    },
    ...(Object.keys(vuelo).length > 0 ? { vuelo } : {}),
  };

  const viajes = await db.viaje.findMany({
    where,
    orderBy: [{ fecha_partida: "asc" }, { id_viaje: "asc" }],
    take: LIMITE_VUELOS + 1,
    select: {
      id_viaje: true,
      fecha_partida: true,
      fecha_llegada: true,
      estado: true,
      avion: { select: { capacidad_economy: true, capacidad_primera: true } },
      vuelo: {
        select: {
          numero: true,
          aeropuerto_vuelo_origenToaeropuerto: { select: { codigo_iata: true, ciudad: true } },
          aeropuerto_vuelo_destinoToaeropuerto: { select: { codigo_iata: true, ciudad: true } },
        },
      },
      historial_estados: {
        where: { estado_viaje: { in: ["cancelado", "demorado"] } },
        select: { estado_viaje: true, motivo: true },
      },
    },
  });

  const hayMas = viajes.length > LIMITE_VUELOS;
  const mostrados = viajes.slice(0, LIMITE_VUELOS);

  // Pasajes activos por viaje y clase, en una sola consulta.
  const ocupados = new Map<string, number>();
  if (mostrados.length > 0) {
    const ids: number[] = [];
    for (const viaje of mostrados) ids.push(viaje.id_viaje);
    const grupos = await db.pasaje.groupBy({
      by: ["id_viaje", "clase"],
      where: { ...filtroPasajesActivos, id_viaje: { in: ids } },
      _count: { _all: true },
    });
    for (const grupo of grupos) ocupados.set(`${grupo.id_viaje}:${grupo.clase}`, grupo._count._all);
  }

  const vuelos: VueloEnEstado[] = [];
  for (const viaje of mostrados) {
    const estado = estadoActual(viaje.estado, viaje.fecha_partida, viaje.fecha_llegada, ahora);
    let motivo: string | null = null;
    for (const registro of viaje.historial_estados) {
      if (registro.estado_viaje === viaje.estado) motivo = registro.motivo;
    }
    vuelos.push({
      id: viaje.id_viaje,
      numero: viaje.vuelo.numero,
      origen: viaje.vuelo.aeropuerto_vuelo_origenToaeropuerto,
      destino: viaje.vuelo.aeropuerto_vuelo_destinoToaeropuerto,
      partida: viaje.fecha_partida.toISOString(),
      llegada: viaje.fecha_llegada.toISOString(),
      estado,
      motivo: estado === "cancelado" || estado === "demorado" ? motivo : null,
      economy: ocupacion(ocupados.get(`${viaje.id_viaje}:economy`) ?? 0, viaje.avion.capacidad_economy),
      primera: ocupacion(ocupados.get(`${viaje.id_viaje}:primera`) ?? 0, viaje.avion.capacidad_primera),
    });
  }

  return { vuelos, hayMas, consultadoEn: ahora.toISOString() };
}
