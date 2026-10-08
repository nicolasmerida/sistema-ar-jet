import type { Metadata } from "next";
import { connection } from "next/server";
import { obtenerVuelos } from "@/lib/vuelos/data";
import { VuelosManager } from "../../ui/dashboard/vuelos/vuelos-manager";

export const metadata: Metadata = { title: "Vuelos | AR Jet" };

export default async function VuelosPage({ searchParams }: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  // El estado de cada vuelo depende de la hora actual: siempre se lee de la base.
  await connection();
  const [{ aviso }, vuelos] = await Promise.all([searchParams, obtenerVuelos()]);
  return (
    <div className="w-full p-6">
      <VuelosManager vuelos={vuelos} aviso={typeof aviso === "string" ? aviso : undefined} />
    </div>
  );
}
