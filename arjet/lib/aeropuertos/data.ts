import "server-only";
import { db } from "@/src/prisma/db";
import { filtroViajesPendientes, filtroVueloVigente, obtenerVuelos } from "@/lib/vuelos/data";
import { horaDeColumna } from "@/lib/vuelos/fechas";
import type { EstadoRegistro, VueloListado } from "@/lib/vuelos/tipos";

/** Vuelo vigente visto desde un aeropuerto, para el tooltip del listado. */
export type VueloDeAeropuerto = {
  id: number;
  numero: string;
  sentido: "salida" | "llegada";
  /** Código IATA del otro extremo. */
  otroAeropuerto: string;
  horaSalida: string;
  horaLlegada: string;
  llegaDiaSiguiente: boolean;
  dias: number[];
  /** ISO del próximo viaje pendiente. */
  proximoViaje: string | null;
};

export type AeropuertoListado = {
  id: number;
  codigo: string;
  nombre: string;
  ciudad: string;
  pais: string;
  direccion: string;
  descripcion: string;
  estado: EstadoRegistro;
  fechaBaja: string | null;
  vuelosVigentes: number;
  vuelosVigentesDetalle: VueloDeAeropuerto[];
};

export type DetalleAeropuerto = Omit<AeropuertoListado, "vuelosVigentes" | "vuelosVigentesDetalle"> & {
  vigentes: VueloListado[];
  /** Todos los vuelos que tuvo, incluidos los cancelados por la baja. */
  historial: VueloListado[];
};

const seleccionAeropuerto = {
  id_aeropuerto: true,
  codigo_iata: true,
  nombre: true,
  ciudad: true,
  pais: true,
  direccion: true,
  descripcion: true,
  estado: true,
  fecha_baja: true,
} as const;

type FilaAeropuerto = {
  id_aeropuerto: number;
  codigo_iata: string;
  nombre: string;
  ciudad: string;
  pais: string | null;
  direccion: string | null;
  descripcion: string | null;
  estado: EstadoRegistro;
  fecha_baja: Date | null;
};

function datosAeropuerto(aeropuerto: FilaAeropuerto) {
  return {
    id: aeropuerto.id_aeropuerto,
    codigo: aeropuerto.codigo_iata,
    nombre: aeropuerto.nombre,
    ciudad: aeropuerto.ciudad,
    // En la base son columnas opcionales; el formulario las exige.
    pais: aeropuerto.pais ?? "",
    direccion: aeropuerto.direccion ?? "",
    descripcion: aeropuerto.descripcion ?? "",
    estado: aeropuerto.estado,
    fechaBaja: aeropuerto.fecha_baja?.toISOString() ?? null,
  };
}

export async function obtenerAeropuertos(): Promise<AeropuertoListado[]> {
  const ahora = new Date();
  // Dos consultas en total: los vuelos vigentes se traen una vez y se agrupan en memoria
  // (no una consulta por aeropuerto). El volumen es chico y así el tooltip no espera a la base.
  const [aeropuertos, vuelos] = await Promise.all([
    db.aeropuerto.findMany({ orderBy: { codigo_iata: "asc" }, select: seleccionAeropuerto }),
    db.vuelo.findMany({
      where: filtroVueloVigente(ahora),
      orderBy: [{ hora_salida: "asc" }, { numero: "asc" }],
      select: {
        id_vuelo: true,
        numero: true,
        origen: true,
        destino: true,
        hora_salida: true,
        hora_llegada: true,
        llega_dia_siguiente: true,
        dias_operacion: true,
        aeropuerto_vuelo_origenToaeropuerto: { select: { codigo_iata: true } },
        aeropuerto_vuelo_destinoToaeropuerto: { select: { codigo_iata: true } },
        viaje: {
          where: filtroViajesPendientes(ahora),
          orderBy: { fecha_partida: "asc" },
          take: 1,
          select: { fecha_partida: true },
        },
      },
    }),
  ]);

  const porAeropuerto = new Map<number, VueloDeAeropuerto[]>();
  for (const vuelo of vuelos) {
    const comun = {
      id: vuelo.id_vuelo,
      numero: vuelo.numero,
      horaSalida: horaDeColumna(vuelo.hora_salida),
      horaLlegada: horaDeColumna(vuelo.hora_llegada),
      llegaDiaSiguiente: vuelo.llega_dia_siguiente,
      dias: [...vuelo.dias_operacion].sort((a, b) => a - b),
      proximoViaje: vuelo.viaje[0]?.fecha_partida.toISOString() ?? null,
    };
    // Origen y destino de un vuelo siempre son distintos, así que no se cuenta dos veces.
    agregar(porAeropuerto, vuelo.origen, {
      ...comun,
      sentido: "salida",
      otroAeropuerto: vuelo.aeropuerto_vuelo_destinoToaeropuerto.codigo_iata,
    });
    agregar(porAeropuerto, vuelo.destino, {
      ...comun,
      sentido: "llegada",
      otroAeropuerto: vuelo.aeropuerto_vuelo_origenToaeropuerto.codigo_iata,
    });
  }

  return aeropuertos.map((aeropuerto) => {
    const detalle = porAeropuerto.get(aeropuerto.id_aeropuerto) ?? [];
    return {
      ...datosAeropuerto(aeropuerto),
      vuelosVigentes: detalle.length,
      vuelosVigentesDetalle: detalle,
    };
  });
}

function agregar(mapa: Map<number, VueloDeAeropuerto[]>, id: number, vuelo: VueloDeAeropuerto) {
  const lista = mapa.get(id);
  if (lista) lista.push(vuelo);
  else mapa.set(id, [vuelo]);
}

/** Datos del aeropuerto (aunque esté dado de baja) con sus vuelos vigentes e historial. */
export async function obtenerDetalleAeropuerto(id: number): Promise<DetalleAeropuerto | null> {
  const [aeropuerto, historial] = await Promise.all([
    db.aeropuerto.findUnique({ where: { id_aeropuerto: id }, select: seleccionAeropuerto }),
    obtenerVuelos({ OR: [{ origen: id }, { destino: id }] }),
  ]);
  if (!aeropuerto) return null;

  return {
    ...datosAeropuerto(aeropuerto),
    vigentes: historial.filter((vuelo) => vuelo.estado === "programado"),
    historial,
  };
}
