import { Search } from "lucide-react";

type BuscadorProps = {
  valor: string;
  onCambiar: (valor: string) => void;
};

export function Buscador({ valor, onCambiar }: BuscadorProps) {
  return (
    <div className="relative w-full max-w-md">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
        aria-hidden="true"
      />
      <input
        type="search"
        value={valor}
        onChange={(event) => onCambiar(event.target.value)}
        placeholder="Buscar por código, nombre, ciudad o país"
        aria-label="Buscar aeropuertos"
        className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-primary focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}
