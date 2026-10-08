import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { obtenerDetalleVuelo } from "@/lib/vuelos/data";
import { DetalleVueloVista } from "../../../ui/dashboard/vuelos/detalle-vuelo";

export const metadata: Metadata = { title: "Detalle de vuelo | AR Jet" };

export default async function DetalleVueloPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const id = Number((await params).id);
  const vuelo = Number.isInteger(id) && id > 0 && id <= 2147483647 ? await obtenerDetalleVuelo(id) : null;
  if (!vuelo) notFound();
  return (
    <div className="w-full p-6">
      <DetalleVueloVista vuelo={vuelo} />
    </div>
  );
}
