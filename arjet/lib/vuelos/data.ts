import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import { db } from "@/src/prisma/db";
import { fechaDeColumna, horaDeColumna } from "./fechas";
import type {
  DetalleVuelo,
  EstadoViaje,
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

/** Viajes que todavía no llegaron y siguen en pie: incluye los que están volando. */
export function filtroViajesEnPie(ahora = new Date()): Prisma.viajeWhereInput {
  return { fecha_llegada: { gt: ahora }, estado: { notIn: ["cancelado", "finalizado"] } };
}

/** Un vuelo está vigente si le queda al menos un viaje por salir sin cancelar. */
export function filtroVueloVigente(ahora = new Date()): Prisma.vueloWhereInput {
  return { viaje: { some: filtroViajesPendientes(ahora) } };
}

/** Las reservas canceladas o reembolsadas ya no se ven afectadas por un cambio. */
export const filtroPasajesActivos: Prisma.pasajeWhereInput = {
  pago: { estado_compra: { in: ["pendiente", "pagado"] } },
};

const seleccionAeropuerto = { select: { codigo_iata: true, ciudad: true, estado: true } } as const;

const seleccionVuelo = {
  id_vuelo: true,
  numero: true,
  hora_salida: true,
  hora_llegada: true,
  llega_dia_siguiente: true,
  dias_operacion: true,
  inicio_disp: true,
  fin_disp: true,
  aeropuerto_vuelo_origenToaeropuerto: seleccionAeropuerto,
  aeropuerto_vuelo_destinoToaeropuerto: seleccionAeropuerto,
} satisfies Prisma.vueloSelect;

type FilaVuelo = Prisma.vueloGetPayload<{ select: typeof seleccionVuelo }>;

function aListado(vuelo: FilaVuelo, estado: EstadoVuelo, motivoCancelacion: string | null): VueloListado {
  const origen = vuelo.aeropuerto_vuelo_origenToaeropuerto;
  const destino = vuelo.aeropuerto_vuelo_destinoToaeropuerto;
  return {
    id: vuelo.id_vuelo,
    numero: vuelo.numero,
    origen: origen.codigo_iata,
    destino: destino.codigo_iata,
    origenCiudad: origen.ciudad,
    destinoCiudad: destino.ciudad,
    horaSalida: horaDeColumna(vuelo.hora_salida),
    horaLlegada: horaDeColumna(vuelo.hora_llegada),
    llegaDiaSiguiente: vuelo.llega_dia_siguiente,
    dias: [...vuelo.dias_operacion].sort((a, b) => a - b),
    inicio: fechaDeColumna(vuelo.inicio_disp),
    fin: fechaDeColumna(vuelo.fin_disp),
    estado,
    origenDeBaja: origen.estado === "de_baja",
    destinoDeBaja: destino.estado === "de_baja",
    motivoCancelacion: estado === "cancelado" ? motivoCancelacion : null,
  };
}

/**
 * Sin viajes por salir, el vuelo está cancelado si su último viaje se canceló (por ejemplo,
 * por la baja de un aeropuerto o avión); si no, terminó de operar.
 */
function estadoDelVuelo(pendientes: number, ultimoViaje: EstadoViaje | undefined): EstadoVuelo {
  if (pendientes > 0) return "programado";
  if (ultimoViaje === "cancelado") return "cancelado";
  return "finalizado";
}

export async function obtenerVuelos(where: Prisma.vueloWhereInput = {}): Promise<VueloListado[]> {
  const vuelos = await db.vuelo.findMany({
    where,
    orderBy: [{ inicio_disp: "desc" }, { numero: "asc" }],
    select: {
      ...seleccionVuelo,
      _count: { select: { viaje: { where: filtroViajesPendientes() } } },
      // El último viaje define si el vuelo terminó cancelado o finalizado.
      viaje: {
        orderBy: { fecha_partida: "desc" },
        take: 1,
        select: { estado: true, historial_estados: { where: { estado_viaje: "cancelado" }, select: { motivo: true } } },
      },
    },
  });

  return vuelos.map((vuelo) => {
    const ultimo = vuelo.viaje[0];
    return aListado(
      vuelo,
      estadoDelVuelo(vuelo._count.viaje, ultimo?.estado),
      ultimo?.historial_estados[0]?.motivo ?? null,
    );
  });
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
          avion: { select: { matricula: true, estado: true } },
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
      avionDeBaja: viaje.avion.estado === "de_baja",
      reservasActivas: viaje._count.pasaje,
      yaSalio: viaje.fecha_partida <= ahora,
      motivoCancelacion: cancelacion?.motivo ?? null,
      fechaCancelacion: cancelacion?.fecha.toISOString() ?? null,
      bloqueoCancelacion: bloqueoCancelacion(viaje.estado, viaje.fecha_partida, ahora),
    };
  });
  const pendientes = vuelo.viaje.filter(
    (viaje) => viaje.fecha_partida > ahora && viaje.estado !== "cancelado" && viaje.estado !== "finalizado",
  ).length;
  const ultimo = viajes.at(-1);

  return {
    ...aListado(vuelo, estadoDelVuelo(pendientes, ultimo?.estado), ultimo?.motivoCancelacion ?? null),
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
      llegaDiaSiguiente: vuelo.llega_dia_siguiente,
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

/** Lo dado de baja no se ofrece para crear ni editar vuelos. */
export async function obtenerOpcionesFormulario(): Promise<{
  aeropuertos: OpcionAeropuerto[];
  aviones: OpcionAvion[];
}> {
  const [aeropuertos, aviones] = await Promise.all([
    db.aeropuerto.findMany({
      where: { estado: "activo" },
      orderBy: { ciudad: "asc" },
      select: { id_aeropuerto: true, codigo_iata: true, nombre: true, ciudad: true },
    }),
    db.avion.findMany({
      where: { estado: "activo" },
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
