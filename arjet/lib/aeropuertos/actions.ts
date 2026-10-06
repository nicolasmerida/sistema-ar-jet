"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/src/generated/prisma/client";
import { db } from "@/src/prisma/db";
import { contarVuelosVigentes } from "./data";
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

const MENSAJES = {
  creado: "Aeropuerto creado correctamente",
  actualizado: "Aeropuerto actualizado correctamente",
  eliminado: "Aeropuerto eliminado correctamente",
  datosInvalidos: "Revisá los campos marcados en rojo",
  duplicado: "Ya existe un aeropuerto con ese código",
  inexistente: "El aeropuerto ya no existe. Actualizá la página",
  vuelosVigentes:
    "No se puede eliminar un aeropuerto asociado a vuelos vigentes",
  vuelosAsociados:
    "No se puede eliminar un aeropuerto que tiene vuelos registrados",
  errorConexion:
    "No se pudieron guardar los datos. Por favor, contactá al equipo técnico",
};

export async function crearAeropuerto(
  datos: DatosAeropuerto,
): Promise<ResultadoAccion> {
  const validado = validarEntrada(datos);
  if (!validado.ok) return validado.resultado;

  const { codigo, nombre, ciudad, pais, direccion } = validado.datos;

  try {
    await db.aeropuerto.create({
      data: { codigo_iata: codigo, nombre, ciudad, pais, direccion },
    });
  } catch (error) {
    return manejarErrorDeGuardado(error);
  }

  revalidatePath(RUTA_AEROPUERTOS);
  return { ok: true, mensaje: MENSAJES.creado };
}

export async function actualizarAeropuerto(
  id: number,
  datos: DatosAeropuerto,
): Promise<ResultadoAccion> {
  if (!Number.isInteger(id)) {
    return { ok: false, mensaje: MENSAJES.inexistente };
  }

  const validado = validarEntrada(datos);
  if (!validado.ok) return validado.resultado;

  const { codigo, nombre, ciudad, pais, direccion } = validado.datos;

  try {
    await db.aeropuerto.update({
      where: { id_aeropuerto: id },
      data: { codigo_iata: codigo, nombre, ciudad, pais, direccion },
    });
  } catch (error) {
    return manejarErrorDeGuardado(error);
  }

  revalidatePath(RUTA_AEROPUERTOS);
  return { ok: true, mensaje: MENSAJES.actualizado };
}

export async function eliminarAeropuerto(
  id: number,
): Promise<ResultadoAccion> {
  if (!Number.isInteger(id)) {
    return { ok: false, mensaje: MENSAJES.inexistente };
  }

  try {
    if ((await contarVuelosVigentes(id)) > 0) {
      return { ok: false, mensaje: MENSAJES.vuelosVigentes };
    }

    await db.aeropuerto.delete({ where: { id_aeropuerto: id } });
  } catch (error) {
    if (esErrorPrisma(error, "P2003")) {
      return { ok: false, mensaje: MENSAJES.vuelosAsociados };
    }
    return manejarErrorDeGuardado(error);
  }

  revalidatePath(RUTA_AEROPUERTOS);
  return { ok: true, mensaje: MENSAJES.eliminado };
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

function manejarErrorDeGuardado(error: unknown): ResultadoAccion {
  if (esErrorPrisma(error, "P2002")) {
    return {
      ok: false,
      mensaje: MENSAJES.duplicado,
      errores: { codigo: MENSAJES.duplicado },
    };
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
