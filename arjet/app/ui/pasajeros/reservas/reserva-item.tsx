import Link from "next/link";
import { ChevronDown, ExternalLink, XCircle } from "lucide-react";
import type { ReservaCliente } from "@/lib/pasajeros/mis-reservas-data";
import { fechaHora } from "@/app/ui/vuelos/reserva/formato";
import { EstadoReserva } from "./estado-reserva";

export type SeleccionCancelacion = { codigo: number; idPasaje?: number; descripcion: string };

export function ReservaItem({ reserva, cancelar }: { reserva: ReservaCliente; cancelar: (seleccion: SeleccionCancelacion) => void }) {
  const activos = reserva.pasajes.filter((p) => !p.cancelado);
  const bloqueo = activos.find((p) => p.bloqueo)?.bloqueo;
  return (
    <details className="group rounded-md border border-zinc-200">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 rounded-md bg-tertiary px-4 py-4 text-sm focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 font-semibold text-secondary">Reserva RES-{reserva.codigo} <span className="font-normal text-zinc-600">· {reserva.pasajes[0]?.numero ?? "Sin vuelo"}</span></span>
        <span className="flex items-center gap-3"><EstadoReserva estado={reserva.estado} /><ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" /></span>
      </summary>
      <div className="p-4">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs text-zinc-500"><tr>{["Pasajero", "Vuelo y ruta", "Salida", "Clase", "Estado", ""].map((titulo, i) => <th key={i} scope="col" className="px-3 py-3 font-medium">{titulo || <span className="sr-only">Acciones</span>}</th>)}</tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {reserva.pasajes.map((pasaje) => (
                <tr key={pasaje.id} className={pasaje.cancelado ? "text-zinc-400" : "text-zinc-700"}>
                  <td className="px-3 py-4"><p className="font-medium">{pasaje.pasajero.nombre} {pasaje.pasajero.apellido}</p><p className="mt-1 text-xs text-zinc-500">Documento: {pasaje.pasajero.dni}</p></td>
                  <td className="px-3 py-4"><p className="font-medium">{pasaje.numero} · {pasaje.origen.codigo_iata} → {pasaje.destino.codigo_iata}</p><p className="mt-1 text-xs text-zinc-500">{pasaje.origen.ciudad} → {pasaje.destino.ciudad}</p></td>
                  <td className="whitespace-nowrap px-3 py-4">{fechaHora(pasaje.partida)}</td>
                  <td className="px-3 py-4">{pasaje.clase === "economy" ? "Economy" : "Primera"}</td>
                  <td className="px-3 py-4"><EstadoReserva estado={pasaje.cancelado ? "cancelado" : pasaje.estadoViaje} /></td>
                  <td className="px-3 py-4">{!pasaje.cancelado && <div className="flex max-w-52 flex-col gap-2">
                    <button type="button" disabled={Boolean(pasaje.bloqueo)} onClick={() => cancelar({ codigo: reserva.codigo, idPasaje: pasaje.id, descripcion: `${pasaje.pasajero.nombre} ${pasaje.pasajero.apellido} · Vuelo ${pasaje.numero}` })}
                      className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-semibold text-red-700 hover:underline disabled:cursor-not-allowed disabled:text-zinc-400 disabled:no-underline"><XCircle className="size-4 shrink-0" aria-hidden="true" />Cancelar pasaje</button>
                    {pasaje.bloqueo && <p className="text-xs text-zinc-500">{pasaje.bloqueo}</p>}
                  </div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4">
          <Link href={`/vuelos/reservas/${reserva.codigo}`} className="inline-flex items-center gap-2 text-sm font-semibold text-secondary"><ExternalLink className="size-4" aria-hidden="true" />Ver resumen</Link>
          {activos.length > 0 && <button type="button" disabled={Boolean(bloqueo)} onClick={() => cancelar({ codigo: reserva.codigo, descripcion: `Todos los pasajes activos de RES-${reserva.codigo} (${activos.length})` })}
            className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"><XCircle className="size-4" aria-hidden="true" />Cancelar reserva</button>}
        </div>
      </div>
    </details>
  );
}
