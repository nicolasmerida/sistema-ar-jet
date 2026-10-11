import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { obtenerDetalleAvion } from "@/lib/aviones/data";
import { DetalleAvionVista } from "../../../ui/dashboard/aviones/detalle-avion";

export const metadata: Metadata = { title: "Detalle de avión | AR Jet" };

export default async function DetalleAvionPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const id = Number((await params).id);
  const avion = Number.isInteger(id) && id > 0 && id <= 2147483647 ? await obtenerDetalleAvion(id) : null;
  if (!avion) notFound();
  return (
    <div className="w-full p-6">
      <DetalleAvionVista avion={avion} />
    </div>
  );
}
