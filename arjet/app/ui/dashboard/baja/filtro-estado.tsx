import type { EstadoRegistro } from "@/lib/vuelos/tipos";

export type FiltroEstado = EstadoRegistro | "todos";

const OPCIONES: { valor: FiltroEstado; etiqueta: string }[] = [
  { valor: "activo", etiqueta: "Activos" },
  { valor: "de_baja", etiqueta: "De baja" },
  { valor: "todos", etiqueta: "Todos" },
];

export function filtrarPorEstado<T extends { estado: EstadoRegistro }>(registros: T[], filtro: FiltroEstado) {
  return filtro === "todos" ? registros : registros.filter((registro) => registro.estado === filtro);
}

/** Selector Activos / De baja / Todos que acompaña al buscador. */
export function SelectorEstado({ valor, onCambiar, etiqueta }: {
  valor: FiltroEstado;
  onCambiar: (valor: FiltroEstado) => void;
  /** Para lectores de pantalla, ej. "Mostrar aeropuertos". */
  etiqueta: string;
}) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="inline-flex rounded-md border border-zinc-300 bg-white p-0.5 text-sm">
      {OPCIONES.map((opcion) => (
        <button key={opcion.valor} type="button" role="radio" aria-checked={valor === opcion.valor}
          onClick={() => onCambiar(opcion.valor)}
          className={`rounded px-3 py-1.5 font-medium transition ${
            valor === opcion.valor ? "bg-primary text-primary-foreground" : "text-zinc-600 hover:bg-tertiary"
          }`}>
          {opcion.etiqueta}
        </button>
      ))}
    </div>
  );
}
