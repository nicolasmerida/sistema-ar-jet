import { Logo } from "../logo";
import { NavLinks } from "./nav-links";

export function Sidebar() {
  return (
    <aside className="border-b border-zinc-200 bg-tertiary px-4 py-4 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
      <div className="mb-5 px-2 lg:mb-8">
        <Logo />
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
