import type { EstadoViaje } from "@/lib/vuelos/tipos";

const OPCIONES: { estado: EstadoViaje; etiqueta: string; color: string }[] = [
  { estado: "programado", etiqueta: "En horario", color: "bg-emerald-500 border-emerald-500" },
  { estado: "demorado", etiqueta: "Demorado", color: "bg-amber-500 border-amber-500" },
  { estado: "cancelado", etiqueta: "Cancelado", color: "bg-red-500 border-red-500" },
  { estado: "en_curso", etiqueta: "En vuelo", color: "bg-primary border-primary" },
];

export function IndicadorEstado({ estado }: { estado: EstadoViaje }) {
  return (
    <ul aria-label="Estado del vuelo" className="flex flex-col gap-2 text-sm">
      {OPCIONES.map((opcion) => {
        const activa = opcion.estado === estado;
        return (
          <li key={opcion.estado} className={`flex items-center gap-2 ${activa ? "font-semibold text-foreground" : "text-zinc-400"}`}>
            <span aria-hidden="true" className={`size-3 rounded-full border-2 ${activa ? opcion.color : "border-zinc-300 bg-white"}`} />
            {opcion.etiqueta}
            {activa && <span className="sr-only"> (estado actual)</span>}
          </li>
        );
      })}
      {estado === "finalizado" && <li className="mt-1 text-xs text-zinc-500">El vuelo ya finalizó</li>}
    </ul>
  );
}
