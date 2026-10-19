"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tickets } from "lucide-react";

const navegacionMostrador = [
  { label: "Consulta de reservas", href: "/mostrador/reservas", icon: Tickets },
];

function useItemActivo() {
  const pathname = usePathname();

  return navegacionMostrador.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
}

export function NavLinksMostrador() {
  const itemActivo = useItemActivo();

  return (
    <>
      {navegacionMostrador.map((item) => {
        const Icon = item.icon;
        const activo = item.href === itemActivo?.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={activo ? "page" : undefined}
            className={`flex min-w-max items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition lg:min-w-0 ${
              activo
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

export function TituloMostrador() {
  return <>{useItemActivo()?.label ?? "Mostrador"}</>;
}
