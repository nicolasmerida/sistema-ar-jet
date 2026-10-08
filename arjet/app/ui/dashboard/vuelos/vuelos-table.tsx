import Link from "next/link";
import type { VueloListado } from "@/lib/vuelos/tipos";
import { EstadoBadge } from "./estado-badge";
import { diasDeOperacion, fechaCorta } from "./formato";

const COLUMNAS = ["N° de vuelo", "Ruta", "Horario", "Opera", "Vigencia", "Estado", "Acciones"];

export function VuelosTable({ vuelos, hayFiltros }: { vuelos: VueloListado[]; hayFiltros: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-background shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead><tr className="border-b border-zinc-200 bg-tertiary text-xs text-zinc-500">
            {COLUMNAS.map((label) => <th key={label} scope="col" className={`px-5 py-3 font-semibold ${label === "Acciones" ? "text-right" : ""}`}>{label}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-zinc-200">
            {vuelos.length === 0 ? (
              <tr><td colSpan={COLUMNAS.length} className="px-5 py-12 text-center text-zinc-500">
                {hayFiltros ? "No hay vuelos que coincidan con los filtros." : "Todavía no hay vuelos registrados."}
              </td></tr>
            ) : vuelos.map((vuelo) => (
              <tr key={vuelo.id} className="hover:bg-tertiary/60">
                <td className="px-5 py-4 font-mono font-medium">{vuelo.numero}</td>
                <td className="px-5 py-4" title={`${vuelo.origenCiudad} → ${vuelo.destinoCiudad}`}>{vuelo.origen} → {vuelo.destino}</td>
                <td className="px-5 py-4 whitespace-nowrap">{vuelo.horaSalida} – {vuelo.horaLlegada}</td>
                <td className="px-5 py-4 text-zinc-600">{diasDeOperacion(vuelo.dias)}</td>
                <td className="px-5 py-4 whitespace-nowrap text-zinc-600">{fechaCorta(vuelo.inicio)} – {fechaCorta(vuelo.fin)}</td>
                <td className="px-5 py-4"><EstadoBadge estado={vuelo.estado} /></td>
                <td className="px-5 py-4"><div className="flex justify-end gap-4 whitespace-nowrap">
                  {vuelo.estado === "programado" ? (
                    <>
                      <Link href={`/dashboard/vuelos/${vuelo.id}/editar`} aria-label={`Editar vuelo ${vuelo.numero}`} className="font-medium text-secondary underline-offset-4 hover:underline">Editar</Link>
                      <Link href={`/dashboard/vuelos/${vuelo.id}#viajes`} aria-label={`Cancelar viajes del vuelo ${vuelo.numero}`} className="font-medium text-red-600 underline-offset-4 hover:underline">Cancelar</Link>
                    </>
                  ) : (
                    <Link href={`/dashboard/vuelos/${vuelo.id}`} aria-label={`Ver detalle del vuelo ${vuelo.numero}`} className="font-medium text-secondary underline-offset-4 hover:underline">Ver detalle</Link>
                  )}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
