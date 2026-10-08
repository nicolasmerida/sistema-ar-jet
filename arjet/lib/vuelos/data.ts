import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import { db } from "@/src/prisma/db";
import { fechaDeColumna, horaDeColumna } from "./fechas";
import type {
  DetalleVuelo,
  EstadoVuelo,
  OpcionAeropuerto,
  OpcionAvion,
  ViajeDetalle,
  VueloEditable,
  VueloListado,
} from "./tipos";

export const ANTICIPACION_MINIMA_CANCELACION_MS = 3 * 60 * 60 * 1000;
export const SIN_ANTICIPACION = "No es posible cancelar un vuelo con menos de 3 horas de anticipación";

/** Viajes que todavía no salieron y siguen en pie: son los que se editan o cancelan. */
export function filtroViajesPendientes(ahora = new Date()): Prisma.viajeWhereInput {
  return { fecha_partida: { gt: ahora }, estado: { notIn: ["cancelado", "finalizado"] } };
}

/** Las reservas canceladas o reembolsadas ya no se ven afectadas por un cambio. */
export const filtroPasajesActivos: Prisma.pasajeWhereInput = {
  pago: { estado_compra: { in: ["pendiente", "pagado"] } },
};

const seleccionVuelo = {
  id_vuelo: true,
  numero: true,
  hora_salida: true,
  hora_llegada: true,
  dias_operacion: true,
  inicio_disp: true,
  fin_disp: true,
  aeropuerto_vuelo_origenToaeropuerto: { select: { codigo_iata: true, ciudad: true } },
  aeropuerto_vuelo_destinoToaeropuerto: { select: { codigo_iata: true, ciudad: true } },
} satisfies Prisma.vueloSelect;

type FilaVuelo = Prisma.vueloGetPayload<{ select: typeof seleccionVuelo }>;

function aListado(vuelo: FilaVuelo, estado: EstadoVuelo): VueloListado {
  return {
    id: vuelo.id_vuelo,
    numero: vuelo.numero,
    origen: vuelo.aeropuerto_vuelo_origenToaeropuerto.codigo_iata,
    destino: vuelo.aeropuerto_vuelo_destinoToaeropuerto.codigo_iata,
    origenCiudad: vuelo.aeropuerto_vuelo_origenToaeropuerto.ciudad,
    destinoCiudad: vuelo.aeropuerto_vuelo_destinoToaeropuerto.ciudad,
    horaSalida: horaDeColumna(vuelo.hora_salida),
    horaLlegada: horaDeColumna(vuelo.hora_llegada),
    dias: [...vuelo.dias_operacion].sort((a, b) => a - b),
    inicio: fechaDeColumna(vuelo.inicio_disp),
    fin: fechaDeColumna(vuelo.fin_disp),
    estado,
  };
}

function estadoDelVuelo(total: number, cancelados: number, pendientes: number): EstadoVuelo {
  if (pendientes > 0) return "programado";
  if (total > 0 && cancelados === total) return "cancelado";
  return "finalizado";
}

export async function obtenerVuelos(): Promise<VueloListado[]> {
  // Las tres consultas van en paralelo: cada ida y vuelta a Neon suma latencia.
  const [vuelos, cancelados, pendientes] = await Promise.all([
    db.vuelo.findMany({
      orderBy: [{ inicio_disp: "desc" }, { numero: "asc" }],
      select: {
        ...seleccionVuelo,
        _count: { select: { viaje: true } },
      },
    }),
    contarViajesPorVuelo({ estado: "cancelado" }),
    contarViajesPorVuelo(filtroViajesPendientes()),
  ]);

  return vuelos.map((vuelo) =>
    aListado(
      vuelo,
      estadoDelVuelo(vuelo._count.viaje, cancelados.get(vuelo.id_vuelo) ?? 0, pendientes.get(vuelo.id_vuelo) ?? 0),
    ),
  );
}

async function contarViajesPorVuelo(where: Prisma.viajeWhereInput) {
  const grupos = await db.viaje.groupBy({ by: ["id_vuelo"], where, _count: { _all: true } });
  return new Map(grupos.map((grupo) => [grupo.id_vuelo, grupo._count._all]));
}

