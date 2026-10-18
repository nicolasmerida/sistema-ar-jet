import "server-only";

import { db } from "@/src/prisma/db";
import { filtroPasajesActivos } from "@/lib/vuelos/data";
import { columnaFecha, instanteLocal, sumarDias } from "@/lib/vuelos/fechas";
import type { OpcionAeropuerto } from "@/lib/vuelos/tipos";
import type { VueloDisponible } from "./tipos";
import { asientosDisponibles, type DatosBusqueda } from "./validacion";

export async function obtenerAeropuertosBusqueda(): Promise<OpcionAeropuerto[]> {
  const filas = await db.aeropuerto.findMany({
    where: { estado: "activo" }, orderBy: [{ ciudad: "asc" }, { codigo_iata: "asc" }],
    select: { id_aeropuerto: true, codigo_iata: true, nombre: true, ciudad: true },
  });
  return filas.map((a) => ({ id: a.id_aeropuerto, codigo: a.codigo_iata, nombre: a.nombre, ciudad: a.ciudad }));
}

export async function obtenerVuelosDisponibles(datos: DatosBusqueda, ahora = new Date()): Promise<VueloDisponible[]> {
  const dia = columnaFecha(datos.fecha).getUTCDay() || 7;
  const viajes = await db.viaje.findMany({
    where: {
      fecha_partida: { gte: instanteLocal(datos.fecha, "00:00"), lt: instanteLocal(sumarDias(datos.fecha, 1), "00:00"), gt: ahora },
      estado: { in: ["programado", "demorado"] }, avion: { estado: "activo" },
      vuelo: {
        origen: Number(datos.origen), destino: Number(datos.destino),
        inicio_disp: { lte: columnaFecha(datos.fecha) }, fin_disp: { gte: columnaFecha(datos.fecha) }, dias_operacion: { has: dia },
        aeropuerto_vuelo_origenToaeropuerto: { estado: "activo" }, aeropuerto_vuelo_destinoToaeropuerto: { estado: "activo" },
      },
    },
    orderBy: [{ fecha_partida: "asc" }, { id_viaje: "asc" }],
    select: {
      id_viaje: true, fecha_partida: true, fecha_llegada: true, estado: true,
      avion: { select: { capacidad_economy: true, capacidad_primera: true } },
      pasaje: { where: filtroPasajesActivos, select: { clase: true } },
      vuelo: { select: {
        numero: true, precio_economy: true, precio_primera: true,
        aeropuerto_vuelo_origenToaeropuerto: { select: { codigo_iata: true, ciudad: true } },
        aeropuerto_vuelo_destinoToaeropuerto: { select: { codigo_iata: true, ciudad: true } },
      } },
    },
  });
  return viajes.map((viaje) => {
    const { vuelo, avion } = viaje;
    const origen = vuelo.aeropuerto_vuelo_origenToaeropuerto;
    const destino = vuelo.aeropuerto_vuelo_destinoToaeropuerto;
    const ocupadosEconomy = viaje.pasaje.filter((p) => p.clase === "economy").length;
    return {
      id: viaje.id_viaje, numero: vuelo.numero, origen: origen.codigo_iata, destino: destino.codigo_iata,
      origenCiudad: origen.ciudad, destinoCiudad: destino.ciudad,
      partida: viaje.fecha_partida.toISOString(), llegada: viaje.fecha_llegada.toISOString(), demorado: viaje.estado === "demorado",
      economy: { precio: vuelo.precio_economy.toString(), disponibles: asientosDisponibles(avion.capacidad_economy, ocupadosEconomy) },
      primera: { precio: vuelo.precio_primera.toString(), disponibles: asientosDisponibles(avion.capacidad_primera, viaje.pasaje.length - ocupadosEconomy) },
    };
  }).filter((viaje) => viaje.economy.disponibles + viaje.primera.disponibles > 0);
}
