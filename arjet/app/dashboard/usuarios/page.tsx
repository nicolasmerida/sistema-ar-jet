import type { Metadata } from "next";
import { connection } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { obtenerUsuarios } from "@/lib/usuarios/data";
import { UsuariosManager } from "../../ui/dashboard/usuarios/usuarios-manager";

export const metadata: Metadata = { title: "Usuarios | AR Jet" };

export default async function UsuariosPage() {
  await connection();
  const [usuarios, { userId }] = await Promise.all([obtenerUsuarios(), auth()]);
  return (
    <div className="w-full p-6">
      <UsuariosManager usuarios={usuarios} miClerkId={userId ?? ""} />
    </div>
  );
}
