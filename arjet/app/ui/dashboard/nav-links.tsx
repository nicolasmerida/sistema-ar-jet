"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "./dashboard-data";

export function useActiveNavigationItem() {
  const pathname = usePathname();

  return navigationItems.find((item) =>
    item.href === "/dashboard"
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}

export function NavLinks() {
  const activeItem = useActiveNavigationItem();

  return (
    <>
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const active = item.href === activeItem?.href;

        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-w-max items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition lg:min-w-0 ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-zinc-700 hover:bg-white hover:text-secondary"
            }`}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function ActivePageTitle() {
  return <>{useActiveNavigationItem()?.label ?? "Inicio"}</>;
}
