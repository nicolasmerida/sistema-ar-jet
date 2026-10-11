import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { obtenerDetalleAeropuerto } from "@/lib/aeropuertos/data";
import { DetalleAeropuertoVista } from "../../../ui/dashboard/aeropuertos/detalle-aeropuerto";

export const metadata: Metadata = { title: "Detalle de aeropuerto | AR Jet" };

export default async function DetalleAeropuertoPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const id = Number((await params).id);
  const aeropuerto = Number.isInteger(id) && id > 0 && id <= 2147483647 ? await obtenerDetalleAeropuerto(id) : null;
  if (!aeropuerto) notFound();
  return (
    <div className="w-full p-6">
      <DetalleAeropuertoVista aeropuerto={aeropuerto} />
    </div>
  );
}
