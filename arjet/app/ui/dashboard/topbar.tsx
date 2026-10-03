import { LogOut } from "lucide-react";

export function Topbar() {
  return (
    <header className="flex min-h-20 items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 py-4 sm:px-6 lg:px-10">
      <div>
        <p className="text-xs font-semibold uppercase text-zinc-500">
          Dashboard
        </p>
        <p className="mt-1 text-lg font-semibold text-foreground">Inicio</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-foreground">Admin AR Jet</p>
          <p className="text-xs text-zinc-500">Administrador</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-secondary/20 px-3 py-2 text-sm font-semibold text-secondary transition hover:bg-secondary hover:text-secondary-foreground"
        >
          <LogOut className="size-4" aria-hidden="true" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
}
