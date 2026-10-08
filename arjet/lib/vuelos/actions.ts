"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/src/generated/prisma/client";
import { db } from "@/src/prisma/db";
import { bloqueoCancelacion, filtroPasajesActivos, filtroViajesPendientes } from "./data";
import {
  ZONA_HORARIA,
  columnaFecha,
  columnaHora,
  fechaLocal,
  fechasDeOperacion,
  horaDeColumna,
  hoyEnArgentina,
  instanteLocal,
} from "./fechas";
import type { ResultadoAccionVuelo } from "./tipos";
import {
  type DatosVuelo,
  type ErroresVuelo,
  type ModoFormulario,
  normalizarNumeroVuelo,
  tieneErrores,
  validarMotivo,
  validarVuelo,
} from "./validacion";

// TODO: verificar el rol administrador cuando el equipo implemente el login.
const RUTA_VUELOS = "/dashboard/vuelos";
// Varias consultas por transacción contra Neon superan el límite por defecto de 5 s.
const OPCIONES_TRANSACCION = { maxWait: 10_000, timeout: 20_000 };

const MENSAJES = {
  datosInvalidos: "Revisá los campos marcados en rojo",
  duplicado: "Ya existe un vuelo con ese número",
  inexistente: "El vuelo ya no existe. Actualizá la página",
  viajeInexistente: "El viaje ya no existe. Actualizá la página",
  sinViajes: "El período elegido no tiene ningún día de operación con salidas futuras",
  noEditable: "No se puede editar un vuelo cancelado o finalizado",
  avionInexistente: "El avión seleccionado ya no existe",
  avionOcupado: "El avión ya tiene viajes asignados que se superponen con estos horarios",
  avionChico: "El avión elegido tiene menos asientos que los pasajes ya vendidos en alguna clase",
  horarioPasado: "El nuevo horario dejaría un viaje de hoy con la salida en el pasado",
  errorConexion: "No se pudieron guardar los datos. Por favor, contactá al equipo técnico",
};

/** Error esperable que corta la transacción y vuelve al formulario. */
class RechazoVuelo extends Error {
  constructor(public resultado: ResultadoAccionVuelo) {
    super(resultado.mensaje);
  }
}

function rechazar(mensaje: string, errores?: ErroresVuelo): never {
  throw new RechazoVuelo({ ok: false, mensaje, errores });
}

export async function crearVuelo(entrada: unknown): Promise<ResultadoAccionVuelo> {
  const validado = validarEntrada(entrada, "crear");
  if (!validado.ok) return validado.resultado;
  const datos = validado.datos;
  const numero = normalizarNumeroVuelo(datos.numero);
  const idAvion = Number(datos.avion);

  const ahora = new Date();
  const viajes = fechasDeOperacion(datos.inicio, datos.fin, datos.dias)
    .map((fecha) => ({
      fecha_partida: instanteLocal(fecha, datos.horaSalida),
      fecha_llegada: instanteLocal(fecha, datos.horaLlegada),
    }))
    .filter((viaje) => viaje.fecha_partida > ahora);
  if (viajes.length === 0) return { ok: false, mensaje: MENSAJES.sinViajes, errores: { dias: MENSAJES.sinViajes } };

  try {
    await db.$transaction(async (tx) => {
      const avion = await tx.avion.findUnique({ where: { id_avion: idAvion }, select: { id_avion: true } });
      if (!avion) rechazar(MENSAJES.avionInexistente, { avion: MENSAJES.avionInexistente });

      // Mismo número en un período que se superpone (la base también lo impide).
      const repetido = await tx.vuelo.findFirst({
        where: {
          numero,
          inicio_disp: { lte: columnaFecha(datos.fin) },
          fin_disp: { gte: columnaFecha(datos.inicio) },
        },
        select: { id_vuelo: true },
      });
      if (repetido) rechazar(MENSAJES.duplicado, { numero: MENSAJES.duplicado });

      const vuelo = await tx.vuelo.create({
        data: {
          numero,
          origen: Number(datos.origen),
          destino: Number(datos.destino),
          hora_salida: columnaHora(datos.horaSalida),
          hora_llegada: columnaHora(datos.horaLlegada),
          dias_operacion: datos.dias,
          inicio_disp: columnaFecha(datos.inicio),
          fin_disp: columnaFecha(datos.fin),
          precio_economy: datos.precioEconomy,
          precio_primera: datos.precioPrimera,
        },
        select: { id_vuelo: true },
      });
      // El stock de cada clase es la capacidad del avión menos los pasajes vendidos del viaje.
      await tx.viaje.createMany({
        data: viajes.map((viaje) => ({ ...viaje, id_vuelo: vuelo.id_vuelo, id_avion: idAvion })),
      });
    }, OPCIONES_TRANSACCION);
  } catch (error) {
    return manejarError(error);
  }

  revalidatePath(RUTA_VUELOS, "layout");
  const detalle = viajes.length === 1 ? "1 viaje generado" : `${viajes.length} viajes generados`;
  return { ok: true, mensaje: `Vuelo ${numero} creado correctamente (${detalle})` };
}

