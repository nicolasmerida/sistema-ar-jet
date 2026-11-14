import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { exigirPasajero } from "@/lib/pasajeros/sesion";
import { obtenerResumenReserva } from "@/lib/pasajeros/reserva-data";
import { PagoForm } from "@/app/ui/vuelos/pago/pago-form";
import { PasosReserva } from "@/app/ui/vuelos/reserva/pasos-reserva";
import { ResumenPago } from "@/app/ui/vuelos/pago/resumen-pago";

export default async function PagoPage({ params }: PageProps<"/vuelos/reservas/[codigo]/pago">) {
  const id = Number((await params).codigo);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const usuario = await exigirPasajero(`/vuelos/reservas/${id}/pago`);
  const reserva = await obtenerResumenReserva(id, usuario.id);
  if (!reserva) notFound();
  if (reserva.estado === "pagado") redirect(`/vuelos/reservas/${id}`);
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10">
      <PasosReserva reservada />
      <h1 className="mb-6 text-2xl font-semibold">Pagar reserva</h1>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <ResumenPago numero={reserva.numero} origen={`${reserva.origen.ciudad} (${reserva.origen.codigo_iata})`} destino={`${reserva.destino.ciudad} (${reserva.destino.codigo_iata})`}
          partida={reserva.partida} clase={reserva.clase} cantidad={reserva.pasajeros.filter((p) => !p.cancelado).length} total={reserva.total} />
        {reserva.puedeConfirmar ? <PagoForm codigo={id} total={reserva.total} /> : <div className="flex flex-col gap-4"><p role="alert" className="text-sm text-red-700">La reserva ya no está vigente para realizar el pago.</p><Link href={`/vuelos/reservas/${id}`} className="text-sm font-semibold text-secondary underline">Volver al resumen</Link></div>}
      </div>
    </section>
  );
}
