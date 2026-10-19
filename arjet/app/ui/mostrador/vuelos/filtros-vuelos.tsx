import { LoaderCircle, Search } from "lucide-react";
import type { FiltrosVuelos } from "@/lib/mostrador/vuelos/tipos";
import type { OpcionAeropuerto } from "@/lib/vuelos/tipos";
import { Campo, claseControl } from "@/app/ui/dashboard/vuelos/campo";

type Props = {
  filtros: FiltrosVuelos;
  errores: Partial<Record<keyof FiltrosVuelos, string>>;
  aeropuertos: OpcionAeropuerto[];
  consultando: boolean;
  onCambiar: (campo: keyof FiltrosVuelos, valor: string) => void;
  onBuscar: () => void;
  onLimpiar: () => void;
};

export function FiltrosEstadoVuelos({ filtros, errores, aeropuertos, consultando, onCambiar, onBuscar, onLimpiar }: Props) {
  return (
    <form
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        onBuscar();
      }}
      className="grid items-start gap-4 rounded-md border border-zinc-200 bg-white p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[170px_minmax(0,1fr)_minmax(0,1fr)_150px]"
    >
      <Campo id="filtro-fecha" etiqueta="Fecha de salida" error={errores.fecha}>
        <input
          id="filtro-fecha"
          type="date"
          value={filtros.fecha}
          disabled={consultando}
          aria-invalid={Boolean(errores.fecha)}
          aria-describedby={errores.fecha ? "filtro-fecha-error" : undefined}
          className={`${claseControl(errores.fecha)} min-w-0`}
          onChange={(evento) => onCambiar("fecha", evento.target.value)}
        />
      </Campo>

      {(["origen", "destino"] as const).map((campo) => (
        <Campo key={campo} id={`filtro-${campo}`} etiqueta={campo === "origen" ? "Origen" : "Destino"} error={errores[campo]} obligatorio={false}>
          <select
            id={`filtro-${campo}`}
            value={filtros[campo]}
            disabled={consultando}
            aria-invalid={Boolean(errores[campo])}
            aria-describedby={errores[campo] ? `filtro-${campo}-error` : undefined}
            className={`${claseControl(errores[campo])} min-w-0`}
            onChange={(evento) => onCambiar(campo, evento.target.value)}
          >
            <option value="">{campo === "origen" ? "Todos los orígenes" : "Todos los destinos"}</option>
            {aeropuertos.map((aeropuerto) => (
              <option key={aeropuerto.id} value={aeropuerto.id}>
                {aeropuerto.ciudad} - {aeropuerto.nombre} ({aeropuerto.codigo})
              </option>
            ))}
          </select>
        </Campo>
      ))}

      <Campo id="filtro-numero" etiqueta="Número de vuelo" error={errores.numero} obligatorio={false}>
        <input
          id="filtro-numero"
          type="text"
          value={filtros.numero}
          placeholder="Ej: AN-824"
          autoComplete="off"
          disabled={consultando}
          aria-invalid={Boolean(errores.numero)}
          aria-describedby={errores.numero ? "filtro-numero-error" : undefined}
          className={`${claseControl(errores.numero)} min-w-0`}
          onChange={(evento) => onCambiar("numero", evento.target.value)}
        />
      </Campo>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
        <button
          type="submit"
          disabled={consultando}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {consultando ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
          {consultando ? "Buscando..." : "Buscar"}
        </button>
        <button
          type="button"
          disabled={consultando}
          onClick={onLimpiar}
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-secondary/20 px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-secondary hover:text-secondary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          Volver a hoy
        </button>
      </div>
    </form>
  );
}
