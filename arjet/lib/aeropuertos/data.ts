import "server-only";
import { db } from "@/src/prisma/db";

export type AeropuertoListado = {
  id: number;
  codigo: string;
  nombre: string;
  ciudad: string;
  pais: string;
  direccion: string;
  vuelosVigentes: number;
};

// Un vuelo está vigente mientras su período de disponibilidad no haya terminado.
function filtroVueloVigente() {
  const hoy = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });

  return { fin_disp: { gte: new Date(hoy) } };
}

export async function obtenerAeropuertos(): Promise<AeropuertoListado[]> {
  const vigente = filtroVueloVigente();
  const aeropuertos = await db.aeropuerto.findMany({
    orderBy: { codigo_iata: "asc" },
    select: {
      id_aeropuerto: true,
      codigo_iata: true,
      nombre: true,
      ciudad: true,
      pais: true,
      direccion: true,
      _count: {
        select: {
          vuelo_vuelo_origenToaeropuerto: { where: vigente },
          vuelo_vuelo_destinoToaeropuerto: { where: vigente },
        },
      },
    },
  });

  // Origen y destino de un vuelo siempre son distintos, así que no se cuentan dos veces.
  return aeropuertos.map((aeropuerto) => ({
    id: aeropuerto.id_aeropuerto,
    codigo: aeropuerto.codigo_iata,
    nombre: aeropuerto.nombre,
    ciudad: aeropuerto.ciudad,
    // En la base son columnas opcionales; el formulario las exige.
    pais: aeropuerto.pais ?? "",
    direccion: aeropuerto.direccion ?? "",
    vuelosVigentes:
      aeropuerto._count.vuelo_vuelo_origenToaeropuerto +
      aeropuerto._count.vuelo_vuelo_destinoToaeropuerto,
  }));
}

export async function contarVuelosVigentes(idAeropuerto: number) {
  return db.vuelo.count({
    where: {
      ...filtroVueloVigente(),
      OR: [{ origen: idAeropuerto }, { destino: idAeropuerto }],
    },
  });
}
