import { PlaneTakeoff } from "lucide-react";
import { dinero, fechaHora } from "../reserva/formato";

export function ResumenPago({ numero, origen, destino, partida, clase, cantidad, total }: {
  numero: string; origen: string; destino: string; partida: string; clase: string; cantidad: number; total: string;
}) {
  return (
    <section aria-labelledby="resumen-pago-titulo" className="min-w-0 border-b border-zinc-200 pb-6 lg:border-b-0 lg:border-r lg:pr-6">
      <h2 id="resumen-pago-titulo" className="mb-5 text-lg font-semibold">Resumen de la compra</h2>
      <p className="flex items-center gap-2 font-semibold text-secondary"><PlaneTakeoff className="size-4 shrink-0" aria-hidden="true" />Vuelo {numero}</p>
      <p className="mt-3 text-sm">{origen} → {destino}</p>
      <p className="mt-2 text-sm text-zinc-500">{fechaHora(partida)}</p>
      <p className="mt-4 text-sm">{cantidad} {cantidad === 1 ? "pasajero" : "pasajeros"} · {clase === "economy" ? "Economy" : "Primera"}</p>
      <div className="mt-6 border-t border-zinc-200 pt-4"><p className="text-sm text-zinc-500">Total a pagar · ARS</p><p className="mt-1 break-words text-2xl font-semibold text-secondary">{dinero(total)}</p></div>
    </section>
  );
}
