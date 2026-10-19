import type { Ocupacion } from "@/lib/mostrador/vuelos/tipos";

export function OcupacionClase({ etiqueta, ocupacion }: { etiqueta: string; ocupacion: Ocupacion }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium text-zinc-700">{etiqueta}</span>
        <span className="text-zinc-500">
          {ocupacion.capacidad === 0 ? "Sin asientos" : `${ocupacion.porcentaje}% · ${ocupacion.ocupados}/${ocupacion.capacidad}`}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`Ocupación de ${etiqueta.toLowerCase()}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={ocupacion.porcentaje}
        className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${ocupacion.porcentaje}%` }} />
      </div>
    </div>
  );
}
