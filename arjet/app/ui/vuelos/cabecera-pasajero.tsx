import { SignOutButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { LogOut } from "lucide-react";
import { TituloPasajero } from "@/app/ui/pasajeros/nav-links";

export async function CabeceraPasajero() {
  const usuario = await currentUser();
  const nombre = [usuario?.firstName, usuario?.lastName].filter(Boolean).join(" ") || "Pasajero";
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex min-h-20 max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
        <div><p className="text-xs font-semibold uppercase text-zinc-500">Panel de pasajeros</p><p className="mt-1 text-lg font-semibold"><TituloPasajero /></p></div>
        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="max-w-64 truncate text-sm font-semibold">{nombre}</p>
            <p className="text-xs text-zinc-500">Pasajero</p>
          </div>
          <SignOutButton redirectUrl="/">
            <button type="button" className="inline-flex items-center gap-2 rounded-md border border-secondary/20 px-3 py-2 text-sm font-semibold text-secondary transition hover:bg-secondary hover:text-secondary-foreground">
              <LogOut className="size-4" aria-hidden="true" />Cerrar sesión
            </button>
          </SignOutButton>
        </div>
      </div>
    </header>
  );
}
