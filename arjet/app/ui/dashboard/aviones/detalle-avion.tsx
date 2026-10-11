import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { DetalleAvion } from "@/lib/aviones/tipos";
import { BadgeBaja } from "../baja/badge-baja";
import { EstadoBadge } from "../vuelos/estado-badge";
import { diaYMesDeInstante, fechaDeInstante, horaDeInstante, mismoDia } from "../vuelos/formato";

const COLUMNAS = ["Fecha", "Vuelo", "Ruta", "Horario", "Estado"];

export function DetalleAvionVista({ avion }: { avion: DetalleAvion }) {
  const datos = [
    { etiqueta: "Modelo", valor: avion.modelo },
    { etiqueta: "Capacidad Economy", valor: `${avion.capacidadEconomy} asientos` },
    { etiqueta: "Capacidad Primera clase", valor: `${avion.capacidadPrimera} asientos` },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/aviones" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-secondary underline-offset-4 hover:underline">
          <ArrowLeft className="size-4" aria-hidden="true" />Volver a aviones
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">Avión <span className="font-mono">{avion.matricula}</span></h1>
          {avion.estado === "de_baja" ? <BadgeBaja fechaBaja={avion.fechaBaja} /> : (
            <span className="inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">Activo</span>
          )}
        </div>
      </div>
      <dl className="grid gap-4 rounded-2xl border border-zinc-200 bg-background p-6 shadow-sm sm:grid-cols-3">
        {datos.map((dato) => (
          <div key={dato.etiqueta}>
            <dt className="text-xs text-zinc-500">{dato.etiqueta}</dt>
            <dd className="mt-1 text-sm font-medium">{dato.valor}</dd>
          </div>
        ))}
      </dl>
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Viajes asignados</h2>
          <p className="mt-1 text-sm text-zinc-500">Todos los viajes que tuvo asignados. Los cancelados muestran el motivo.</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-background shadow-sm">
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="sticky top-0"><tr className="border-b border-zinc-200 bg-tertiary text-xs text-zinc-500">
                {COLUMNAS.map((label) => <th key={label} scope="col" className="px-5 py-3 font-semibold">{label}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-zinc-200">
                {avion.viajes.length === 0 ? (
                  <tr><td colSpan={COLUMNAS.length} className="px-5 py-12 text-center text-zinc-500">Este avión todavía no tuvo viajes asignados.</td></tr>
                ) : avion.viajes.map((viaje) => (
                  <tr key={viaje.id} className="align-top hover:bg-tertiary/60">
                    <td className="px-5 py-4 whitespace-nowrap capitalize">{fechaDeInstante(viaje.partida)}</td>
                    <td className="px-5 py-4 font-mono font-medium">
                      <Link href={`/dashboard/vuelos/${viaje.idVuelo}`} className="text-secondary underline-offset-4 hover:underline">{viaje.numero}</Link>
                    </td>
                    <td className="px-5 py-4">{viaje.origen} → {viaje.destino}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {mismoDia(viaje.partida, viaje.llegada)
                        ? `${horaDeInstante(viaje.partida)} – ${horaDeInstante(viaje.llegada)}`
                        : `${horaDeInstante(viaje.partida)} → ${diaYMesDeInstante(viaje.llegada)} ${horaDeInstante(viaje.llegada)}`}
                    </td>
                    <td className="px-5 py-4">
                      <EstadoBadge estado={viaje.estado} />
                      {viaje.motivoCancelacion && <p className="mt-1.5 max-w-xs text-xs text-zinc-500">Motivo: {viaje.motivoCancelacion}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
