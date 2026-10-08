import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { obtenerOpcionesFormulario, obtenerVueloEditable } from "@/lib/vuelos/data";
import { VolverAVuelos } from "../../../../ui/dashboard/vuelos/volver-a-vuelos";
import { VueloForm } from "../../../../ui/dashboard/vuelos/vuelo-form";

export const metadata: Metadata = { title: "Editar vuelo | AR Jet" };

export default async function EditarVueloPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0 || id > 2147483647) notFound();
  const [vuelo, { aeropuertos, aviones }] = await Promise.all([obtenerVueloEditable(id), obtenerOpcionesFormulario()]);
  // Un vuelo cancelado o finalizado no tiene viajes por salir y no se puede editar.
  if (!vuelo) notFound();
  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <VolverAVuelos />
      <h1 className="text-2xl font-semibold">Editar vuelo {vuelo.numero}</h1>
      <VueloForm vuelo={vuelo} aeropuertos={aeropuertos} aviones={aviones} />
    </div>
  );
}
