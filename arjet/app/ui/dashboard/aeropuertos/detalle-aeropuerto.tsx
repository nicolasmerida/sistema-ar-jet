import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { DetalleAeropuerto } from "@/lib/aeropuertos/data";
import { BadgeBaja } from "../baja/badge-baja";
import { VuelosTable } from "../vuelos/vuelos-table";

export function DetalleAeropuertoVista({ aeropuerto }: { aeropuerto: DetalleAeropuerto }) {
  const datos = [
    { etiqueta: "Ciudad", valor: aeropuerto.ciudad },
    { etiqueta: "País", valor: aeropuerto.pais || "-" },
    { etiqueta: "Dirección", valor: aeropuerto.direccion || "-" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/aeropuertos" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-secondary underline-offset-4 hover:underline">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a aeropuertos
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">
            <span className="font-mono">{aeropuerto.codigo}</span> – {aeropuerto.nombre}
          </h1>
          {aeropuerto.estado === "de_baja" ? (
            <BadgeBaja fechaBaja={aeropuerto.fechaBaja} />
          ) : (
            <span className="inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">Activo</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-background p-6 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-3">
          {datos.map((dato) => (
            <div key={dato.etiqueta}>
              <dt className="text-xs text-zinc-500">{dato.etiqueta}</dt>
              <dd className="mt-1 text-sm font-medium">{dato.valor}</dd>
            </div>
          ))}
        </dl>
        <div>
          <p className="text-xs text-zinc-500">Descripción</p>
          <p className="mt-1 text-sm">{aeropuerto.descripcion || <span className="text-zinc-400">Sin descripción</span>}</p>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Vuelos vigentes</h2>
          <p className="mt-1 text-sm text-zinc-500">Vuelos con viajes por salir que parten de este aeropuerto o llegan a él.</p>
        </div>
        <VuelosTable vuelos={aeropuerto.vigentes} mensajeVacio="Sin vuelos vigentes." />
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Historial</h2>
          <p className="mt-1 text-sm text-zinc-500">Todos los vuelos que tuvo, con su estado. Los cancelados muestran el motivo.</p>
        </div>
        <VuelosTable vuelos={aeropuerto.historial} mensajeVacio="Este aeropuerto todavía no tuvo vuelos." mostrarMotivo />
      </section>
    </div>
  );
}
