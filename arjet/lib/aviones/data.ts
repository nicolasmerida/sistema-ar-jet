import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import { db } from "@/src/prisma/db";
import type { AvionListado } from "./tipos";

export function filtroViajesVigentes(ahora = new Date()): Prisma.viajeWhereInput {
  return {
    fecha_llegada: { gte: ahora },
    estado: { notIn: ["cancelado", "finalizado"] },
  };
}

export async function obtenerAviones(): Promise<AvionListado[]> {
  const aviones = await db.avion.findMany({
    orderBy: { id_avion: "asc" },
    select: {
      id_avion: true,
      matricula: true,
      modelo: true,
      capacidad_economy: true,
      capacidad_primera: true,
      _count: { select: { viaje: { where: filtroViajesVigentes() } } },
    },
  });

  return aviones.map((avion) => ({
    id: avion.id_avion,
    matricula: avion.matricula,
    modelo: avion.modelo,
    capacidadEconomy: avion.capacidad_economy,
    capacidadPrimera: avion.capacidad_primera,
    vuelosVigentes: avion._count.viaje,
  }));
}
