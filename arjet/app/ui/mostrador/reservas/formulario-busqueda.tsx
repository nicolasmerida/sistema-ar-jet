import { Search } from "lucide-react";
import { CRITERIOS, ETIQUETA_CRITERIO } from "@/lib/mostrador/tipos";
import type { Criterio, FiltroEstado } from "@/lib/mostrador/tipos";

const EJEMPLO: Record<Criterio, string> = {
  dni: "Ej: 30123456",
  nombre: "Ej: Juan Pérez",
  codigo: "Ej: 1024 o RES-1024",
};

type Props = {
  criterio: Criterio;
  valor: string;
  filtro: FiltroEstado;
  error: string | null;
  buscando: boolean;
  onCriterio: (criterio: Criterio) => void;
  onValor: (valor: string) => void;
  onFiltro: (filtro: FiltroEstado) => void;
  onBuscar: () => void;
};

const base =
  "w-full rounded-md border bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:ring-2";

export function FormularioBusqueda({
  criterio, valor, filtro, error, buscando, onCriterio, onValor, onFiltro, onBuscar,
}: Props) {
  return (
    <form
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        onBuscar();
      }}
      className="flex flex-col gap-4 rounded-md border border-zinc-200 bg-white p-4 sm:p-5"
    >
      <div className="grid gap-4 md:grid-cols-[220px_1fr_auto] md:items-start">
        <div>
          <label htmlFor="criterio" className="mb-1 block text-sm font-medium text-zinc-700">Buscar por</label>
          <select
            id="criterio"
            value={criterio}
            onChange={(evento) => onCriterio(evento.target.value as Criterio)}
            className={`${base} border-zinc-300 focus:border-primary focus:ring-primary/30`}
          >
            {CRITERIOS.map((opcion) => (
              <option key={opcion} value={opcion}>{ETIQUETA_CRITERIO[opcion]}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="valor" className="mb-1 block text-sm font-medium text-zinc-700">Valor a buscar</label>
          <input
            id="valor"
            type="text"
            value={valor}
            onChange={(evento) => onValor(evento.target.value)}
            placeholder={EJEMPLO[criterio]}
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "valor-error" : undefined}
            className={`${base} ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                : "border-zinc-300 focus:border-primary focus:ring-primary/30"
            }`}
          />
          {error && <p id="valor-error" role="alert" className="mt-1 text-xs font-medium text-red-700">{error}</p>}
        </div>

        <div>
          <span className="mb-1 block select-none text-sm" aria-hidden="true">&nbsp;</span>
          <button
            type="submit"
            disabled={buscando}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Search className="size-4" aria-hidden="true" />
            {buscando ? "Buscando..." : "Buscar"}
          </button>
        </div>
      </div>

      <fieldset className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <legend className="sr-only">Estado de la reserva</legend>
        <span className="text-sm font-medium text-zinc-700" aria-hidden="true">Mostrar:</span>
        {([["pendientes", "Solo pendientes de pago"], ["todas", "Todas las reservas"]] as const).map(([opcion, etiqueta]) => (
          <label key={opcion} className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
            <input
              type="radio"
              name="filtro-estado"
              value={opcion}
              checked={filtro === opcion}
              onChange={() => onFiltro(opcion)}
              className="size-4 accent-[var(--color-primary)]"
            />
            {etiqueta}
          </label>
        ))}
      </fieldset>
    </form>
  );
}
