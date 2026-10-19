import type { ReservaEncontrada } from "@/lib/mostrador/tipos";
import { EstadoReserva } from "@/app/ui/pasajeros/reservas/estado-reserva";
import { fechaHora } from "@/app/ui/vuelos/reserva/formato";

const COLUMNAS = ["Pasajero", "Vuelo y ruta", "Salida", "Clase", "Estado del pasaje"];

export function ReservaItem({ reserva }: { reserva: ReservaEncontrada }) {
  const { titular } = reserva;

  return (
    <article className="rounded-md border border-zinc-200 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-t-md bg-tertiary px-4 py-4 text-sm">
        <div className="min-w-0">
          <p className="font-semibold text-secondary">Reserva RES-{reserva.codigo}</p>
          <p className="mt-1 text-xs text-zinc-600">
            Titular: {titular.nombre} {titular.apellido} · Documento: {titular.dni}
          </p>
        </div>
        <EstadoReserva estado={reserva.estado} />
      </header>

      <div className="overflow-x-auto p-4">
        <table className="w-full min-w-[720px] text-left text-sm">
          <caption className="sr-only">Pasajes de la reserva RES-{reserva.codigo}</caption>
          <thead className="border-b border-zinc-200 text-xs text-zinc-500">
            <tr>
              {COLUMNAS.map((titulo) => (
                <th key={titulo} scope="col" className="px-3 py-3 font-medium">{titulo}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {reserva.pasajes.map((pasaje) => (
              <tr key={pasaje.id} className={pasaje.cancelado ? "text-zinc-400" : "text-zinc-700"}>
                <td className="px-3 py-4">
                  <p className="font-medium">{pasaje.pasajero.nombre} {pasaje.pasajero.apellido}</p>
                  <p className="mt-1 text-xs text-zinc-500">Documento: {pasaje.pasajero.dni}</p>
                </td>
                <td className="px-3 py-4">
                  <p className="font-medium">{pasaje.numero} · {pasaje.origen.codigo_iata} → {pasaje.destino.codigo_iata}</p>
                  <p className="mt-1 text-xs text-zinc-500">{pasaje.origen.ciudad} → {pasaje.destino.ciudad}</p>
                </td>
                <td className="whitespace-nowrap px-3 py-4">{fechaHora(pasaje.partida)}</td>
                <td className="px-3 py-4">{pasaje.clase === "economy" ? "Economy" : "Primera"}</td>
                <td className="px-3 py-4">
                  <EstadoReserva estado={pasaje.cancelado ? "cancelado" : pasaje.estadoViaje} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
