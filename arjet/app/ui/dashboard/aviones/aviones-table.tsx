import type { AvionListado } from "./aviones-data";

export function AvionesTable({ aviones, hayBusqueda, onEditar, onEliminar }: {
  aviones: AvionListado[]; hayBusqueda: boolean; onEditar: (avion: AvionListado) => void; onEliminar: (avion: AvionListado) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-background shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead><tr className="border-b border-zinc-200 bg-tertiary text-xs text-zinc-500">
            {["Matrícula", "Modelo", "Economy", "Primera clase", "Estado", "Acciones"].map((label) => <th key={label} scope="col" className={`px-5 py-3 font-semibold ${label === "Acciones" ? "text-right" : ""}`}>{label}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-zinc-200">
            {aviones.length === 0 ? <tr><td colSpan={6} className="px-5 py-12 text-center text-zinc-500">{hayBusqueda ? "No hay aviones que coincidan con la búsqueda." : "Todavía no hay aviones registrados."}</td></tr> : aviones.map((avion) => (
              <tr key={avion.id} className="hover:bg-tertiary/60">
                <td className="px-5 py-4 font-mono font-medium">{avion.matricula}</td>
                <td className="px-5 py-4">{avion.modelo}</td>
                <td className="px-5 py-4">{avion.capacidadEconomy}<span className="block text-xs text-zinc-500">asientos</span></td>
                <td className="px-5 py-4">{avion.capacidadPrimera}<span className="block text-xs text-zinc-500">asientos</span></td>
                <td className="px-5 py-4"><span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${avion.vuelosVigentes > 0 ? "bg-primary/15 text-primary-foreground" : "bg-tertiary text-zinc-600"}`}>{avion.vuelosVigentes > 0 ? "Asignado a vuelos" : "Sin vuelos vigentes"}</span></td>
                <td className="px-5 py-4"><div className="flex justify-end gap-4">
                  <button type="button" onClick={() => onEditar(avion)} aria-label={`Editar avión ${avion.matricula}`} className="font-medium text-secondary underline-offset-4 hover:underline">Editar</button>
                  <button type="button" onClick={() => onEliminar(avion)} aria-label={`Eliminar avión ${avion.matricula}`} className="font-medium text-red-600 underline-offset-4 hover:underline">Eliminar</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
