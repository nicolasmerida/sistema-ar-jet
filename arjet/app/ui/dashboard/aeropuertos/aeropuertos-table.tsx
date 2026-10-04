import type { AeropuertoListado } from "@/lib/aeropuertos/data";

type AeropuertosTableProps = {
  aeropuertos: AeropuertoListado[];
  hayBusqueda: boolean;
  onEditar: (aeropuerto: AeropuertoListado) => void;
  onEliminar: (aeropuerto: AeropuertoListado) => void;
};

export function AeropuertosTable({
  aeropuertos,
  hayBusqueda,
  onEditar,
  onEliminar,
}: AeropuertosTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-tertiary text-xs uppercase text-zinc-500">
              <th scope="col" className="px-5 py-3 font-semibold">
                Código
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Nombre
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Ciudad
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                País
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Estado
              </th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {aeropuertos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-zinc-500">
                  {hayBusqueda
                    ? "No hay aeropuertos que coincidan con la búsqueda."
                    : "Todavía no hay aeropuertos cargados."}
                </td>
              </tr>
            ) : (
              aeropuertos.map((aeropuerto) => (
                <tr key={aeropuerto.id} className="hover:bg-tertiary/60">
                  <td className="px-5 py-4 font-mono font-semibold text-foreground">
                    {aeropuerto.codigo}
                  </td>
                  <td className="px-5 py-4 text-foreground">
                    {aeropuerto.nombre}
                  </td>
                  <td className="px-5 py-4 text-zinc-600">
                    {aeropuerto.ciudad}
                  </td>
                  <td className="px-5 py-4 text-zinc-600">
                    {aeropuerto.pais || "-"}
                  </td>
                  <td className="px-5 py-4">
                    <EstadoBadge vuelosVigentes={aeropuerto.vuelosVigentes} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => onEditar(aeropuerto)}
                        className="font-medium text-secondary underline-offset-4 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onEliminar(aeropuerto)}
                        className="font-medium text-red-600 underline-offset-4 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EstadoBadge({ vuelosVigentes }: { vuelosVigentes: number }) {
  if (vuelosVigentes === 0) {
    return (
      <span className="inline-flex rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200">
        Sin vuelos vigentes
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-md bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary-foreground ring-1 ring-primary/30">
      {vuelosVigentes} {vuelosVigentes === 1 ? "vuelo vigente" : "vuelos vigentes"}
    </span>
  );
}
