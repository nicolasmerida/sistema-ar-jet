"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/src/generated/prisma/client";
import { db } from "@/src/prisma/db";
import { filtroViajesVigentes } from "./data";
import type { ResultadoAccionAvion } from "./tipos";
import { validarAvion, type DatosAvion } from "./validacion";

// TODO: verificar el rol administrador cuando el equipo implemente el login.
const RUTA_AVIONES = "/dashboard/aviones";
const DUPLICADO = "Ya existe un avión con esa matrícula";
const INEXISTENTE = "El avión ya no existe. Actualizá la página";
const VUELOS_VIGENTES = "No se puede dar de baja un avión asignado a vuelos vigentes";
const HISTORIAL = "No se puede eliminar un avión que tiene viajes registrados. Su historial debe conservarse";

function validarEntrada(entrada: unknown):
  | { ok: true; datos: DatosAvion }
  | { ok: false; resultado: ResultadoAccionAvion } {
  const objeto = typeof entrada === "object" && entrada !== null
    ? entrada as Record<string, unknown>
    : {};
  const datos: DatosAvion = {
    matricula: typeof objeto.matricula === "string" ? objeto.matricula.trim().toUpperCase() : "",
    modelo: typeof objeto.modelo === "string" ? objeto.modelo.trim() : "",
    capacidadEconomy: typeof objeto.capacidadEconomy === "string" ? objeto.capacidadEconomy.trim() : "",
    capacidadPrimera: typeof objeto.capacidadPrimera === "string" ? objeto.capacidadPrimera.trim() : "",
  };
  const errores = validarAvion(datos);
  if (Object.keys(errores).length > 0) {
    return { ok: false, resultado: { ok: false, mensaje: "Revisá los campos marcados en rojo", errores } };
  }
  return { ok: true, datos };
}

function idValido(id: unknown): id is number {
  return typeof id === "number" && Number.isInteger(id) && id > 0 && id <= 2147483647;
}

function errorDeGuardado(error: unknown): ResultadoAccionAvion {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return { ok: false, mensaje: DUPLICADO, errores: { matricula: DUPLICADO } };
    if (error.code === "P2025") return { ok: false, mensaje: INEXISTENTE };
    if (error.code === "P2003") return { ok: false, mensaje: HISTORIAL };
  }
  // No se envían detalles de conexión ni credenciales al navegador.
  return { ok: false, mensaje: "No se pudieron guardar los datos. Por favor, contactá al equipo técnico" };
}

export async function crearAvion(entrada: unknown): Promise<ResultadoAccionAvion> {
  const validado = validarEntrada(entrada);
  if (!validado.ok) return validado.resultado;
  const datos = validado.datos;
  try {
    // También contempla matrículas antiguas cargadas en minúsculas.
    const existente = await db.avion.findFirst({
      where: { matricula: { equals: datos.matricula, mode: "insensitive" } },
      select: { id_avion: true },
    });
    if (existente) return { ok: false, mensaje: DUPLICADO, errores: { matricula: DUPLICADO } };
    await db.avion.create({
      data: {
        matricula: datos.matricula,
        modelo: datos.modelo,
        capacidad_economy: Number(datos.capacidadEconomy),
        capacidad_primera: Number(datos.capacidadPrimera),
      },
    });
  } catch (error) {
    return errorDeGuardado(error);
  }
  revalidatePath(RUTA_AVIONES);
  return { ok: true, mensaje: "Avión registrado correctamente" };
}

export async function actualizarAvion(id: unknown, entrada: unknown): Promise<ResultadoAccionAvion> {
  if (!idValido(id)) return { ok: false, mensaje: INEXISTENTE };
  const validado = validarEntrada(entrada);
  if (!validado.ok) return validado.resultado;
  const datos = validado.datos;
  try {
    // La matrícula permanece fija, como en el formulario de edición.
    await db.avion.update({
      where: { id_avion: id },
      data: {
        modelo: datos.modelo,
        capacidad_economy: Number(datos.capacidadEconomy),
        capacidad_primera: Number(datos.capacidadPrimera),
      },
    });
  } catch (error) {
    return errorDeGuardado(error);
  }
  revalidatePath(RUTA_AVIONES);
  return { ok: true, mensaje: "Avión actualizado correctamente" };
}

export async function eliminarAvion(id: unknown): Promise<ResultadoAccionAvion> {
  if (!idValido(id)) return { ok: false, mensaje: INEXISTENTE };
  try {
    const resultado = await db.$transaction(async (tx): Promise<ResultadoAccionAvion> => {
      const avion = await tx.avion.findUnique({ where: { id_avion: id }, select: { id_avion: true } });
      if (!avion) return { ok: false, mensaje: INEXISTENTE };
      const vigentes = await tx.viaje.count({ where: { id_avion: id, ...filtroViajesVigentes() } });
      if (vigentes > 0) return { ok: false, mensaje: VUELOS_VIGENTES };
      // La condición atómica y la FK evitan borrar un avión asignado entre la
      // comprobación y la baja, y conservan los viajes históricos/cancelados.
      const baja = await tx.avion.deleteMany({ where: { id_avion: id, viaje: { none: {} } } });
      if (baja.count === 0) return { ok: false, mensaje: HISTORIAL };
      return { ok: true, mensaje: "Avión dado de baja correctamente" };
    });
    if (!resultado.ok) return resultado;
    revalidatePath(RUTA_AVIONES);
    return resultado;
  } catch (error) {
    return errorDeGuardado(error);
  }
}
