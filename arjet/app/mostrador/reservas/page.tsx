import { exigirEmpleado } from "@/lib/mostrador/sesion";
import { ConsultaReservas } from "@/app/ui/mostrador/reservas/consulta-reservas";

export default async function ConsultaReservasPage() {
  await exigirEmpleado("/mostrador/reservas");

  return (
    <section className="w-full px-4 py-8 sm:px-6 lg:px-10">
      <h1 className="text-2xl font-semibold">Consulta de reservas</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-500">
        Buscá a un pasajero y sus vuelos por DNI, nombre y apellido o código de reserva.
      </p>
      <ConsultaReservas />
    </section>
  );
}
