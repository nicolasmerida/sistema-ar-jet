import { PlaneTakeoff } from "lucide-react";
import Link from "next/link";
import { navigationItems } from "./dashboard-data";

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
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={`flex min-w-max items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition lg:min-w-0 ${
                item.active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-zinc-700 hover:bg-white hover:text-secondary"
              }`}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
