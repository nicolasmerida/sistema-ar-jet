"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { Prisma } from "@/src/generated/prisma/client";
import { db } from "@/src/prisma/db";
import {
  ROL_POR_DEFECTO,
  ROLES_VALIDOS,
  RUTA_POR_ROL,
  type Rol,
  type ResultadoAccionPerfil,
  type ResultadoAccionUsuario,
} from "./tipos";
import { validarPerfil, type DatosPerfil } from "./validacion";

const RUTA_USUARIOS = "/dashboard/usuarios";
const DUPLICADO = "Ya existe una cuenta con ese documento";
const SIN_PERMISOS = "No tiene permisos para acceder a esta sección";

function validarEntrada(entrada: unknown):
  | { ok: true; datos: DatosPerfil }
  | { ok: false; resultado: ResultadoAccionPerfil } {
  const objeto = typeof entrada === "object" && entrada !== null
    ? entrada as Record<string, unknown>
    : {};
  const datos: DatosPerfil = {
    dni: typeof objeto.dni === "string" ? objeto.dni.trim() : "",
  };
  const errores = validarPerfil(datos);
  if (Object.keys(errores).length > 0) {
    return { ok: false, resultado: { ok: false, mensaje: "Revisá los campos marcados en rojo", errores } };
  }
  return { ok: true, datos };
}

function rolDe(user: { publicMetadata: Record<string, unknown> }): string {
  return (user.publicMetadata.role as string | undefined) ?? ROL_POR_DEFECTO;
}

export async function completarPerfil(entrada: unknown): Promise<ResultadoAccionPerfil> {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const validado = validarEntrada(entrada);
  if (!validado.ok) return validado.resultado;
  const { dni } = validado.datos;

  const user = await currentUser();
  if (!user) redirect("/login");

  const existente = await db.usuario.findUnique({ where: { clerk_id: userId }, select: { dni: true } });
  if (existente) redirect(RUTA_POR_ROL[rolDe(user)] ?? RUTA_POR_ROL[ROL_POR_DEFECTO]);

  const rol = rolDe(user);
  const nombre = user.firstName?.trim() || "Sin nombre";
  const apellido = user.lastName?.trim() || "Sin apellido";

  try {
    await db.$transaction(async (tx) => {
      await tx.usuario.create({
        data: { dni, clerk_id: userId, nombre, apellido },
      });
      if (rol === "administrador") {
        await tx.administrador.create({ data: { dni } });
      } else if (rol === "empleado") {
        await tx.empleado.create({ data: { dni } });
      } else {
        await tx.cliente.create({ data: { dni } });
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, mensaje: DUPLICADO, errores: { dni: DUPLICADO } };
    }
    // No se envían detalles de conexión ni credenciales al navegador.
    return { ok: false, mensaje: "No se pudieron guardar los datos. Por favor, contactá al equipo técnico" };
  }

  redirect(RUTA_POR_ROL[rol] ?? RUTA_POR_ROL[ROL_POR_DEFECTO]);
}

// La protección por rol en proxy.ts ya impide llegar hasta acá sin ser
// administrador, pero una server action es un endpoint invocable por su
// cuenta: se vuelve a verificar del lado del servidor.
async function requerirAdministrador(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/login");
  const user = await currentUser();
  if (!user || rolDe(user) !== "administrador") {
    throw new Error(SIN_PERMISOS);
  }
  return userId;
}

async function sincronizarSubtipo(dni: string, rol: Rol) {
  await db.$transaction(async (tx) => {
    await tx.administrador.deleteMany({ where: { dni } });
    await tx.empleado.deleteMany({ where: { dni } });
    await tx.cliente.deleteMany({ where: { dni } });
    if (rol === "administrador") await tx.administrador.create({ data: { dni } });
    else if (rol === "empleado") await tx.empleado.create({ data: { dni } });
    else await tx.cliente.create({ data: { dni } });
  });
}

export async function cambiarRolUsuario(clerkId: string, nuevoRol: string): Promise<ResultadoAccionUsuario> {
  const adminId = await requerirAdministrador();
  if (!ROLES_VALIDOS.includes(nuevoRol as Rol)) {
    return { ok: false, mensaje: "Rol inválido" };
  }
  if (clerkId === adminId) {
    return { ok: false, mensaje: "No podés cambiar tu propio rol" };
  }

  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkId, { publicMetadata: { role: nuevoRol } });

    const existente = await db.usuario.findUnique({ where: { clerk_id: clerkId }, select: { dni: true } });
    if (existente) await sincronizarSubtipo(existente.dni, nuevoRol as Rol);
  } catch {
    return { ok: false, mensaje: "No se pudo actualizar el rol. Por favor, contactá al equipo técnico" };
  }

  revalidatePath(RUTA_USUARIOS);
  return { ok: true, mensaje: "Rol actualizado correctamente" };
}

export async function darDeBajaUsuario(clerkId: string): Promise<ResultadoAccionUsuario> {
  const adminId = await requerirAdministrador();
  if (clerkId === adminId) {
    return { ok: false, mensaje: "No podés dar de baja tu propia cuenta" };
  }

  try {
    const client = await clerkClient();
    await client.users.banUser(clerkId);
  } catch {
    return { ok: false, mensaje: "No se pudo dar de baja la cuenta. Por favor, contactá al equipo técnico" };
  }

  revalidatePath(RUTA_USUARIOS);
  return { ok: true, mensaje: "Usuario dado de baja correctamente" };
}
