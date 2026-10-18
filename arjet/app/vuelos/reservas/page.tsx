import { exigirPasajero } from "@/lib/pasajeros/sesion";
import { obtenerMisReservas } from "@/lib/pasajeros/mis-reservas-data";
import { ReservasManager } from "@/app/ui/pasajeros/reservas/reservas-manager";

export default async function MisReservasPage() {
  const usuario = await exigirPasajero("/vuelos/reservas");
  const reservas = await obtenerMisReservas(usuario.id);
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <h1 className="mb-6 text-2xl font-semibold">Mis reservas</h1>
      <ReservasManager reservas={reservas} />
    </section>
  );
}
