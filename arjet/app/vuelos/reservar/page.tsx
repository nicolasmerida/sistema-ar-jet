import Link from "next/link";
import { notFound } from "next/navigation";
import { ReservaForm } from "@/app/ui/vuelos/reserva/reserva-form";
import { obtenerVueloReserva } from "@/lib/pasajeros/reserva-data";
import { exigirPasajero } from "@/lib/pasajeros/sesion";
import { rutaReserva } from "@/lib/pasajeros/rutas";

export default async function ReservarPage({ searchParams }: PageProps<"/vuelos/reservar">) {
  const params = await searchParams;
  const id = Number(params.viaje);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const clase = params.clase === "primera" ? "primera" : "economy";
  await exigirPasajero(rutaReserva(id, clase));
  const datos = await obtenerVueloReserva(id);
  return (
      <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10">
        {datos ? <ReservaForm vuelo={datos.vuelo} busqueda={datos.busqueda} claseInicial={clase} /> : (
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold">Vuelo no disponible</h1>
            <p role="status" className="text-sm text-zinc-600">El vuelo ya no tiene asientos disponibles o dejó de operar.</p>
            <Link href="/vuelos" className="text-sm font-semibold text-secondary underline">Volver a buscar vuelos</Link>
          </div>
        )}
      </section>
  );
}
