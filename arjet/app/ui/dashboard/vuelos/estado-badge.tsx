import type { EstadoViaje, EstadoVuelo } from "@/lib/vuelos/tipos";
import { ETIQUETAS_ESTADO } from "./formato";

const ESTILOS: Record<EstadoVuelo | EstadoViaje, string> = {
  programado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  en_curso: "bg-primary/15 text-foreground ring-primary/40",
  demorado: "bg-amber-50 text-amber-800 ring-amber-200",
  cancelado: "bg-red-50 text-red-700 ring-red-200",
  finalizado: "bg-tertiary text-zinc-600 ring-zinc-200",
};

export function EstadoBadge({ estado }: { estado: EstadoVuelo | EstadoViaje }) {
  return (
    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${ESTILOS[estado]}`}>
      {ETIQUETAS_ESTADO[estado]}
    </span>
  );
}
