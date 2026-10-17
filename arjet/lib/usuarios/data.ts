import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/src/prisma/db";
import { ROL_POR_DEFECTO, type Rol, type UsuarioListado } from "./tipos";

export function obtenerUsuarioPorClerkId(clerkId: string) {
  return db.usuario.findUnique({ where: { clerk_id: clerkId }, select: { dni: true } });
}

export async function obtenerUsuarios(): Promise<UsuarioListado[]> {
  const client = await clerkClient();
  const { data: usuariosClerk } = await client.users.getUserList({
    limit: 200,
    orderBy: "-created_at",
  });

  const filasDb = await db.usuario.findMany({ select: { clerk_id: true, dni: true } });
  const dniPorClerkId = new Map(filasDb.map((fila) => [fila.clerk_id, fila.dni]));

  return usuariosClerk.map((usuario) => ({
    clerkId: usuario.id,
    nombre: usuario.firstName ?? "",
    apellido: usuario.lastName ?? "",
    email: usuario.primaryEmailAddress?.emailAddress ?? "",
    dni: dniPorClerkId.get(usuario.id) ?? null,
    rol: ((usuario.publicMetadata.role as string | undefined) ?? ROL_POR_DEFECTO) as Rol,
    baneado: usuario.banned,
  }));
}
