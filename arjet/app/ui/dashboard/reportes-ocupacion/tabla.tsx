import type { FilaOcupacion } from "@/lib/reportes/ocupacion/tipos";
import { ZONA_HORARIA } from "@/lib/vuelos/fechas";
import { EstadoBadge } from "../vuelos/estado-badge";

export function formatoPorcentaje(valor: number | null) {
  return valor === null ? "—" : `${valor.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
}

export function TablaOcupacion({ filas }: { filas: FilaOcupacion[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-background shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
          <caption className="border-b border-zinc-200 px-5 py-4 text-left font-semibold">Ocupación por viaje y clase</caption>
          <thead><tr className="border-b border-zinc-200 bg-tertiary text-xs text-zinc-500">
            {["Fecha de salida", "Vuelo", "Clase", "Estado", "Capacidad", "Pasajes vendidos", "Asientos libres", "Ocupación"].map((titulo, i) => <th key={titulo} scope="col" className={`px-5 py-3 font-semibold ${i >= 4 ? "text-right" : ""}`}>{titulo}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-zinc-200">
            {filas.length === 0 ? <tr><td colSpan={8} className="px-5 py-12 text-center text-zinc-500">No hay datos de ocupación para los filtros seleccionados</td></tr> : filas.map(fila => (
              <tr key={`${fila.viaje}:${fila.clase}`} className={fila.estado === "cancelado" ? "bg-red-50/40" : "hover:bg-tertiary/60"}>
                <td className="whitespace-nowrap px-5 py-4">{new Date(fila.fecha).toLocaleString("es-AR", { timeZone: ZONA_HORARIA, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                <td className="px-5 py-4"><span className="font-semibold">{fila.vuelo}</span><span className="mt-1 block whitespace-nowrap text-xs text-zinc-500">{fila.ruta}</span></td>
                <td className="px-5 py-4">{fila.clase === "economy" ? "Economy" : "Primera"}</td>
                <td className="px-5 py-4"><EstadoBadge estado={fila.estado} /></td>
                {[fila.capacidad, fila.vendidos, fila.libres].map((valor, i) => <td key={i} className="px-5 py-4 text-right tabular-nums">{valor.toLocaleString("es-AR")}</td>)}
                <td className="px-5 py-4 text-right font-semibold tabular-nums" title={fila.capacidad === 0 ? "El avión no tiene asientos de esta clase" : undefined}>{formatoPorcentaje(fila.porcentaje)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
