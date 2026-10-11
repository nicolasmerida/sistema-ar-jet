"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/src/generated/prisma/client";
import { db } from "@/src/prisma/db";
import {
  BajaBloqueada,
  OPCIONES_TRANSACCION,
  analizarBaja,
  cancelarViajesPorBaja,
  mensajeBaja,
} from "@/lib/vuelos/cancelacion";
import type { ResultadoBaja, ResultadoResumenBaja } from "@/lib/vuelos/tipos";
import {
  type DatosAeropuerto,
  type ErroresAeropuerto,
  normalizarAeropuerto,
  tieneErrores,
  validarAeropuerto,
} from "./validacion";

// TODO: verificar que el usuario sea administrador cuando esté implementado el login.

export type ResultadoAccion =
  | { ok: true; mensaje: string }
  | { ok: false; mensaje: string; errores?: ErroresAeropuerto };

const RUTA_AEROPUERTOS = "/dashboard/aeropuertos";
const RUTA_VUELOS = "/dashboard/vuelos";

const MENSAJES = {
  creado: "Aeropuerto creado correctamente",
  actualizado: "Aeropuerto actualizado correctamente",
  datosInvalidos: "Revisá los campos marcados en rojo",
  duplicado: "Ya existe un aeropuerto con ese código",
  duplicadoDeBaja: "Ya existe un aeropuerto dado de baja con ese código",
  inexistente: "El aeropuerto ya no existe. Actualizá la página",
  deBaja: "El aeropuerto está dado de baja y no se puede modificar",
  yaDeBaja: "El aeropuerto ya está dado de baja o no existe. Actualizá la página",
  bajaBloqueada:
    "Este aeropuerto no se puede dar de baja porque tiene vuelos vigentes que no se pueden cancelar",
  errorConexion:
    "No se pudieron guardar los datos. Por favor, contactá al equipo técnico",
};

export async function crearAeropuerto(
  datos: DatosAeropuerto,
): Promise<ResultadoAccion> {
  const validado = validarEntrada(datos);
  if (!validado.ok) return validado.resultado;

  try {
    await db.aeropuerto.create({ data: columnasAeropuerto(validado.datos) });
  } catch (error) {
    return manejarErrorDeGuardado(error, validado.datos.codigo);
  }

  revalidatePath(RUTA_AEROPUERTOS);
  return { ok: true, mensaje: MENSAJES.creado };
}

export async function actualizarAeropuerto(
  id: number,
  datos: DatosAeropuerto,
): Promise<ResultadoAccion> {
  if (!idValido(id)) {
    return { ok: false, mensaje: MENSAJES.inexistente };
  }

  const validado = validarEntrada(datos);
  if (!validado.ok) return validado.resultado;

  try {
    // La condición sobre el estado impide editar uno dado de baja, aunque la baja sea simultánea.
    const actualizado = await db.aeropuerto.updateMany({
      where: { id_aeropuerto: id, estado: "activo" },
      data: columnasAeropuerto(validado.datos),
    });
    if (actualizado.count === 0) {
      const existe = await db.aeropuerto.count({ where: { id_aeropuerto: id } });
      return { ok: false, mensaje: existe ? MENSAJES.deBaja : MENSAJES.inexistente };
    }
  } catch (error) {
    return manejarErrorDeGuardado(error, validado.datos.codigo);
  }

  revalidatePath(RUTA_AEROPUERTOS);
  return { ok: true, mensaje: MENSAJES.actualizado };
}

/** Lo que se cancelaría con la baja, para mostrarlo antes de confirmar. */
export async function resumenBajaAeropuerto(id: unknown): Promise<ResultadoResumenBaja> {
  if (!idValido(id)) return { ok: false, mensaje: MENSAJES.inexistente };
  try {
    const aeropuerto = await db.aeropuerto.findUnique({ where: { id_aeropuerto: id }, select: { estado: true } });
    if (!aeropuerto || aeropuerto.estado !== "activo") return { ok: false, mensaje: MENSAJES.yaDeBaja };
    return { ok: true, resumen: await analizarBaja(db, viajesDelAeropuerto(id)) };
  } catch (error) {
    console.error("Error al analizar la baja del aeropuerto:", error);
    return { ok: false, mensaje: MENSAJES.errorConexion };
  }
}

/**
 * Baja lógica: el aeropuerto queda "de baja" y se cancelan sus viajes pendientes.
 * Si algún viaje en pie no se puede cancelar, se rechaza todo y no cambia nada.
 */
