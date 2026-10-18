import { ArrowRight, PlaneTakeoff } from "lucide-react";
import type { VueloDisponible } from "@/lib/pasajeros/tipos";
import { fechaLocal, ZONA_HORARIA } from "@/lib/vuelos/fechas";
import Link from "next/link";
import { rutaReserva } from "@/lib/pasajeros/rutas";

const precio = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });
const hora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: ZONA_HORARIA });

function Tarifa({ nombre, tarifa }: { nombre: string; tarifa: VueloDisponible["economy"] }) {
  return (
    <div className="min-w-0 border-t border-zinc-200 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
      <p className="text-sm font-medium text-zinc-600">{nombre}</p>
      <p className="mt-1 break-words text-lg font-semibold text-secondary">{precio.format(Number(tarifa.precio))}</p>
      <p className={`mt-1 text-xs ${tarifa.disponibles ? "text-zinc-500" : "text-red-600"}`}>
        {tarifa.disponibles ? `${tarifa.disponibles} ${tarifa.disponibles === 1 ? "asiento disponible" : "asientos disponibles"}` : "Sin asientos disponibles"}
      </p>
    </div>
  );
}

export function ResultadosVuelos({ vuelos, fecha }: { vuelos: VueloDisponible[]; fecha: string }) {
  if (!vuelos.length) return (
    <div className="flex flex-col items-center gap-3 bg-tertiary px-4 py-12 text-center">
      <PlaneTakeoff className="size-7 text-zinc-400" aria-hidden="true" />
      <p className="text-sm text-zinc-600">No hay vuelos disponibles para la búsqueda realizada</p>
    </div>
  );
  return (
    <section aria-label="Resultados de búsqueda" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Vuelos disponibles</h2>
        <p className="text-sm text-zinc-500">{fecha.split("-").reverse().join("/")} · {vuelos.length} {vuelos.length === 1 ? "vuelo" : "vuelos"}</p>
      </div>
      {vuelos.map((vuelo) => (
        <article key={vuelo.id} className="grid min-w-0 gap-5 rounded-md border border-zinc-200 p-5 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0 sm:col-span-2 lg:col-span-1">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-secondary">{vuelo.numero}</span><span className="text-zinc-500">Directo</span>
              {vuelo.demorado && <span className="rounded bg-primary/15 px-2 py-0.5 font-medium">Demorado</span>}
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="min-w-0">
                <p className="text-xl font-semibold">{hora.format(new Date(vuelo.partida))}</p>
                <p className="mt-1 text-sm font-medium">{vuelo.origen}</p>
                <p className="break-words text-xs text-zinc-500">{vuelo.origenCiudad}</p>
              </div>
              <ArrowRight className="size-5 text-zinc-400" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xl font-semibold">{hora.format(new Date(vuelo.llegada))}</p>
                <p className="mt-1 text-sm font-medium">{vuelo.destino}</p>
                <p className="break-words text-xs text-zinc-500">{vuelo.destinoCiudad}</p>
                {fechaLocal(new Date(vuelo.llegada)) !== fechaLocal(new Date(vuelo.partida)) && <p className="mt-1 text-xs font-medium text-secondary">Día siguiente</p>}
              </div>
            </div>
          </div>
          <Tarifa nombre="Economy" tarifa={vuelo.economy} /><Tarifa nombre="Primera" tarifa={vuelo.primera} />
          <div className="flex justify-end border-t border-zinc-100 pt-3 sm:col-span-2 lg:col-span-3">
            <Link href={rutaReserva(vuelo.id, vuelo.economy.disponibles ? "economy" : "primera")} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90" aria-label={`Seleccionar vuelo ${vuelo.numero}`}>
              Seleccionar vuelo<ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}
