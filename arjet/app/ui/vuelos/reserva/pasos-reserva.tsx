import { Check } from "lucide-react";

export function PasosReserva({ reservada = false }: { reservada?: boolean }) {
  return (
    <ol aria-label="Etapas de compra" className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-zinc-200 pb-5 text-sm">
      {["Búsqueda", "Pasajeros y clase", "Pago"].map((paso, indice) => (
        <li key={paso} aria-current={indice === (reservada ? 2 : 1) ? "step" : undefined}
          className={`flex items-center gap-2 ${indice === 2 && !reservada ? "text-zinc-400" : "font-medium text-secondary"}`}>
          <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs ${indice === (reservada ? 2 : 1) ? "bg-primary text-primary-foreground" : "border border-current"}`}>
            {indice === 0 || (indice === 1 && reservada) ? <Check className="size-3.5" aria-hidden="true" /> : indice + 1}
          </span>{paso}
        </li>
      ))}
    </ol>
  );
}
