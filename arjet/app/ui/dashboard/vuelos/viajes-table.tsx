"use client";

import { useState } from "react";
import { cancelarViaje } from "@/lib/vuelos/actions";
import type { DetalleVuelo, ViajeDetalle } from "@/lib/vuelos/tipos";
import { Aviso, type DatosAviso } from "../aviones/aviso";
import { CancelarViajeModal } from "./cancelar-viaje-modal";
import { EstadoBadge } from "./estado-badge";
import { fechaDeInstante, horaDeInstante } from "./formato";

const COLUMNAS = ["Fecha", "Horario", "Avión", "Reservas activas", "Estado", "Acciones"];

export function ViajesTable({ vuelo }: { vuelo: DetalleVuelo }) {
  const [soloProximos, setSoloProximos] = useState(true);
  const [seleccionado, setSeleccionado] = useState<ViajeDetalle | null>(null);
  const [aviso, setAviso] = useState<DatosAviso | null>(null);
  const viajes = soloProximos
    ? vuelo.viajes.filter((viaje) => !viaje.yaSalio)
    : vuelo.viajes;
  const ruta = `${vuelo.origen}-${vuelo.destino}`;

  async function confirmar(motivo: string) {
    if (!seleccionado) return { ok: false as const, mensaje: "Seleccioná un viaje" };
    const resultado = await cancelarViaje(seleccionado.id, motivo);
    if (resultado.ok) {
      setSeleccionado(null);
      setAviso({ tipo: "exito", mensaje: resultado.mensaje });
    }
    return resultado;
  }

  return (
    <section id="viajes" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Viajes</h2>
          <p className="mt-1 text-sm text-zinc-500">Cada fecha de operación es un viaje que se puede cancelar por separado.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input type="checkbox" checked={soloProximos} onChange={(event) => setSoloProximos(event.target.checked)} className="size-4 accent-primary" />
          Mostrar solo los próximos
        </label>
      </div>
      {aviso && <Aviso {...aviso} onCerrar={() => setAviso(null)} />}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-background shadow-sm">
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="sticky top-0"><tr className="border-b border-zinc-200 bg-tertiary text-xs text-zinc-500">
              {COLUMNAS.map((label) => <th key={label} scope="col" className={`px-5 py-3 font-semibold ${label === "Acciones" ? "text-right" : ""}`}>{label}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-zinc-200">
              {viajes.length === 0 ? (
                <tr><td colSpan={COLUMNAS.length} className="px-5 py-12 text-center text-zinc-500">No hay viajes próximos.</td></tr>
              ) : viajes.map((viaje) => (
                <tr key={viaje.id} className="align-top hover:bg-tertiary/60">
                  <td className="px-5 py-4 whitespace-nowrap capitalize">{fechaDeInstante(viaje.partida)}</td>
                  <td className="px-5 py-4 whitespace-nowrap">{horaDeInstante(viaje.partida)} – {horaDeInstante(viaje.llegada)}</td>
                  <td className="px-5 py-4 font-mono">{viaje.avion}</td>
                  <td className="px-5 py-4">{viaje.reservasActivas}</td>
                  <td className="px-5 py-4">
                    <EstadoBadge estado={viaje.estado} />
                    {viaje.motivoCancelacion && <p className="mt-1.5 max-w-xs text-xs text-zinc-500">Motivo: {viaje.motivoCancelacion}</p>}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {!viaje.yaSalio && viaje.estado !== "cancelado" && (
                      <button type="button" onClick={() => setSeleccionado(viaje)} aria-label={`Cancelar viaje del ${fechaDeInstante(viaje.partida)}`} className="font-medium text-red-600 underline-offset-4 hover:underline">Cancelar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {seleccionado && (
        <CancelarViajeModal numero={vuelo.numero} ruta={ruta} viaje={seleccionado} onCerrar={() => setSeleccionado(null)} onConfirmar={confirmar} />
      )}
    </section>
  );
}
