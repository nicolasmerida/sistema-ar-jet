import { Campo, claseControl } from "@/app/ui/dashboard/vuelos/campo";
import type { DatosPasajero, ErrorPasajero } from "@/lib/pasajeros/reserva-validacion";
import { CantidadPasajes } from "./cantidad-pasajes";

export function PasajerosForm({ pasajeros, errores, avisoCantidad, pendiente, cambiar, cantidad, invalidarCantidad }: {
  pasajeros: DatosPasajero[]; errores?: ErrorPasajero[]; avisoCantidad?: string; pendiente: boolean;
  cambiar: (indice: number, campo: keyof DatosPasajero, valor: string) => void;
  cantidad: (valor: number) => void; invalidarCantidad: (invalida: boolean) => void;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="text-lg font-semibold">Pasajeros</h2>
        <CantidadPasajes cantidad={pasajeros.length} aviso={avisoCantidad} pendiente={pendiente} cambiar={cantidad} invalidar={invalidarCantidad} />
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
