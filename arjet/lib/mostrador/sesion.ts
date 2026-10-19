import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const MENSAJE_SIN_PERMISOS = "No tiene permisos para acceder a esta sección";

type UsuarioClerk = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

function esEmpleado(usuario: UsuarioClerk) {
  return !usuario.banned && usuario.publicMetadata.role === "empleado";
}

// Para páginas: sin sesión va al login; con otro rol vuelve a su pantalla.
export async function exigirEmpleado(retorno: string) {
  const usuario = await currentUser();
  if (!usuario) redirect(`/login?redirect_url=${encodeURIComponent(retorno)}`);
  if (!esEmpleado(usuario)) redirect("/ingreso");
  return usuario;
}

// Para server actions: son endpoints invocables por su cuenta, así que el rol
// se vuelve a verificar acá y no solo en el middleware.
export async function empleadoActual() {
  const usuario = await currentUser();
  return usuario && esEmpleado(usuario) ? usuario : null;
}
