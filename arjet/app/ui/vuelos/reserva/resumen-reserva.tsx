import Link from "next/link";
import { ArrowLeft, PlaneTakeoff } from "lucide-react";
import type { obtenerResumenReserva } from "@/lib/pasajeros/reserva-data";
import { dinero, fechaHora } from "./formato";
import { PasosReserva } from "./pasos-reserva";
import { SeleccionPago } from "./seleccion-pago";

export function ResumenReserva({ reserva }: { reserva: NonNullable<Awaited<ReturnType<typeof obtenerResumenReserva>>> }) {
  return (
    <div className="flex flex-col gap-6">
      <PasosReserva reservada />
      <h1 className="text-2xl font-semibold">Pago y confirmación</h1>
      {reserva.pago.referencia && <dl className="grid gap-2 border-l-4 border-primary bg-tertiary p-4 text-sm sm:grid-cols-2">
        <div><dt className="text-zinc-500">Referencia del pago</dt><dd className="break-all font-medium">{reserva.pago.referencia}</dd></div>
        <div><dt className="text-zinc-500">Importe abonado</dt><dd className="font-medium">{dinero(reserva.pago.importe ?? "0")}</dd></div>
        <div><dt className="text-zinc-500">Tarjeta</dt><dd>Terminada en {reserva.pago.ultimos4}</dd></div>
        {reserva.pago.fecha && <div><dt className="text-zinc-500">Fecha de pago</dt><dd>{fechaHora(reserva.pago.fecha)}</dd></div>}
      </dl>}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-10">
        <section aria-labelledby="resumen-vuelo-titulo" className="min-w-0 lg:border-r lg:border-zinc-200 lg:pr-8">
          <h2 id="resumen-vuelo-titulo" className="mb-5 text-lg font-semibold">Resumen de vuelo</h2>
          <div className="border-y border-zinc-200 bg-tertiary px-4 py-5">
            <p className="flex items-center gap-2 font-semibold text-secondary"><PlaneTakeoff className="size-4 shrink-0" aria-hidden="true" />Vuelo {reserva.numero}</p>
            <p className="mt-2 text-sm">{reserva.origen.ciudad} ({reserva.origen.codigo_iata}) → {reserva.destino.ciudad} ({reserva.destino.codigo_iata})</p>
            <p className="mt-2 text-sm text-zinc-600">Salida: {fechaHora(reserva.partida)} · Llegada: {fechaHora(reserva.llegada)}</p>
            <p className="mt-2 text-sm">Clase {reserva.clase === "economy" ? "Economy" : "Primera"} · {dinero(reserva.precio)} por pasajero</p>
          </div>
          <h3 className="mb-2 mt-6 text-sm font-semibold">{reserva.pasajeros.length} {reserva.pasajeros.length === 1 ? "pasajero" : "pasajeros"}</h3>
          <ul className="divide-y divide-zinc-200">
            {reserva.pasajeros.map((p) => <li key={p.dni} className={`flex flex-wrap justify-between gap-2 py-3 text-sm ${p.cancelado ? "text-zinc-400" : ""}`}><span className="font-medium">{p.nombre} {p.apellido}{p.cancelado && <span className="ml-2 text-xs text-red-600">Cancelado</span>}</span><span className="text-zinc-500">Documento: {p.dni}</span></li>)}
          </ul>
          <div className="mt-4 border-t border-zinc-200 pt-5">
            <p className="text-sm text-zinc-500">Total de pasajes activos</p><p className="text-2xl font-semibold text-secondary">{dinero(reserva.total)}</p>
          </div>
        </section>
        <SeleccionPago key={`${reserva.codigo}-${reserva.modalidad ?? "pendiente"}`} codigo={reserva.codigo} total={reserva.total} partida={reserva.partida}
          modalidadGuardada={reserva.modalidad} puedeConfirmar={reserva.puedeConfirmar} estado={reserva.estado} />
      </div>
      <Link href="/vuelos/reservas" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-secondary"><ArrowLeft className="size-4" aria-hidden="true" />Volver a mis reservas</Link>
    </div>
  );
}