export async function actualizarVuelo(id: unknown, entrada: unknown): Promise<ResultadoAccionVuelo> {
  if (!idValido(id)) return { ok: false, mensaje: MENSAJES.inexistente };
  const validado = validarEntrada(entrada, "editar");
  if (!validado.ok) return validado.resultado;
  const datos = validado.datos;
  const idAvion = Number(datos.avion);

  let pasajerosAfectados = 0;
  let numero = "";
  try {
    await db.$transaction(async (tx) => {
      const vuelo = await tx.vuelo.findUnique({
        where: { id_vuelo: id },
        select: { numero: true, hora_salida: true, hora_llegada: true },
      });
      if (!vuelo) rechazar(MENSAJES.inexistente);
      numero = vuelo.numero;

      // Solo se modifican los viajes que todavía no salieron ni se cancelaron.
      const ahora = new Date();
      const viajes = await tx.viaje.findMany({
        where: { id_vuelo: id, ...filtroViajesPendientes(ahora) },
        select: { id_viaje: true, fecha_partida: true, id_avion: true },
      });
      if (viajes.length === 0) rechazar(MENSAJES.noEditable);
      const ids = viajes.map((viaje) => viaje.id_viaje);

      const avion = await tx.avion.findUnique({
        where: { id_avion: idAvion },
        select: { capacidad_economy: true, capacidad_primera: true },
      });
      if (!avion) rechazar(MENSAJES.avionInexistente, { avion: MENSAJES.avionInexistente });
      if (viajes.some((viaje) => viaje.id_avion !== idAvion)) {
        const vendidos = await tx.pasaje.groupBy({
          by: ["id_viaje", "clase"],
          where: { id_viaje: { in: ids }, ...filtroPasajesActivos },
          _count: { _all: true },
        });
        const excede = vendidos.some(({ clase, _count }) =>
          _count._all > (clase === "economy" ? avion.capacidad_economy : avion.capacidad_primera),
        );
        if (excede) rechazar(MENSAJES.avionChico, { avion: MENSAJES.avionChico });
      }

      const cambioHorario =
        horaDeColumna(vuelo.hora_salida) !== datos.horaSalida || horaDeColumna(vuelo.hora_llegada) !== datos.horaLlegada;
      if (cambioHorario) {
        const quedaEnElPasado = viajes.some(
          (viaje) => instanteLocal(fechaLocal(viaje.fecha_partida), datos.horaSalida) <= ahora,
        );
        if (quedaEnElPasado) rechazar(MENSAJES.horarioPasado, { horaSalida: MENSAJES.horarioPasado });
      }

      await tx.vuelo.update({
        where: { id_vuelo: id },
        data: {
          hora_salida: columnaHora(datos.horaSalida),
          hora_llegada: columnaHora(datos.horaLlegada),
          precio_economy: datos.precioEconomy,
          precio_primera: datos.precioPrimera,
        },
      });
      // Cada viaje conserva su fecha local y toma los horarios nuevos.
      await tx.$executeRaw`
        UPDATE viaje SET
          fecha_partida = ((fecha_partida AT TIME ZONE ${ZONA_HORARIA})::date + ${datos.horaSalida}::time) AT TIME ZONE ${ZONA_HORARIA},
          fecha_llegada = ((fecha_partida AT TIME ZONE ${ZONA_HORARIA})::date + ${datos.horaLlegada}::time) AT TIME ZONE ${ZONA_HORARIA},
          id_avion = ${idAvion}
        WHERE id_viaje = ANY(${ids}::int[])
          AND estado NOT IN ('cancelado', 'finalizado')`;

      if (cambioHorario) {
        // TODO: enviar la notificación a estos pasajeros cuando exista el módulo de avisos.
        pasajerosAfectados = await tx.pasaje.count({ where: { id_viaje: { in: ids }, ...filtroPasajesActivos } });
      }
    }, OPCIONES_TRANSACCION);
  } catch (error) {
    return manejarError(error);
  }

  revalidatePath(RUTA_VUELOS, "layout");
  const aviso = pasajerosAfectados > 0 ? `. ${pasajerosAfectados} pasajeros afectados por el cambio de horario` : "";
  return { ok: true, mensaje: `Vuelo ${numero} actualizado correctamente${aviso}` };
}