export async function obtenerDetalleVuelo(id: number, ahora = new Date()): Promise<DetalleVuelo | null> {
  const vuelo = await db.vuelo.findUnique({
    where: { id_vuelo: id },
    select: {
      ...seleccionVuelo,
      precio_economy: true,
      precio_primera: true,
      viaje: {
        orderBy: { fecha_partida: "asc" },
        select: {
          id_viaje: true,
          fecha_partida: true,
          fecha_llegada: true,
          estado: true,
          avion: { select: { matricula: true } },
          historial_estados: { where: { estado_viaje: "cancelado" }, select: { motivo: true, fecha: true } },
          _count: { select: { pasaje: { where: filtroPasajesActivos } } },
        },
      },
    },
  });
  if (!vuelo) return null;

  const viajes: ViajeDetalle[] = vuelo.viaje.map((viaje) => {
    const cancelacion = viaje.historial_estados[0];
    return {
      id: viaje.id_viaje,
      partida: viaje.fecha_partida.toISOString(),
      llegada: viaje.fecha_llegada.toISOString(),
      estado: viaje.estado,
      avion: viaje.avion.matricula,
      reservasActivas: viaje._count.pasaje,
      yaSalio: viaje.fecha_partida <= ahora,
      motivoCancelacion: cancelacion?.motivo ?? null,
      fechaCancelacion: cancelacion?.fecha.toISOString() ?? null,
      bloqueoCancelacion: bloqueoCancelacion(viaje.estado, viaje.fecha_partida, ahora),
    };
  });
  const cancelados = viajes.filter((viaje) => viaje.estado === "cancelado").length;
  const pendientes = vuelo.viaje.filter(
    (viaje) => viaje.fecha_partida > ahora && viaje.estado !== "cancelado" && viaje.estado !== "finalizado",
  ).length;

  return {
    ...aListado(vuelo, estadoDelVuelo(viajes.length, cancelados, pendientes)),
    precioEconomy: vuelo.precio_economy.toString(),
    precioPrimera: vuelo.precio_primera.toString(),
    viajes,
  };
}

/** Regla de US-11, compartida entre la pantalla y la server action. */
export function bloqueoCancelacion(estado: string, partida: Date, ahora = new Date()): string | null {
  if (estado === "cancelado") return "El viaje ya está cancelado";
  if (estado === "finalizado" || estado === "en_curso" || partida <= ahora)
    return "No se puede cancelar un viaje que ya salió";
  if (partida.getTime() - ahora.getTime() < ANTICIPACION_MINIMA_CANCELACION_MS) return SIN_ANTICIPACION;
  return null;
}

/** Datos para el formulario de edición; null si el vuelo no existe o ya no tiene viajes por salir. */
export async function obtenerVueloEditable(id: number): Promise<VueloEditable | null> {
  const vuelo = await db.vuelo.findUnique({
    where: { id_vuelo: id },
    select: {
      ...seleccionVuelo,
      origen: true,
      destino: true,
      precio_economy: true,
      precio_primera: true,
      viaje: {
        where: filtroViajesPendientes(),
        orderBy: { fecha_partida: "asc" },
        take: 1,
        select: { id_avion: true },
      },
    },
  });
  const proximo = vuelo?.viaje[0];
  if (!vuelo || !proximo) return null;

  return {
    id: vuelo.id_vuelo,
    numero: vuelo.numero,
    datos: {
      numero: vuelo.numero,
      horaSalida: horaDeColumna(vuelo.hora_salida),
      horaLlegada: horaDeColumna(vuelo.hora_llegada),
      origen: String(vuelo.origen),
      destino: String(vuelo.destino),
      dias: [...vuelo.dias_operacion].sort((a, b) => a - b),
      inicio: fechaDeColumna(vuelo.inicio_disp),
      fin: fechaDeColumna(vuelo.fin_disp),
      avion: String(proximo.id_avion),
      precioEconomy: vuelo.precio_economy.toString(),
      precioPrimera: vuelo.precio_primera.toString(),
    },
  };
}

export async function obtenerOpcionesFormulario(): Promise<{
  aeropuertos: OpcionAeropuerto[];
  aviones: OpcionAvion[];
}> {
  const [aeropuertos, aviones] = await Promise.all([
    db.aeropuerto.findMany({
      orderBy: { ciudad: "asc" },
      select: { id_aeropuerto: true, codigo_iata: true, nombre: true, ciudad: true },
    }),
    db.avion.findMany({
      orderBy: { modelo: "asc" },
      select: { id_avion: true, matricula: true, modelo: true, capacidad_economy: true, capacidad_primera: true },
    }),
  ]);

  return {
    aeropuertos: aeropuertos.map((aeropuerto) => ({
      id: aeropuerto.id_aeropuerto,
      codigo: aeropuerto.codigo_iata,
      nombre: aeropuerto.nombre,
      ciudad: aeropuerto.ciudad,
    })),
    aviones: aviones.map((avion) => ({
      id: avion.id_avion,
      matricula: avion.matricula,
      modelo: avion.modelo,
      capacidadEconomy: avion.capacidad_economy,
      capacidadPrimera: avion.capacidad_primera,
    })),
  };
}
