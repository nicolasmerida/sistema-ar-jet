import { currentUser } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { ActivePageTitle } from "./nav-links";

export async function Topbar() {
  const user = await currentUser();
  const nombre =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.primaryEmailAddress?.emailAddress ||
    "Usuario";
  const rol = (user?.publicMetadata?.role as string | undefined) ?? "Pasajero";

  return (
    <header className="flex min-h-20 items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 py-4 sm:px-6 lg:px-10">
      <div>
        <p className="text-xs font-semibold uppercase text-zinc-500">
          Dashboard
        </p>
        <p className="mt-1 text-lg font-semibold text-foreground">
          <ActivePageTitle />
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-foreground">{nombre}</p>
          <p className="text-xs capitalize text-zinc-500">{rol}</p>
        </div>
        <SignOutButton redirectUrl="/">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-secondary/20 px-3 py-2 text-sm font-semibold text-secondary transition hover:bg-secondary hover:text-secondary-foreground"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span>Cerrar sesión</span>
          </button>
        </SignOutButton>
      </div>
    </header>
  );
}
