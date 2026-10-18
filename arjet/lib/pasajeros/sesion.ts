import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ROL_POR_DEFECTO } from "@/lib/usuarios/tipos";

export async function exigirPasajero(retorno: string) {
  const usuario = await currentUser();
  if (!usuario) redirect(`/login?redirect_url=${encodeURIComponent(retorno)}`);
  if (usuario.banned || (usuario.publicMetadata.role ?? ROL_POR_DEFECTO) !== ROL_POR_DEFECTO) redirect("/ingreso");
  return usuario;
}