export async function darDeBajaAeropuerto(id: unknown): Promise<ResultadoBaja> {
  if (!idValido(id)) return { ok: false, mensaje: MENSAJES.inexistente };

  let mensaje = "";
  try {
    await db.$transaction(async (tx) => {
      // El UPDATE deja la fila bloqueada hasta el commit: un vuelo nuevo con este aeropuerto
      // espera (FOR SHARE) y después ve que está de baja.
      const marcado = await tx.aeropuerto.updateMany({
        where: { id_aeropuerto: id, estado: "activo" },
        data: { estado: "de_baja", fecha_baja: new Date() },
      });
      if (marcado.count === 0) throw new BajaRechazada(MENSAJES.yaDeBaja);
      const { codigo_iata } = await tx.aeropuerto.findUniqueOrThrow({
        where: { id_aeropuerto: id },
        select: { codigo_iata: true },
      });

      const cancelacion = await cancelarViajesPorBaja(tx, viajesDelAeropuerto(id), `Baja del aeropuerto ${codigo_iata}`);
      mensaje = mensajeBaja(`Aeropuerto ${codigo_iata}`, cancelacion);
    }, OPCIONES_TRANSACCION);
  } catch (error) {
    if (error instanceof BajaBloqueada) {
      return { ok: false, mensaje: MENSAJES.bajaBloqueada, bloqueantes: error.bloqueantes };
    }
    if (error instanceof BajaRechazada) return { ok: false, mensaje: error.message };
    console.error("Error al dar de baja el aeropuerto:", error);
    return { ok: false, mensaje: MENSAJES.errorConexion };
  }

  revalidatePath(RUTA_AEROPUERTOS, "layout");
  revalidatePath(RUTA_VUELOS, "layout");
  return { ok: true, mensaje };
}

class BajaRechazada extends Error {}

function viajesDelAeropuerto(id: number): Prisma.viajeWhereInput {
  return { vuelo: { OR: [{ origen: id }, { destino: id }] } };
}

function idValido(id: unknown): id is number {
  return typeof id === "number" && Number.isInteger(id) && id > 0 && id <= 2147483647;
}

// Las server actions se pueden invocar con cualquier payload, así que se revalida todo.
function validarEntrada(
  datos: unknown,
):
  | { ok: true; datos: DatosAeropuerto }
  | { ok: false; resultado: ResultadoAccion } {
  const entrada = (datos ?? {}) as Record<string, unknown>;
  const crudos: DatosAeropuerto = {
    codigo: typeof entrada.codigo === "string" ? entrada.codigo : "",
    nombre: typeof entrada.nombre === "string" ? entrada.nombre : "",
    ciudad: typeof entrada.ciudad === "string" ? entrada.ciudad : "",
    pais: typeof entrada.pais === "string" ? entrada.pais : "",
    direccion: typeof entrada.direccion === "string" ? entrada.direccion : "",
    descripcion:
      typeof entrada.descripcion === "string" ? entrada.descripcion : "",
  };

  const errores = validarAeropuerto(crudos);
  if (tieneErrores(errores)) {
    return {
      ok: false,
      resultado: { ok: false, mensaje: MENSAJES.datosInvalidos, errores },
    };
  }

  return { ok: true, datos: normalizarAeropuerto(crudos) };
}

function columnasAeropuerto(datos: DatosAeropuerto) {
  return {
    codigo_iata: datos.codigo,
    nombre: datos.nombre,
    ciudad: datos.ciudad,
    pais: datos.pais,
    direccion: datos.direccion,
    // Es opcional: vacía se guarda como NULL.
    descripcion: datos.descripcion || null,
  };
}

async function manejarErrorDeGuardado(error: unknown, codigo: string): Promise<ResultadoAccion> {
  if (esErrorPrisma(error, "P2002")) {
    // El código sigue siendo único aunque el aeropuerto que lo tiene esté dado de baja.
    const existente = await db.aeropuerto
      .findUnique({ where: { codigo_iata: codigo }, select: { estado: true } })
      .catch(() => null);
    const mensaje = existente?.estado === "de_baja" ? MENSAJES.duplicadoDeBaja : MENSAJES.duplicado;
    return { ok: false, mensaje, errores: { codigo: mensaje } };
  }

  if (esErrorPrisma(error, "P2025")) {
    return { ok: false, mensaje: MENSAJES.inexistente };
  }

  console.error("Error al guardar el aeropuerto:", error);
  return { ok: false, mensaje: MENSAJES.errorConexion };
}

function esErrorPrisma(error: unknown, codigo: string) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === codigo
  );
}
