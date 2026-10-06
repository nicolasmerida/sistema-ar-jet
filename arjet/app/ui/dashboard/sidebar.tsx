import { PlaneTakeoff } from "lucide-react";
import { NavLinks } from "./nav-links";

export function Sidebar() {
  return (
    <aside className="border-b border-zinc-200 bg-tertiary px-4 py-4 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
      <div className="mb-5 flex items-center gap-3 px-2 lg:mb-8">
        <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <PlaneTakeoff className="size-5" aria-hidden="true" />
        </span>
        <span className="text-lg font-bold tracking-normal text-secondary">
          AR Jet
        </span>
      </div>

      <nav
        aria-label="Menú principal"
        className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible"
      >
        <NavLinks />
      </nav>
    </aside>
  );
}
