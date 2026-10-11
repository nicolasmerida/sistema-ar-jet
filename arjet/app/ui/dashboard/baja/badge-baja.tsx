import { fechaCortaDeInstante } from "../vuelos/formato";

/** "De baja desde 10/10/2026" */
export function BadgeBaja({ fechaBaja }: { fechaBaja: string | null }) {
  return (
    <span className="inline-flex rounded-md bg-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-300">
      De baja{fechaBaja ? ` desde ${fechaCortaDeInstante(fechaBaja)}` : ""}
    </span>
  );
}