export async function cancelarViaje(idViaje: unknown, motivo: unknown): Promise<ResultadoAccionVuelo> {
  if (!idValido(idViaje)) return { ok: false, mensaje: MENSAJES.viajeInexistente };
  const texto = typeof motivo === "string" ? motivo.trim() : "";
  const errorMotivo = validarMotivo(texto);
  if (errorMotivo) return { ok: false, mensaje: errorMotivo };

  let reservasAfectadas = 0;
  try {
    await db.$transaction(async (tx) => {
      const viaje = await tx.viaje.findUnique({
        where: { id_viaje: idViaje },
        select: { estado: true, fecha_partida: true },
      });
      if (!viaje) rechazar(MENSAJES.viajeInexistente);
      const bloqueo = bloqueoCancelacion(viaje.estado, viaje.fecha_partida);
      if (bloqueo) rechazar(bloqueo);

      // La condición sobre el estado evita cancelar dos veces en pedidos simultáneos.
      const cancelado = await tx.viaje.updateMany({
        where: { id_viaje: idViaje, estado: { notIn: ["cancelado", "finalizado"] } },
        data: { estado: "cancelado" },
      });
      if (cancelado.count === 0) rechazar("El viaje ya está cancelado");
      await tx.estado.upsert({
        where: { id_viaje_estado_viaje: { id_viaje: idViaje, estado_viaje: "cancelado" } },
        create: { id_viaje: idViaje, estado_viaje: "cancelado", motivo: texto },
        update: { motivo: texto, fecha: new Date() },
      });
      // TODO: notificar por email y marcar las compras como afectadas cuando existan esos módulos.
      reservasAfectadas = await tx.pasaje.count({ where: { id_viaje: idViaje, ...filtroPasajesActivos } });
    }, OPCIONES_TRANSACCION);
  } catch (error) {
    return manejarError(error);
  }

  revalidatePath(RUTA_VUELOS, "layout");
  const aviso = reservasAfectadas > 0 ? `. ${reservasAfectadas} reservas afectadas` : "";
  return { ok: true, mensaje: `Viaje cancelado correctamente${aviso}` };
}

// Las server actions se pueden invocar con cualquier payload, así que se revalida todo.
function validarEntrada(
  entrada: unknown,
  modo: ModoFormulario,
): { ok: true; datos: DatosVuelo } | { ok: false; resultado: ResultadoAccionVuelo } {
  const objeto = typeof entrada === "object" && entrada !== null ? (entrada as Record<string, unknown>) : {};
  const texto = (campo: keyof DatosVuelo) => (typeof objeto[campo] === "string" ? objeto[campo].trim() : "");
  const dias = Array.isArray(objeto.dias)
    ? [...new Set(objeto.dias.filter((dia): dia is number => Number.isInteger(dia) && dia >= 1 && dia <= 7))].sort(
        (a, b) => a - b,
      )
    : [];
  const datos: DatosVuelo = {
    numero: texto("numero"),
    horaSalida: texto("horaSalida"),
    horaLlegada: texto("horaLlegada"),
    origen: texto("origen"),
    destino: texto("destino"),
    dias,
    inicio: texto("inicio"),
    fin: texto("fin"),
    avion: texto("avion"),
    precioEconomy: texto("precioEconomy"),
    precioPrimera: texto("precioPrimera"),
  };

  const errores = validarVuelo(datos, modo, hoyEnArgentina());
  for (const campo of ["origen", "destino", "avion"] as const) {
    if (datos[campo] && !idValido(Number(datos[campo]))) errores[campo] = "Seleccioná una opción de la lista";
  }
  if (tieneErrores(errores)) return { ok: false, resultado: { ok: false, mensaje: MENSAJES.datosInvalidos, errores } };
  return { ok: true, datos };
}

function idValido(id: unknown): id is number {
  return typeof id === "number" && Number.isInteger(id) && id > 0 && id <= 2147483647;
}

function manejarError(error: unknown): ResultadoAccionVuelo {
  if (error instanceof RechazoVuelo) return error.resultado;
  if (restriccionViolada(error, "vuelo_numero_sin_solapamiento"))
    return { ok: false, mensaje: MENSAJES.duplicado, errores: { numero: MENSAJES.duplicado } };
  if (restriccionViolada(error, "viaje_avion_sin_solapamiento"))
    return { ok: false, mensaje: MENSAJES.avionOcupado, errores: { avion: MENSAJES.avionOcupado } };
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003")
    return { ok: false, mensaje: "El aeropuerto o el avión seleccionado ya no existe. Actualizá la página" };

  // No se envían detalles de conexión ni credenciales al navegador.
  console.error("Error al guardar el vuelo:", error);
  return { ok: false, mensaje: MENSAJES.errorConexion };
}

// Prisma no tiene un código propio para las restricciones EXCLUDE: se reconocen por su nombre.
function restriccionViolada(error: unknown, nombre: string) {
  if (!(error instanceof Error)) return false;
  const meta = "meta" in error ? JSON.stringify(error.meta) : "";
  return `${error.message} ${meta}`.includes(nombre);
}
