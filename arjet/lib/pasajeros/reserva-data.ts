import "server-only";

import { db } from "@/src/prisma/db";
import { fechaLocal } from "@/lib/vuelos/fechas";
import { obtenerVuelosDisponibles } from "./data";

export async function obtenerVueloReserva(id: number) {
  const viaje = await db.viaje.findUnique({
    where: { id_viaje: id }, select: { fecha_partida: true, vuelo: { select: { origen: true, destino: true } } },
  });
  if (!viaje) return null;
  const busqueda = { origen: String(viaje.vuelo.origen), destino: String(viaje.vuelo.destino), fecha: fechaLocal(viaje.fecha_partida) };
  const vuelos = await obtenerVuelosDisponibles(busqueda);
  const vuelo = vuelos.find((v) => v.id === id);
  return vuelo ? { vuelo, busqueda } : null;
}

export async function obtenerResumenReserva(codigo: number, clerkId: string) {
  const reserva = await db.reserva.findFirst({
    where: { cod_compra: codigo, usuario: { clerk_id: clerkId } },
    select: { cod_compra: true, modalidad: true, pago: { select: { estado_compra: true, pasaje: {
      orderBy: { id_pasaje: "asc" },
      select: { clase: true, cancelado: true, pasajero_pasaje_pasajeroTopasajero: { select: { nombre: true, apellido: true, dni: true } },
        viaje: { select: { estado: true, fecha_partida: true, fecha_llegada: true, vuelo: { select: {
          numero: true, precio_economy: true, precio_primera: true,
          aeropuerto_vuelo_origenToaeropuerto: { select: { codigo_iata: true, ciudad: true } },
          aeropuerto_vuelo_destinoToaeropuerto: { select: { codigo_iata: true, ciudad: true } },
        } } } },
      },
    } } } },
  });
  const primerPasaje = reserva?.pago.pasaje[0];
  if (!reserva || !primerPasaje) return null;
  const { viaje, clase } = primerPasaje;
  const precio = clase === "economy" ? viaje.vuelo.precio_economy : viaje.vuelo.precio_primera;
  const activos = reserva.pago.pasaje.filter((p) => !p.cancelado);
  return {
    codigo: reserva.cod_compra, estado: reserva.pago.estado_compra, modalidad: reserva.modalidad, clase,
    puedeConfirmar: reserva.pago.estado_compra === "pendiente" && activos.length > 0 && activos.every((p) =>
      ["programado", "demorado"].includes(p.viaje.estado) && p.viaje.fecha_partida > new Date()),
    numero: viaje.vuelo.numero, partida: viaje.fecha_partida.toISOString(), llegada: viaje.fecha_llegada.toISOString(),
    origen: viaje.vuelo.aeropuerto_vuelo_origenToaeropuerto, destino: viaje.vuelo.aeropuerto_vuelo_destinoToaeropuerto,
    pasajeros: reserva.pago.pasaje.map((p) => ({ ...p.pasajero_pasaje_pasajeroTopasajero, cancelado: p.cancelado })),
    precio: precio.toString(), total: precio.mul(activos.length).toString(),
  };
}
