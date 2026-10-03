import { todaysFlights } from "./dashboard-data";

export function FlightsTable() {
  return (
    <div className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-tertiary px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          Salidas de hoy
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
              <th scope="col" className="px-5 py-3 font-semibold">
                Vuelo
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Ruta
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Salida
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {todaysFlights.map((flight) => (
              <tr
                key={`${flight.flight}-${flight.departure}`}
                className="hover:bg-tertiary/60"
              >
                <td className="px-5 py-4 font-medium text-foreground">
                  {flight.flight}
                </td>
                <td className="px-5 py-4 text-zinc-600">{flight.route}</td>
                <td className="px-5 py-4 text-zinc-600">
                  {flight.departure}
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={flight.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isCanceled = status === "Cancelado";

  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${
        isCanceled
          ? "bg-red-50 text-red-700 ring-1 ring-red-200"
          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
      }`}
    >
      {status}
    </span>
  );
}
