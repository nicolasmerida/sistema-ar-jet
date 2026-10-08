import { Search } from "lucide-react";
import type { EstadoVuelo } from "@/lib/vuelos/tipos";
import { ETIQUETAS_ESTADO } from "./formato";

export type ValoresFiltros = { numero: string; ruta: string; estado: EstadoVuelo | "" };

const ESTADOS: EstadoVuelo[] = ["programado", "cancelado", "finalizado"];
const CLASE_CONTROL =
  "w-full rounded-md border border-zinc-300 bg-background py-2.5 text-sm outline-none placeholder:text-zinc-400 focus:border-primary focus:ring-2 focus:ring-primary/30";

export function Filtros({ valores, onCambiar }: {
  valores: ValoresFiltros; onCambiar: (valores: ValoresFiltros) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_220px]">
      <div className="relative">
        <label htmlFor="filtro-numero" className="sr-only">Buscar por número de vuelo</label>
        <Search className="pointer-events-none absolute left-3 top-3 size-4 text-zinc-400" aria-hidden="true" />
        <input id="filtro-numero" type="search" value={valores.numero} placeholder="Buscar por número de vuelo"
          onChange={(event) => onCambiar({ ...valores, numero: event.target.value })} className={`${CLASE_CONTROL} pl-10 pr-3`} />
      </div>
      <div>
        <label htmlFor="filtro-ruta" className="sr-only">Origen o destino</label>
        <input id="filtro-ruta" type="search" value={valores.ruta} placeholder="Origen o destino"
          onChange={(event) => onCambiar({ ...valores, ruta: event.target.value })} className={`${CLASE_CONTROL} px-3`} />
      </div>
      <div>
        <label htmlFor="filtro-estado" className="sr-only">Estado</label>
        <select id="filtro-estado" value={valores.estado}
          onChange={(event) => onCambiar({ ...valores, estado: event.target.value as ValoresFiltros["estado"] })}
          className={`${CLASE_CONTROL} px-3`}>
          <option value="">Todos los estados</option>
          {ESTADOS.map((estado) => <option key={estado} value={estado}>{ETIQUETAS_ESTADO[estado]}</option>)}
        </select>
      </div>
    </div>
  );
}
