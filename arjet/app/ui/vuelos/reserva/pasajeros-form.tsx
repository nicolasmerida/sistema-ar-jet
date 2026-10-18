import { Minus, Plus } from "lucide-react";
import { Campo, claseControl } from "@/app/ui/dashboard/vuelos/campo";
import type { DatosPasajero, ErrorPasajero } from "@/lib/pasajeros/reserva-validacion";

export function PasajerosForm({ pasajeros, errores, disponibles, pendiente, cambiar, cantidad }: {
  pasajeros: DatosPasajero[]; errores?: ErrorPasajero[]; disponibles: number; pendiente: boolean;
  cambiar: (indice: number, campo: keyof DatosPasajero, valor: string) => void;
  cantidad: (valor: number) => void;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Pasajeros</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="cantidad-pasajeros" className="mr-2 text-sm font-medium">Cantidad</label>
          <button type="button" title="Quitar pasajero" aria-label="Quitar pasajero" disabled={pendiente || pasajeros.length <= 1} onClick={() => cantidad(pasajeros.length - 1)} className="flex size-9 items-center justify-center rounded-md border border-zinc-300 disabled:opacity-40"><Minus className="size-4" aria-hidden="true" /></button>
          <input id="cantidad-pasajeros" type="number" min={1} max={disponibles} value={pasajeros.length} disabled={pendiente}
            onChange={(e) => { const valor = Number(e.target.value); if (Number.isInteger(valor) && valor >= 1 && valor <= disponibles) cantidad(valor); }}
            className="h-9 w-16 rounded-md border border-zinc-300 text-center text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30" />
          <button type="button" title="Agregar pasajero" aria-label="Agregar pasajero" disabled={pendiente || pasajeros.length >= disponibles} onClick={() => cantidad(pasajeros.length + 1)} className="flex size-9 items-center justify-center rounded-md border border-zinc-300 disabled:opacity-40"><Plus className="size-4" aria-hidden="true" /></button>
        </div>
      </div>
      <div className="grid items-start gap-4 sm:grid-cols-2">
        {pasajeros.map((pasajero, indice) => (
          <fieldset key={indice} disabled={pendiente} className="grid min-w-0 gap-4 rounded-md border border-zinc-200 px-4 pb-5">
            <legend className="px-1 text-sm font-semibold">Pasajero {indice + 1}</legend>
            {(["nombre", "apellido", "dni"] as const).map((campo) => {
              const id = `pasajero-${indice}-${campo}`;
              const error = errores?.[indice]?.[campo];
              return (
                <Campo key={campo} id={id} etiqueta={{ nombre: "Nombre", apellido: "Apellido", dni: "Documento" }[campo]} error={error}>
                  <input id={id} name={id} required value={pasajero[campo]} maxLength={campo === "dni" ? 26 : 100}
                    autoComplete={campo === "dni" ? "off" : `section-pasajero${indice} ${campo === "nombre" ? "given-name" : "family-name"}`}
                    aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
                    onChange={(e) => cambiar(indice, campo, e.target.value)} className={claseControl(error)} />
                </Campo>
              );
            })}
          </fieldset>
        ))}
      </div>
    </section>
  );
}
