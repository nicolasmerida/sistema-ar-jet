import "server-only";

import { randomUUID } from "node:crypto";
import type { Prisma } from "@/src/generated/prisma/client";
import { db } from "@/src/prisma/db";
import { filtroPasajesVendidos } from "@/lib/vuelos/data";
import { OPCIONES_TRANSACCION } from "@/lib/vuelos/cancelacion";
import { columnaFecha, fechaLocal } from "@/lib/vuelos/fechas";
import { validarCantidadPasajes } from "./reserva-validacion";
import { MENSAJE_PAGO_RECHAZADO, MENSAJE_SIN_ASIENTOS_PAGO } from "./pago-validacion";

export class PagoRechazado extends Error {
  constructor(mensaje: string, public resultados?: string) { super(mensaje); }
}

export type AutorizacionSimulada = { autorizada: boolean; ultimos4: string };

export async function pagarEnTransaccion(tx: Prisma.TransactionClient, codigo: number, clerkId: string, autorizacion: AutorizacionSimulada) {
  const where = { cod_compra: codigo, usuario: { clerk_id: clerkId } };
  const inicial = await tx.reserva.findFirst({ where, select: { pago: { select: { pasaje: { select: { id_viaje: true } } } } } });
  if (!inicial) throw new PagoRechazado("No se encontró la reserva o no tenés permisos para pagarla");
  const ids = [...new Set(inicial.pago.pasaje.map((p) => p.id_viaje))].sort((a, b) => a - b);
  // Mismo orden de locks que reserva/cancelación; el conteo posterior ve el pago anterior.
  await tx.$queryRaw`SELECT id_viaje FROM viaje WHERE id_viaje = ANY(${ids}::int[]) ORDER BY id_viaje FOR UPDATE`;
  await tx.$queryRaw`SELECT cod_compra FROM pago WHERE cod_compra = ${codigo} FOR UPDATE`;
  const reserva = await tx.reserva.findFirst({ where, include: { pago: { include: { pasaje: {
    include: { viaje: { include: { avion: true, vuelo: { include: { aeropuerto_vuelo_origenToaeropuerto: true, aeropuerto_vuelo_destinoToaeropuerto: true } } } } },
  } } } } });
  if (!reserva) throw new PagoRechazado("La reserva ya no existe");
  const pago = reserva.pago;
  if (pago.estado_compra === "pagado") return { referencia: pago.referencia };
  if (pago.estado_compra !== "pendiente") throw new PagoRechazado("Esta reserva no admite pagos");
  const pasajes = pago.pasaje.filter((p) => !p.cancelado);
  const cantidadInvalida = validarCantidadPasajes(pasajes.length);
  if (cantidadInvalida) throw new PagoRechazado(cantidadInvalida);
  const ahora = new Date();
  const grupos = new Map<string, typeof pasajes>();
  for (const pasaje of pasajes) {
    const { viaje } = pasaje;
    const { vuelo } = viaje;
    const fecha = columnaFecha(fechaLocal(viaje.fecha_partida));
    if (!["programado", "demorado"].includes(viaje.estado) || viaje.fecha_partida <= ahora || viaje.avion.estado !== "activo" ||
      vuelo.aeropuerto_vuelo_origenToaeropuerto.estado !== "activo" || vuelo.aeropuerto_vuelo_destinoToaeropuerto.estado !== "activo" ||
      fecha < vuelo.inicio_disp || fecha > vuelo.fin_disp || !vuelo.dias_operacion.includes(fecha.getUTCDay() || 7)) throw new PagoRechazado("El vuelo ya no está disponible para realizar el pago");
    if (!pasaje.precio_unitario.isFinite() || !pasaje.precio_unitario.gt(0)) throw new PagoRechazado("El importe de la reserva no es válido");
    const clave = `${pasaje.id_viaje}:${pasaje.clase}`;
    grupos.set(clave, [...(grupos.get(clave) ?? []), pasaje]);
  }
  for (const grupo of grupos.values()) {
    const primero = grupo[0];
    const vendidos = await tx.pasaje.count({ where: { ...filtroPasajesVendidos, id_viaje: primero.id_viaje, clase: primero.clase } });
    const capacidad = primero.clase === "economy" ? primero.viaje.avion.capacidad_economy : primero.viaje.avion.capacidad_primera;
    if (vendidos + grupo.length > capacidad) {
      const vuelo = primero.viaje.vuelo;
      const filtros = new URLSearchParams({ origen: String(vuelo.origen), destino: String(vuelo.destino), fecha: fechaLocal(primero.viaje.fecha_partida), aviso: "sin-asientos-pago" });
      throw new PagoRechazado(MENSAJE_SIN_ASIENTOS_PAGO, `/vuelos?${filtros}`);
    }
  }
  if (!autorizacion.autorizada) throw new PagoRechazado(MENSAJE_PAGO_RECHAZADO);
  const importe = pasajes.reduce((total, p) => total.add(p.precio_unitario), pasajes[0].precio_unitario.mul(0));
  const referencia = `SIM-${randomUUID()}`;
  await tx.pago.update({ where: { cod_compra: codigo }, data: {
    estado_compra: "pagado", tipo: "tarjeta_credito", importe, moneda: "ARS", fecha_pago: ahora, referencia, tarjeta_ultimos4: autorizacion.ultimos4,
  } });
  await tx.reserva.update({ where: { cod_compra: codigo }, data: { modalidad: "tarjeta" } });
  return { referencia };
}

export function procesarPago(codigo: number, clerkId: string, autorizacion: AutorizacionSimulada) {
  return db.$transaction((tx) => pagarEnTransaccion(tx, codigo, clerkId, autorizacion), { ...OPCIONES_TRANSACCION, isolationLevel: "ReadCommitted" });
}
