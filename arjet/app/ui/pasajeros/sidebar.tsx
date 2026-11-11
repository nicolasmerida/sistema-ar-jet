import { Logo } from "@/app/ui/logo";
import { NavLinksPasajero } from "./nav-links";

export function SidebarPasajero() {
  return (
    <aside className="min-w-0 border-b border-zinc-200 bg-tertiary px-4 py-4 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
      <div className="mb-5 px-2 lg:mb-8"><Logo /></div>
      <nav aria-label="Menú de pasajeros" className="flex flex-wrap gap-2 lg:flex-col"><NavLinksPasajero /></nav>
    </aside>
  );
}
