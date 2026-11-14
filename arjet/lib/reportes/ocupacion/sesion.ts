import "server-only";
import { currentUser } from "@clerk/nextjs/server";

export async function administradorActual() {
  const usuario = await currentUser();
  return usuario && !usuario.banned && usuario.publicMetadata.role === "administrador" ? usuario : null;
}
