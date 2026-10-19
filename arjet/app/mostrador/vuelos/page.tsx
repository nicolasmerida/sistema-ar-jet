import type { Metadata } from "next";
import { connection } from "next/server";
import { exigirEmpleado } from "@/lib/mostrador/sesion";
import { buscarEstadoVuelos, obtenerAeropuertosFiltro } from "@/lib/mostrador/vuelos/data";
import { hoyEnArgentina } from "@/lib/vuelos/fechas";
import { EstadoVuelos } from "@/app/ui/mostrador/vuelos/estado-vuelos";

export const metadata: Metadata = { title: "Estado de vuelos | AR Jet" };

export default async function EstadoVuelosPage() {
  // El estado depende de la hora actual y de lo que cambie el administrador: siempre se lee de la base.
  await connection();
  await exigirEmpleado("/mostrador/vuelos");

  const hoy = hoyEnArgentina();
  const [aeropuertos, inicial] = await Promise.all([
    obtenerAeropuertosFiltro(),
    buscarEstadoVuelos({ fecha: hoy, origen: null, destino: null, numero: null }),
  ]);

  return (
    <section className="w-full px-4 py-8 sm:px-6 lg:px-10">
      <h1 className="text-2xl font-semibold">Estado de vuelos</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">
        Consultá el estado actual de los vuelos para informar a los pasajeros sobre demoras, cambios de horario o cancelaciones.
      </p>
      <EstadoVuelos aeropuertos={aeropuertos} hoy={hoy} inicial={{ ok: true, ...inicial }} />
    </section>
  );
}
