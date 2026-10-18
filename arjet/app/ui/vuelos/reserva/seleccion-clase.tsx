import type { VueloDisponible } from "@/lib/pasajeros/tipos";
import type { ClaseReserva } from "@/lib/pasajeros/reserva-validacion";
import { dinero } from "./formato";

export function SeleccionClase({ vuelo, clase, cambiar, pendiente }: {
  vuelo: VueloDisponible; clase: ClaseReserva; cambiar: (clase: ClaseReserva) => void; pendiente: boolean;
}) {
  return (
    <fieldset disabled={pendiente} className="flex flex-col gap-3">
      <legend className="mb-3 text-sm font-semibold">Clase</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["economy", "primera"] as const).map((opcion) => {
          const tarifa = vuelo[opcion];
          return (
            <label key={opcion} className={`flex min-w-0 items-start gap-3 rounded-md border p-4 ${!tarifa.disponibles ? "cursor-not-allowed border-zinc-200 bg-tertiary text-zinc-500" : clase === opcion ? "border-primary bg-primary/5" : "cursor-pointer border-zinc-200"}`}>
              <input type="radio" name="clase" value={opcion} checked={clase === opcion} disabled={!tarifa.disponibles}
                onChange={() => cambiar(opcion)} className="mt-1 size-4 shrink-0 accent-primary" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{opcion === "economy" ? "Economy" : "Primera"} · {dinero(tarifa.precio)}</span>
                <span className="mt-1 block text-xs text-zinc-500">{tarifa.disponibles ? `${tarifa.disponibles} asientos disponibles` : "No hay asientos disponibles en esta clase"}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
