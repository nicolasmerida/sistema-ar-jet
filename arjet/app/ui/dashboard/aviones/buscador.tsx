import { Search } from "lucide-react";

export function Buscador({ valor, onCambiar }: { valor: string; onCambiar: (valor: string) => void }) {
  return (
    <div className="relative w-full max-w-xl">
      <label htmlFor="buscar-aviones" className="sr-only">Buscar por matrícula o modelo</label>
      <Search className="pointer-events-none absolute left-3 top-3 size-4 text-zinc-400" aria-hidden="true" />
      <input id="buscar-aviones" type="search" value={valor} onChange={(event) => onCambiar(event.target.value)}
        placeholder="Buscar por matrícula o modelo" className="w-full rounded-md border border-zinc-300 bg-background py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-zinc-400 focus:border-primary focus:ring-2 focus:ring-primary/30" />
    </div>
  );
}
