"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/src/generated/prisma/client";
import { db } from "@/src/prisma/db";
import { OPCIONES_TRANSACCION, cancelarViajesEnTx } from "./cancelacion";
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
  sumarDias,
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

const MENSAJES = {
  datosInvalidos: "Revisá los campos marcados en rojo",
  duplicado: "Ya existe un vuelo con ese número",
  inexistente: "El vuelo ya no existe. Actualizá la página",
  viajeInexistente: "El viaje ya no existe. Actualizá la página",
  sinViajes: "El período elegido no tiene ningún día de operación con salidas futuras",
  noEditable: "No se puede editar un vuelo cancelado o finalizado",
  avionInexistente: "El avión seleccionado ya no existe",
  avionDeBaja: "El avión seleccionado fue dado de baja",
  aeropuertoInexistente: "El aeropuerto seleccionado ya no existe. Actualizá la página",
  aeropuertoDeBaja: "El aeropuerto seleccionado fue dado de baja",
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
  // Los días de operación son días de salida; la llegada puede caer al día siguiente.
  const viajes = fechasDeOperacion(datos.inicio, datos.fin, datos.dias)
    .map((fecha) => ({
      fecha_partida: instanteLocal(fecha, datos.horaSalida),
      fecha_llegada: instanteLocal(datos.llegaDiaSiguiente ? sumarDias(fecha, 1) : fecha, datos.horaLlegada),
    }))
    .filter((viaje) => viaje.fecha_partida > ahora);
  if (viajes.length === 0) return { ok: false, mensaje: MENSAJES.sinViajes, errores: { dias: MENSAJES.sinViajes } };

  try {
    await db.$transaction(async (tx) => {
      await verificarActivos(tx, { origen: Number(datos.origen), destino: Number(datos.destino), avion: idAvion });

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
          llega_dia_siguiente: datos.llegaDiaSiguiente,
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
        select: { numero: true, origen: true, destino: true, hora_salida: true, hora_llegada: true, llega_dia_siguiente: true },
      });
      if (!vuelo) rechazar(MENSAJES.inexistente);
      numero = vuelo.numero;
      const avion = await verificarActivos(tx, { origen: vuelo.origen, destino: vuelo.destino, avion: idAvion });

      // Solo se modifican los viajes que todavía no salieron ni se cancelaron.
      const ahora = new Date();
      const viajes = await tx.viaje.findMany({
        where: { id_vuelo: id, ...filtroViajesPendientes(ahora) },
        select: { id_viaje: true, fecha_partida: true, id_avion: true },
      });
      if (viajes.length === 0) rechazar(MENSAJES.noEditable);
      const ids = viajes.map((viaje) => viaje.id_viaje);

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
        horaDeColumna(vuelo.hora_salida) !== datos.horaSalida ||
        horaDeColumna(vuelo.hora_llegada) !== datos.horaLlegada ||
        vuelo.llega_dia_siguiente !== datos.llegaDiaSiguiente;
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
          llega_dia_siguiente: datos.llegaDiaSiguiente,
          precio_economy: datos.precioEconomy,
          precio_primera: datos.precioPrimera,
        },
      });
      // Cada viaje conserva su fecha local de salida y toma los horarios nuevos; las dos
      // expresiones leen la fecha_partida anterior. La llegada suma un día si corresponde.
      await tx.$executeRaw`
        UPDATE viaje SET
          fecha_partida = ((fecha_partida AT TIME ZONE ${ZONA_HORARIA})::date + ${datos.horaSalida}::time) AT TIME ZONE ${ZONA_HORARIA},
          fecha_llegada = ((fecha_partida AT TIME ZONE ${ZONA_HORARIA})::date + ${datos.llegaDiaSiguiente ? 1 : 0}::int
                           + ${datos.horaLlegada}::time) AT TIME ZONE ${ZONA_HORARIA},
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

      const cancelacion = await cancelarViajesEnTx(tx, { id_viaje: idViaje }, texto);
      if (cancelacion.viajes === 0) rechazar("El viaje ya está cancelado");
      reservasAfectadas = cancelacion.reservas;
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
    // Cualquier valor que no sea el booleano true cuenta como "mismo día".
    llegaDiaSiguiente: objeto.llegaDiaSiguiente === true,
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

/**
 * Origen, destino y avión tienen que seguir activos. FOR SHARE bloquea esas filas hasta el
 * commit, así una baja simultánea espera y después ve el vuelo nuevo (y cancela sus viajes).
 */
async function verificarActivos(
  tx: Prisma.TransactionClient,
  { origen, destino, avion }: { origen: number; destino: number; avion: number },
) {
  const aeropuertos = await tx.$queryRaw<{ id_aeropuerto: number; estado: string }[]>`
    SELECT id_aeropuerto, estado::text AS estado FROM aeropuerto
    WHERE id_aeropuerto IN (${origen}, ${destino}) FOR SHARE`;
  for (const [campo, id] of [["origen", origen], ["destino", destino]] as const) {
    const aeropuerto = aeropuertos.find((fila) => fila.id_aeropuerto === id);
    if (!aeropuerto) rechazar(MENSAJES.aeropuertoInexistente, { [campo]: MENSAJES.aeropuertoInexistente });
    if (aeropuerto.estado !== "activo") rechazar(MENSAJES.aeropuertoDeBaja, { [campo]: MENSAJES.aeropuertoDeBaja });
  }

  const [fila] = await tx.$queryRaw<{ capacidad_economy: number; capacidad_primera: number; estado: string }[]>`
    SELECT capacidad_economy, capacidad_primera, estado::text AS estado FROM avion
    WHERE id_avion = ${avion} FOR SHARE`;
  if (!fila) rechazar(MENSAJES.avionInexistente, { avion: MENSAJES.avionInexistente });
  if (fila.estado !== "activo") rechazar(MENSAJES.avionDeBaja, { avion: MENSAJES.avionDeBaja });
  return fila;
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
  // Triggers de la baja lógica: normalmente lo frena antes verificarActivos.
  if (restriccionViolada(error, "vuelo_aeropuertos_activos")) return { ok: false, mensaje: MENSAJES.aeropuertoDeBaja };
  if (restriccionViolada(error, "viaje_avion_activo"))
    return { ok: false, mensaje: MENSAJES.avionDeBaja, errores: { avion: MENSAJES.avionDeBaja } };
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
