import type { VueloEnEstado } from "@/lib/mostrador/vuelos/tipos";
import { EstadoBadge } from "@/app/ui/dashboard/vuelos/estado-badge";
import { fechaCortaDeInstante, horaDeInstante, mismoDia } from "@/app/ui/dashboard/vuelos/formato";
import { IndicadorEstado } from "./indicador-estado";
import { OcupacionClase } from "./ocupacion-clase";

export function VueloItem({ vuelo }: { vuelo: VueloEnEstado }) {
  const llegaOtroDia = !mismoDia(vuelo.partida, vuelo.llegada);

  return (
    <article className="rounded-md border border-zinc-200 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-t-md bg-tertiary px-4 py-4">
        <div className="min-w-0">
          <h2 className="font-semibold text-secondary">Vuelo {vuelo.numero}</h2>
          <p className="mt-1 text-xs text-zinc-600">
            Ruta: {vuelo.origen.ciudad} ({vuelo.origen.codigo_iata}) → {vuelo.destino.ciudad} ({vuelo.destino.codigo_iata})
          </p>
        </div>
        <EstadoBadge estado={vuelo.estado} />
      </header>

      <div className="grid gap-6 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)]">
        <dl className="flex flex-col gap-3 text-sm">
          <div>
            <dt className="text-xs text-zinc-500">Salida programada</dt>
            <dd className="font-medium">{horaDeInstante(vuelo.partida)} hs</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Llegada estimada</dt>
            <dd className="font-medium">
              {horaDeInstante(vuelo.llegada)} hs
              {llegaOtroDia && <span className="ml-1 text-xs font-normal text-zinc-500">({fechaCortaDeInstante(vuelo.llegada)})</span>}
            </dd>
          </div>
        </dl>

        <IndicadorEstado estado={vuelo.estado} />

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-zinc-500">Ocupación del vuelo</p>
          <OcupacionClase etiqueta="Clase económica" ocupacion={vuelo.economy} />
          <OcupacionClase etiqueta="Primera clase" ocupacion={vuelo.primera} />
        </div>
      </div>

      {vuelo.motivo && (
        <p className="border-t border-zinc-100 px-4 py-3 text-sm text-zinc-700">
          <span className="font-medium">Motivo:</span> {vuelo.motivo}
        </p>
      )}
    </article>
  );
}
