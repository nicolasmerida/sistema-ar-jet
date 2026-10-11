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
import type { ResultadoAccionAvion } from "./tipos";
import { validarAvion, type DatosAvion } from "./validacion";

// TODO: verificar el rol administrador cuando el equipo implemente el login.
const RUTA_AVIONES = "/dashboard/aviones";
const RUTA_VUELOS = "/dashboard/vuelos";
const DUPLICADO = "Ya existe un avión con esa matrícula";
const DUPLICADO_DE_BAJA = "Ya existe un avión dado de baja con esa matrícula";
const INEXISTENTE = "El avión ya no existe. Actualizá la página";
const DE_BAJA = "El avión está dado de baja y no se puede modificar";
const YA_DE_BAJA = "El avión ya está dado de baja o no existe. Actualizá la página";
const BAJA_BLOQUEADA = "Este avión no se puede dar de baja porque tiene vuelos vigentes que no se pueden cancelar";
const ERROR_CONEXION = "No se pudieron guardar los datos. Por favor, contactá al equipo técnico";

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

function duplicado(deBaja: boolean): ResultadoAccionAvion {
  const mensaje = deBaja ? DUPLICADO_DE_BAJA : DUPLICADO;
  return { ok: false, mensaje, errores: { matricula: mensaje } };
}

function errorDeGuardado(error: unknown): ResultadoAccionAvion {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return duplicado(false);
    if (error.code === "P2025") return { ok: false, mensaje: INEXISTENTE };
  }
  // No se envían detalles de conexión ni credenciales al navegador.
  console.error("Error al guardar el avión:", error);
  return { ok: false, mensaje: ERROR_CONEXION };
}

export async function crearAvion(entrada: unknown): Promise<ResultadoAccionAvion> {
  const validado = validarEntrada(entrada);
  if (!validado.ok) return validado.resultado;
  const datos = validado.datos;
  try {
    // También contempla matrículas antiguas cargadas en minúsculas y aviones dados de baja.
    const existente = await db.avion.findFirst({
      where: { matricula: { equals: datos.matricula, mode: "insensitive" } },
      select: { estado: true },
    });
    if (existente) return duplicado(existente.estado === "de_baja");
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
    // La matrícula permanece fija, como en el formulario de edición. La condición sobre el
    // estado impide editar un avión dado de baja, aunque la baja sea simultánea.
    const actualizado = await db.avion.updateMany({
      where: { id_avion: id, estado: "activo" },
      data: {
        modelo: datos.modelo,
        capacidad_economy: Number(datos.capacidadEconomy),
        capacidad_primera: Number(datos.capacidadPrimera),
      },
    });
    if (actualizado.count === 0) {
      const existe = await db.avion.count({ where: { id_avion: id } });
      return { ok: false, mensaje: existe ? DE_BAJA : INEXISTENTE };
    }
  } catch (error) {
    return errorDeGuardado(error);
  }
  revalidatePath(RUTA_AVIONES);
  return { ok: true, mensaje: "Avión actualizado correctamente" };
}

/** Lo que se cancelaría con la baja, para mostrarlo antes de confirmar. */
export async function resumenBajaAvion(id: unknown): Promise<ResultadoResumenBaja> {
  if (!idValido(id)) return { ok: false, mensaje: INEXISTENTE };
  try {
    const avion = await db.avion.findUnique({ where: { id_avion: id }, select: { estado: true } });
    if (!avion || avion.estado !== "activo") return { ok: false, mensaje: YA_DE_BAJA };
    return { ok: true, resumen: await analizarBaja(db, { id_avion: id }) };
  } catch (error) {
    console.error("Error al analizar la baja del avión:", error);
    return { ok: false, mensaje: ERROR_CONEXION };
  }
}

/**
 * Baja lógica: el avión queda "de baja" y se cancelan sus viajes pendientes.
 * Si algún viaje en pie no se puede cancelar, se rechaza todo y no cambia nada.
 */
export async function darDeBajaAvion(id: unknown): Promise<ResultadoBaja> {
  if (!idValido(id)) return { ok: false, mensaje: INEXISTENTE };

  let mensaje = "";
  try {
    await db.$transaction(async (tx) => {
      // El UPDATE deja la fila bloqueada hasta el commit: asignar el avión a un vuelo
      // espera (FOR SHARE) y después ve que está de baja.
      const marcado = await tx.avion.updateMany({
        where: { id_avion: id, estado: "activo" },
        data: { estado: "de_baja", fecha_baja: new Date() },
      });
      if (marcado.count === 0) throw new BajaRechazada(YA_DE_BAJA);
      const { matricula } = await tx.avion.findUniqueOrThrow({ where: { id_avion: id }, select: { matricula: true } });

      const cancelacion = await cancelarViajesPorBaja(tx, { id_avion: id }, `Baja del avión ${matricula}`);
      mensaje = mensajeBaja(`Avión ${matricula}`, cancelacion);
    }, OPCIONES_TRANSACCION);
  } catch (error) {
    if (error instanceof BajaBloqueada) return { ok: false, mensaje: BAJA_BLOQUEADA, bloqueantes: error.bloqueantes };
    if (error instanceof BajaRechazada) return { ok: false, mensaje: error.message };
    console.error("Error al dar de baja el avión:", error);
    return { ok: false, mensaje: ERROR_CONEXION };
  }

  revalidatePath(RUTA_AVIONES, "layout");
  revalidatePath(RUTA_VUELOS, "layout");
  return { ok: true, mensaje };
}

class BajaRechazada extends Error {}
