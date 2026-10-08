import type { Metadata } from "next";
import { connection } from "next/server";
import { obtenerOpcionesFormulario } from "@/lib/vuelos/data";
import { VolverAVuelos } from "../../../ui/dashboard/vuelos/volver-a-vuelos";
import { VueloForm } from "../../../ui/dashboard/vuelos/vuelo-form";

export const metadata: Metadata = { title: "Nuevo vuelo | AR Jet" };

export default async function NuevoVueloPage() {
  await connection();
  const { aeropuertos, aviones } = await obtenerOpcionesFormulario();
  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <VolverAVuelos />
      <h1 className="text-2xl font-semibold">Nuevo vuelo</h1>
      <VueloForm aeropuertos={aeropuertos} aviones={aviones} />
    </div>
  );
}
