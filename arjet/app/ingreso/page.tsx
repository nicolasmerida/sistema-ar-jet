import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { obtenerUsuarioPorClerkId } from "@/lib/usuarios/data";
import { ROL_POR_DEFECTO, RUTA_POR_ROL } from "@/lib/usuarios/tipos";

export default async function IngresoPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const usuario = await obtenerUsuarioPorClerkId(user.id);
  if (!usuario) redirect("/completar-perfil");

  const rol = (user.publicMetadata?.role as string | undefined) ?? ROL_POR_DEFECTO;
  redirect(RUTA_POR_ROL[rol] ?? RUTA_POR_ROL[ROL_POR_DEFECTO]);
}
