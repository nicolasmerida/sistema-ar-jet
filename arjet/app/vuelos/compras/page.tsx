import { exigirPasajero } from "@/lib/pasajeros/sesion";
import { obtenerMisCompras } from "@/lib/documentos/data";
import { obtenerMisReservas } from "@/lib/pasajeros/mis-reservas-data";
import { ReservasManager } from "@/app/ui/pasajeros/reservas/reservas-manager";

export default async function MisComprasPage() {
  const usuario = await exigirPasajero("/vuelos/compras");
  const [compras, reservas] = await Promise.all([obtenerMisCompras(usuario.id), obtenerMisReservas(usuario.id)]);
  const ids = new Set(compras.map((compra) => compra.codigo));
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <h1 className="mb-6 text-2xl font-semibold">Mis compras</h1>
      <ReservasManager reservas={reservas.filter((r) => ids.has(r.codigo))} compras={compras} />
    </section>
  );
}
