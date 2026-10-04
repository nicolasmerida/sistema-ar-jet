import type { Metadata } from "next";
import { connection } from "next/server";
import { obtenerAviones } from "@/lib/aviones/data";
import { AvionesManager } from "../../ui/dashboard/aviones/aviones-manager";

export const metadata: Metadata = { title: "Aviones | AR Jet" };

export default async function AvionesPage() {
  await connection();
  const aviones = await obtenerAviones();
  return (
    <div className="w-full p-6">
      <AvionesManager aviones={aviones} />
    </div>
  );
}
