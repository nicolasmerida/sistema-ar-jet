import "server-only";

import type { Prisma } from "@/src/generated/prisma/client";
import { db } from "@/src/prisma/db";
import { filtroPasajesActivos } from "@/lib/vuelos/data";
import { OPCIONES_TRANSACCION } from "@/lib/vuelos/cancelacion";
import { columnaFecha, fechaLocal } from "@/lib/vuelos/fechas";
import type { DatosReserva } from "./reserva-validacion";

export class ReservaRechazada extends Error {
  constructor(mensaje: string, public agotado = false) { super(mensaje); }
}

export async function registrarEnTransaccion(tx: Prisma.TransactionClient, datos: DatosReserva, clerkId: string) {
  // Todas las reservas del mismo viaje toman este lock antes de contar asientos.
  const filas = await tx.$queryRaw<{ id_viaje: number }[]>`SELECT id_viaje FROM viaje WHERE id_viaje = ${datos.viaje} FOR UPDATE`;
  if (!filas.length) throw new ReservaRechazada("El vuelo ya no está disponible", true);
  const viaje = await tx.viaje.findUnique({
    where: { id_viaje: datos.viaje },
    include: { avion: true, vuelo: { include: { aeropuerto_vuelo_origenToaeropuerto: true, aeropuerto_vuelo_destinoToaeropuerto: true } } },
  });
  const ahora = new Date();
  if (!viaje || !["programado", "demorado"].includes(viaje.estado) || viaje.fecha_partida <= ahora ||
    viaje.avion.estado !== "activo" || viaje.vuelo.aeropuerto_vuelo_origenToaeropuerto.estado !== "activo" ||
    viaje.vuelo.aeropuerto_vuelo_destinoToaeropuerto.estado !== "activo") throw new ReservaRechazada("El vuelo ya no está disponible", true);
  const fecha = columnaFecha(fechaLocal(viaje.fecha_partida));
  const dia = fecha.getUTCDay() || 7;
  if (fecha < viaje.vuelo.inicio_disp || fecha > viaje.vuelo.fin_disp || !viaje.vuelo.dias_operacion.includes(dia)) {
    throw new ReservaRechazada("El vuelo ya no está disponible", true);
  }
  const ocupados = await tx.pasaje.count({ where: { id_viaje: datos.viaje, clase: datos.clase, ...filtroPasajesActivos } });
  const capacidad = datos.clase === "economy" ? viaje.avion.capacidad_economy : viaje.avion.capacidad_primera;
  if (capacidad - ocupados < datos.pasajeros.length) throw new ReservaRechazada("El asiento ya no está disponible", true);
  const usuario = await tx.usuario.findUnique({ where: { clerk_id: clerkId }, select: { dni: true, cliente: true } });
  if (!usuario?.cliente) throw new ReservaRechazada("Completá tu perfil de pasajero antes de reservar");
  const repetido = await tx.pasaje.findFirst({ where: { id_viaje: datos.viaje, cancelado: false, pasajero: { in: datos.pasajeros.map((p) => p.dni) } }, select: { id_pasaje: true } });
  if (repetido) throw new ReservaRechazada("Uno de los pasajeros ya tiene un pasaje registrado para este vuelo");
  for (const pasajero of datos.pasajeros) {
    const existente = await tx.pasajero.findUnique({ where: { dni: pasajero.dni } });
    if (existente && (existente.nombre.toLocaleLowerCase() !== pasajero.nombre.toLocaleLowerCase() || existente.apellido.toLocaleLowerCase() !== pasajero.apellido.toLocaleLowerCase())) {
      throw new ReservaRechazada("Los datos de un pasajero no coinciden con su documento registrado");
    }
    await tx.pasajero.upsert({ where: { dni: pasajero.dni }, create: pasajero, update: {} });
  }
  const pago = await tx.pago.create({ data: { estado_compra: "pendiente", reserva: { create: { dni_usuario: usuario.dni } } }, select: { cod_compra: true } });
  await tx.pasaje.createMany({ data: datos.pasajeros.map((p) => ({ id_viaje: datos.viaje, compra: pago.cod_compra, pasajero: p.dni, clase: datos.clase })) });
  return pago.cod_compra;
}

export function registrarReserva(datos: DatosReserva, clerkId: string) {
  return db.$transaction((tx) => registrarEnTransaccion(tx, datos, clerkId), { ...OPCIONES_TRANSACCION, isolationLevel: "ReadCommitted" });
}
