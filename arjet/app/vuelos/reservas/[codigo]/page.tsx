import { notFound } from "next/navigation";
import { ResumenReserva } from "@/app/ui/vuelos/reserva/resumen-reserva";
import { obtenerResumenReserva } from "@/lib/pasajeros/reserva-data";
import { exigirPasajero } from "@/lib/pasajeros/sesion";

export default async function ResumenPage({ params }: PageProps<"/vuelos/reservas/[codigo]">) {
  const { codigo } = await params;
  const id = Number(codigo);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const usuario = await exigirPasajero(`/vuelos/reservas/${id}`);
  const resumen = await obtenerResumenReserva(id, usuario.id);
  if (!resumen) notFound();
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10"><ResumenReserva reserva={resumen} /></section>
  );
}
